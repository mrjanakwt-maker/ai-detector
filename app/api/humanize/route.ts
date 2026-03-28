import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, flagged_sentences } = body;

    if (!text || text.trim().length < 50) {
      return NextResponse.json(
        { error: "Please provide at least 50 characters of text." },
        { status: 400 }
      );
    }

    const flaggedTexts = Array.isArray(flagged_sentences)
      ? flagged_sentences.map((s: { text?: string } | string) =>
          typeof s === "string" ? s : s.text || ""
        )
      : [];

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
- Keep the same overall length and meaning

${
  flaggedTexts.length > 0
    ? `These sentences were flagged as most AI-like, pay special attention to rewriting them:\n${flaggedTexts.map((s: string, i: number) => `${i + 1}. "${s}"`).join("\n")}\n`
    : ""
}
Respond ONLY with the rewritten text, no explanations or preamble.

Original text:
${text.slice(0, 3000)}`,
        },
      ],
    });

    const rewritten =
      message.content[0].type === "text" ? message.content[0].text.trim() : "";

    if (!rewritten) {
      return NextResponse.json(
        { error: "Failed to humanize text." },
        { status: 500 }
      );
    }

    return NextResponse.json({ rewritten_text: rewritten });
  } catch (error) {
    console.error("Humanize API error:", error);
    return NextResponse.json(
      { error: "Failed to humanize text. Please try again." },
      { status: 500 }
    );
  }
}
