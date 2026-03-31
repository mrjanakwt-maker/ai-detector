import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const HF_API_KEY = process.env.HF_API_KEY;
const SAPLING_API_KEY = process.env.SAPLING_API_KEY;

// Query HuggingFace with retry for cold-start models (503 = loading)
async function queryHuggingFace(
  model: string,
  text: string,
  retries = 2
): Promise<unknown> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(
        `https://router.huggingface.co/hf-inference/models/${model}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${HF_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ inputs: text.slice(0, 512) }),
        }
      );

      // Model is loading — wait and retry
      if (response.status === 503 && attempt < retries) {
        const body = await response.json().catch(() => null);
        const wait = body?.estimated_time
          ? Math.min(body.estimated_time * 1000, 20000)
          : 10000;
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }

      if (!response.ok) {
        console.error(
          `HF model ${model} returned ${response.status}:`,
          await response.text().catch(() => "")
        );
        return null;
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error(`HF model ${model} fetch error:`, err);
      if (attempt === retries) return null;
    }
  }
  return null;
}

// Query Sapling AI Detector API (free tier: 50K chars/day)
async function querySapling(text: string): Promise<{ score: number; sentence_scores?: Array<{ sentence: string; score: number }> } | null> {
  if (!SAPLING_API_KEY) {
    console.error("SAPLING_API_KEY is not set");
    return null;
  }
  try {
    const response = await fetch("https://api.sapling.ai/api/v1/aidetect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: SAPLING_API_KEY,
        text: text.slice(0, 8000),
        sent_scores: true,
      }),
    });
    if (!response.ok) {
      console.error("Sapling API error:", response.status, await response.text().catch(() => ""));
      return null;
    }
    const data = await response.json();
    return {
      score: typeof data.score === "number" ? data.score : null,
      sentence_scores: data.sentence_scores || [],
    };
  } catch (err) {
    console.error("Sapling fetch error:", err);
    return null;
  }
}

// Extract AI probability score from HuggingFace response
// Each model uses different label names — this handles all known formats
function extractAIScore(
  result: unknown,
  aiLabels: string[],
  humanLabels: string[]
): number | null {
  try {
    if (!result) return null;

    // HF classification responses come as [[{label, score}, ...]] or [{label, score}, ...]
    let arr: Array<{ label: string; score: number }> | null = null;

    if (Array.isArray(result)) {
      if (Array.isArray(result[0])) {
        arr = result[0];
      } else if (result[0] && typeof result[0] === "object" && "label" in result[0]) {
        arr = result;
      }
    }

    if (!arr || arr.length === 0) return null;

    // Normalize labels to lowercase for comparison
    const aiSet = new Set(aiLabels.map((l) => l.toLowerCase()));
    const humanSet = new Set(humanLabels.map((l) => l.toLowerCase()));

    for (const item of arr) {
      const label = String(item.label).toLowerCase();
      const score = Number(item.score);
      if (isNaN(score)) continue;

      if (aiSet.has(label)) {
        return Math.round(score * 100);
      }
      if (humanSet.has(label)) {
        return Math.round((1 - score) * 100);
      }
    }

    return null;
  } catch {
    return null;
  }
}

async function claudeAnalysis(text: string) {
  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `You are an expert AI content detector. Your goal is to accurately distinguish between human-written and AI-generated text. You must be accurate in BOTH directions — catching real AI text AND not falsely flagging human text.

HOW TO DETECT AI-GENERATED TEXT (score 70-100%):
- Unnaturally smooth, polished prose with no errors or rough edges
- Consistent sentence rhythm and length throughout — lacks variation
- Generic transitional phrases used repeatedly ("Furthermore", "Moreover", "Additionally", "It is important to note")
- Vague generalizations and platitudes instead of specific concrete details
- Perfectly parallel sentence structures and balanced arguments
- Overly comprehensive coverage — hits every angle too neatly
- Lacks personal voice, opinions, or unique perspective
- "In today's rapidly evolving world..." and similar cliché openings
- Every paragraph follows the same structure (topic sentence → explanation → conclusion)

HOW TO DETECT HUMAN-WRITTEN TEXT (score 0-30%):
- Grammatical errors, typos, awkward phrasing — AI rarely makes these
- Inconsistent tone — shifts between formal and informal
- Run-on sentences, fragments, or unusual punctuation
- Specific citations, dates, researcher names, and domain expertise
- Personal anecdotes, opinions, hedging ("I think", "probably", "sort of")
- Uneven paragraph lengths and structure
- Tangents, digressions, or incomplete thoughts
- Use of contractions, slang, or colloquialisms
- Formatting inconsistencies

SCORING GUIDE:
- 85-100%: Almost certainly AI-generated (smooth, generic, no errors, templated structure)
- 65-84%: Likely AI (mostly smooth with minor human touches)
- 35-64%: Mixed or uncertain
- 15-34%: Likely human (has human markers but some polished sections)
- 0-14%: Almost certainly human (clear errors, personal voice, specific details)

Respond ONLY with this exact JSON format, no other text:
{"ai_probability": <number 0-100>, "summary": "<one sentence assessment>", "flagged_sentences": [{"text": "<exact sentence from text>", "reason": "<brief reason why it seems AI>", "ai_score": <number 0-100>}]}

Include sentences scoring above 60 as AI-like. Order by ai_score descending. If the text appears human-written, return an empty flagged_sentences array.

Text: ${text.slice(0, 3000)}`,
        },
      ],
    });
    const raw =
      message.content[0].type === "text" ? message.content[0].text : "";
    return JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch {
    return null;
  }
}

async function claudeHumanize(text: string, flaggedSentences: string[]) {
  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `You are an expert editor who makes AI-generated text sound naturally human-written. Rewrite the following text to sound more human while preserving the core meaning and ideas.

Key changes to make:
- Vary sentence length and structure (mix short punchy sentences with longer ones)
- Add natural hedging ("I think", "probably", "it seems like", "honestly")
- Use contractions (don't, isn't, won't, etc.)
- Add personal touches and informal transitions
- Break up overly polished or parallel structures
- Use more concrete/specific language instead of abstract generalizations
- Add slight imperfections that humans naturally have
- Vary vocabulary (don't repeat the same sophisticated words)

These sentences were flagged as most AI-like, pay special attention to rewriting them:
${flaggedSentences.map((s, i) => `${i + 1}. "${s}"`).join("\n")}

Respond ONLY with the rewritten text, no explanations or preamble.

Original text:
${text.slice(0, 3000)}`,
        },
      ],
    });
    const raw =
      message.content[0].type === "text" ? message.content[0].text : "";
    return raw.trim();
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text } = body;

    if (!text || text.trim().length < 50) {
      return NextResponse.json(
        { error: "Please provide at least 50 characters of text." },
        { status: 400 }
      );
    }

    // Check that HF key exists
    if (!HF_API_KEY) {
      console.error("HF_API_KEY is not set in environment variables");
    }

    const [engine1, engine2, engine3, engine4, engine5, saplingResult, claudeResult] =
      await Promise.all([
        queryHuggingFace(
          "openai-community/roberta-large-openai-detector",
          text
        ),
        queryHuggingFace(
          "fakespot-ai/roberta-base-ai-text-detection-v1",
          text
        ),
        queryHuggingFace(
          "PirateXX/AI-Content-Detector",
          text
        ),
        queryHuggingFace(
          "TrustSafeAI/RADAR-Vicuna-7B",
          text
        ),
        queryHuggingFace(
          "Hello-SimpleAI/chatgpt-detector-roberta",
          text
        ),
        querySapling(text),
        claudeAnalysis(text),
      ]);

    // Debug: log raw responses in development
    if (process.env.NODE_ENV === "development") {
      console.log("Engine 1 (RoBERTa Large) raw:", JSON.stringify(engine1));
      console.log("Engine 2 (Fakespot) raw:", JSON.stringify(engine2));
      console.log("Engine 3 (PirateXX) raw:", JSON.stringify(engine3));
      console.log("Engine 4 (RADAR) raw:", JSON.stringify(engine4));
      console.log("Engine 5 (ChatGPT) raw:", JSON.stringify(engine5));
      console.log("Sapling raw:", JSON.stringify(saplingResult));
    }

    // Label mappings (verified via curl testing):
    // RoBERTa Large OpenAI: LABEL_1 = Fake/AI, LABEL_0 = Real/Human
    // Fakespot: "AI" = AI, "Human" = Human
    // PirateXX: LABEL_1 = AI, LABEL_0 = Human
    // RADAR: LABEL_0 = AI, LABEL_1 = Human (reversed!)
    // Hello-SimpleAI: "ChatGPT" = AI, "Human" = Human

    const engines = [
      {
        name: "RoBERTa Large (OpenAI)",
        ai_score: extractAIScore(
          engine1,
          ["Fake", "LABEL_1"],
          ["Real", "LABEL_0"]
        ),
        status: engine1 ? "success" : "error",
        raw_response: engine1 ? "received" : "no response",
      },
      {
        name: "AI Text Detector (Fakespot)",
        ai_score: extractAIScore(
          engine2,
          ["AI", "Fake", "LABEL_1", "ai-generated"],
          ["Human", "Real", "LABEL_0", "human-written"]
        ),
        status: engine2 ? "success" : "error",
        raw_response: engine2 ? "received" : "no response",
      },
      {
        name: "AI Content Detector (PirateXX)",
        ai_score: extractAIScore(
          engine3,
          ["LABEL_1", "Fake", "ai"],
          ["LABEL_0", "Real", "human"]
        ),
        status: engine3 ? "success" : "error",
        raw_response: engine3 ? "received" : "no response",
      },
      {
        name: "RADAR Detector (TrustSafeAI)",
        ai_score: extractAIScore(
          engine4,
          ["LABEL_0"],
          ["LABEL_1"]
        ),
        status: engine4 ? "success" : "error",
        raw_response: engine4 ? "received" : "no response",
      },
      {
        name: "ChatGPT Detector (SimpleAI)",
        ai_score: extractAIScore(
          engine5,
          ["ChatGPT", "Fake", "LABEL_1", "ai", "generated"],
          ["Human", "Real", "LABEL_0", "human"]
        ),
        status: engine5 ? "success" : "error",
        raw_response: engine5 ? "received" : "no response",
      },
      {
        name: "Sapling AI Detector",
        ai_score: saplingResult?.score != null ? Math.round(saplingResult.score * 100) : null,
        status: saplingResult ? "success" : "error",
        raw_response: saplingResult ? "received" : "no response",
      },
      {
        name: "Linguistic Analysis (Claude)",
        ai_score: claudeResult?.ai_probability ?? null,
        status: claudeResult ? "success" : "error",
        raw_response: claudeResult ? "received" : "no response",
      },
    ];

    // Mark engines that got a response but failed score extraction
    for (const engine of engines) {
      if (engine.status === "success" && engine.ai_score === null) {
        engine.status = "parse_error";
      }
    }

    // Weighted consensus scoring
    // Claude gets highest weight (5x) — understands context, avoids false positives on human text
    // Sapling gets high weight (3x) — commercial-grade detector with low false positives
    // RADAR gets medium weight (2x) — adversarially trained
    // Other HF models get low weight (1x) — pattern-matchers prone to false positives
    // SimpleAI gets minimal weight (0.5x) — consistently unreliable
    const engineWeights: Record<string, number> = {
      "Linguistic Analysis (Claude)": 5,
      "Sapling AI Detector": 3,
      "RADAR Detector (TrustSafeAI)": 2,
      "RoBERTa Large (OpenAI)": 1,
      "AI Text Detector (Fakespot)": 1,
      "AI Content Detector (PirateXX)": 1,
      "ChatGPT Detector (SimpleAI)": 0.5,
    };

    // Trusted engines that don't get penalized for disagreeing with Claude
    const trustedEngines = new Set([
      "Linguistic Analysis (Claude)",
      "Sapling AI Detector",
    ]);

    // Step 1: Get Claude's score as the anchor (it understands context best)
    const claudeScore = claudeResult?.ai_probability ?? null;

    // Step 2: Calculate weighted consensus with smart disagreement handling
    // When an HF model strongly disagrees with Claude (>40 point gap),
    // reduce that model's weight — Claude's contextual analysis is more reliable
    let weightedSum = 0;
    let totalWeight = 0;
    for (const engine of engines) {
      if (engine.ai_score !== null && engine.status === "success") {
        let weight = engineWeights[engine.name] ?? 1;

        // Only penalize HF models for disagreeing with Claude, not Sapling
        if (
          claudeScore !== null &&
          !trustedEngines.has(engine.name)
        ) {
          const gap = Math.abs(engine.ai_score - claudeScore);
          if (gap > 60) {
            // Extreme disagreement: reduce weight to 25%
            weight *= 0.25;
          } else if (gap > 40) {
            // Strong disagreement: reduce weight to 50%
            weight *= 0.5;
          }
        }

        weightedSum += engine.ai_score * weight;
        totalWeight += weight;
      }
    }

    const validScores = engines
      .filter((e) => e.ai_score !== null && e.status === "success")
      .map((e) => e.ai_score as number);

    const consensusAI =
      totalWeight > 0
        ? Math.round(weightedSum / totalWeight)
        : 50;

    const consensusHuman = 100 - consensusAI;

    let verdict = "Mixed";
    if (consensusAI >= 85) verdict = "AI-Generated";
    else if (consensusAI >= 65) verdict = "Likely AI";
    else if (consensusAI <= 15) verdict = "Human-Written";
    else if (consensusAI <= 35) verdict = "Likely Human";

    return NextResponse.json({
      verdict,
      consensus_ai: consensusAI,
      consensus_human: consensusHuman,
      engines_used: validScores.length,
      engines: engines.map(({ raw_response, ...rest }) => rest),
      flagged_sentences: claudeResult?.flagged_sentences ?? [],
      summary: claudeResult?.summary ?? "Analysis complete.",
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Failed to analyze text. Please try again." },
      { status: 500 }
    );
  }
}