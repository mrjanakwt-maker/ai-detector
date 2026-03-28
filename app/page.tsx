"use client";
import { useState, useEffect } from "react";

interface EngineResult {
  name: string;
  ai_score: number | null;
  status: "success" | "error" | "parse_error" | string;
}

interface FlaggedSentence {
  text: string;
  reason: string;
  ai_score: number;
}

interface DetectionResult {
  verdict: string;
  consensus_ai: number;
  consensus_human: number;
  engines_used: number;
  engines: EngineResult[];
  flagged_sentences: FlaggedSentence[];
  summary: string;
}

export default function Home() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [charCount, setCharCount] = useState(0);
  const [usageCount, setUsageCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [humanizedText, setHumanizedText] = useState("");
  const [humanizing, setHumanizing] = useState(false);
  const FREE_LIMIT = 5;

  const displayUsage = mounted ? usageCount : 0;

  useEffect(() => {
    setMounted(true);
    try {
      const today = new Date().toDateString();
      const stored = localStorage.getItem("detector_usage");
      if (!stored) {
        localStorage.setItem(
          "detector_usage",
          JSON.stringify({ date: today, count: 0 })
        );
        setUsageCount(0);
      } else {
        const data = JSON.parse(stored);
        if (data.date !== today) {
          localStorage.setItem(
            "detector_usage",
            JSON.stringify({ date: today, count: 0 })
          );
          setUsageCount(0);
        } else {
          setUsageCount(typeof data.count === "number" ? data.count : 0);
        }
      }
    } catch {
      setUsageCount(0);
    }
  }, []);

  const handleDetect = async () => {
    if (!text.trim() || text.trim().length < 50) return;
    if (usageCount >= FREE_LIMIT) {
      setShowUpgrade(true);
      return;
    }

    setLoading(true);
    setResult(null);
    setError("");
    setShowUpgrade(false);
    setHumanizedText("");

    try {
      const response = await fetch("/api/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await response.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
        const newCount = usageCount + 1;
        setUsageCount(newCount);
        localStorage.setItem(
          "detector_usage",
          JSON.stringify({ date: new Date().toDateString(), count: newCount })
        );
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  const handleHumanize = async () => {
    if (!text.trim() || !result) return;
    setHumanizing(true);
    setHumanizedText("");
    try {
      const response = await fetch("/api/humanize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          flagged_sentences: result.flagged_sentences,
        }),
      });
      const data = await response.json();
      if (data.rewritten_text) {
        setHumanizedText(data.rewritten_text);
      } else {
        setError(data.error || "Failed to humanize text.");
      }
    } catch {
      setError("Failed to humanize text. Please try again.");
    }
    setHumanizing(false);
  };

  const highlightText = (
    inputText: string,
    flagged: FlaggedSentence[]
  ): React.ReactNode[] => {
    if (!flagged || flagged.length === 0) return [inputText];

    const parts: React.ReactNode[] = [];
    let remaining = inputText;
    let keyIndex = 0;

    // Sort flagged by position in text
    const sorted = [...flagged]
      .filter((f) => remaining.includes(f.text))
      .sort((a, b) => remaining.indexOf(a.text) - remaining.indexOf(b.text));

    for (const flag of sorted) {
      const idx = remaining.indexOf(flag.text);
      if (idx === -1) continue;

      // Add text before the match
      if (idx > 0) {
        parts.push(
          <span key={`t-${keyIndex++}`}>{remaining.slice(0, idx)}</span>
        );
      }

      // Add highlighted sentence
      const bgColor =
        flag.ai_score >= 80
          ? "bg-red-500/20 border-b-2 border-red-500/60"
          : flag.ai_score >= 60
            ? "bg-amber-500/15 border-b-2 border-amber-500/50"
            : "bg-yellow-500/10 border-b-2 border-yellow-500/40";

      parts.push(
        <span
          key={`h-${keyIndex++}`}
          className={`${bgColor} rounded-sm px-0.5 relative group cursor-help`}
          title={`AI Score: ${flag.ai_score}% — ${flag.reason}`}
        >
          {flag.text}
          <span className="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg text-xs text-zinc-300 whitespace-nowrap z-50 shadow-xl">
            <span className="font-bold text-red-400">{flag.ai_score}% AI</span>{" "}
            — {flag.reason}
          </span>
        </span>
      );

      remaining = remaining.slice(idx + flag.text.length);
    }

    // Add remaining text
    if (remaining) {
      parts.push(<span key={`t-${keyIndex++}`}>{remaining}</span>);
    }

    return parts;
  };

  const getVerdictColor = (verdict: string) => {
    if (verdict === "Human-Written")
      return {
        bg: "from-emerald-600 to-green-600",
        text: "text-emerald-400",
        ring: "ring-emerald-500/20",
      };
    if (verdict === "Likely Human")
      return {
        bg: "from-emerald-600 to-teal-600",
        text: "text-emerald-400",
        ring: "ring-emerald-500/20",
      };
    if (verdict === "Mixed")
      return {
        bg: "from-amber-600 to-yellow-600",
        text: "text-amber-400",
        ring: "ring-amber-500/20",
      };
    return {
      bg: "from-red-600 to-rose-600",
      text: "text-red-400",
      ring: "ring-red-500/20",
    };
  };

  const getAiScoreColor = (score: number) => {
    if (score >= 70) return "bg-red-500";
    if (score >= 40) return "bg-amber-500";
    return "bg-emerald-500";
  };

  const getEngineStatusInfo = (engine: EngineResult) => {
    if (engine.status === "success" && engine.ai_score !== null)
      return { dot: "bg-emerald-400", label: "Engine responded" };
    if (engine.status === "parse_error")
      return { dot: "bg-amber-400", label: "Unexpected response format" };
    return { dot: "bg-red-400", label: "Engine unavailable — may be loading" };
  };

  return (
    <div
      className="min-h-screen bg-[#08080d] text-white"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulse-glow {
          0%,
          100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.7;
          }
        }
        @keyframes scan {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(100%);
          }
        }
        .fade-in {
          animation: fadeInUp 0.5s ease-out forwards;
        }
        .fade-d1 {
          animation: fadeInUp 0.5s ease-out 0.1s forwards;
          opacity: 0;
        }
        .fade-d2 {
          animation: fadeInUp 0.5s ease-out 0.2s forwards;
          opacity: 0;
        }
        .fade-d3 {
          animation: fadeInUp 0.5s ease-out 0.3s forwards;
          opacity: 0;
        }
        .glow-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          animation: pulse-glow 5s ease-in-out infinite;
        }
        .scan-line {
          animation: scan 2s linear infinite;
        }
      `}</style>

      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "DetectAI",
            description:
              "Multi-engine AI content detection tool. Scan text through 6 independent AI detectors and get a consensus score.",
            url: "https://detectai.vercel.app",
            applicationCategory: "UtilityApplication",
            operatingSystem: "Web",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
              description: "5 free scans per day",
            },
          }),
        }}
      />

      {/* Nav */}
      <nav className="fade-in relative z-10 flex items-center justify-between px-6 md:px-12 py-5 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-sm font-bold">
            D
          </div>
          <span className="text-lg font-semibold tracking-tight">
            DetectAI
          </span>
          <span
            className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 ml-1"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            BETA
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span
            className="text-sm text-zinc-500 hidden sm:block"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            {displayUsage}/{FREE_LIMIT} free scans
          </span>
          <button
            onClick={() => setShowUpgrade(true)}
            className="text-sm px-4 py-2 rounded-full border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 transition-all duration-300"
          >
            Upgrade to Pro
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div
          className="glow-orb w-[500px] h-[500px] bg-cyan-600/10 -top-64 -left-64"
          style={{ position: "absolute" }}
        ></div>
        <div
          className="glow-orb w-[400px] h-[400px] bg-blue-600/10 top-0 -right-48"
          style={{ position: "absolute" }}
        ></div>
        <div className="relative z-10 max-w-3xl mx-auto px-6 pt-16 pb-8 text-center">
          <div
            className="fade-d1 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs mb-6"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            Multi-engine AI detection — 6 models, 1 verdict
          </div>
          <h1 className="fade-d2 text-4xl md:text-6xl font-bold tracking-tight leading-tight mb-4">
            Is it AI or
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              human-written?
            </span>
          </h1>
          <p className="fade-d3 text-zinc-400 text-lg md:text-xl max-w-xl mx-auto">
            Paste any text and scan it through 6 independent AI detection
            engines. Get an instant consensus verdict.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="fade-d3 flex justify-center gap-8 md:gap-16 py-6 border-y border-white/5 mb-10">
        {(
          [
            ["6", "Detection engines"],
            ["95%+", "Accuracy rate"],
            ["<5s", "Analysis time"],
          ] as const
        ).map(([num, label]) => (
          <div key={label} className="text-center">
            <div
              className="text-xl md:text-2xl font-bold"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              {num}
            </div>
            <div className="text-xs text-zinc-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Main Tool */}
      <div className="max-w-3xl mx-auto px-6 pb-20">
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl blur-sm group-hover:blur-md transition-all duration-500 opacity-0 group-hover:opacity-100"></div>
          <div className="relative bg-[#0e0e16] rounded-2xl border border-white/5 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
              <span
                className="text-xs text-zinc-500"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                Paste text to analyze
              </span>
              <div className="flex items-center gap-3">
                <span
                  className="text-xs text-zinc-600"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  {charCount.toLocaleString()} chars
                </span>
                {charCount > 0 && charCount < 50 && (
                  <span className="text-xs text-amber-500">Min 50 chars</span>
                )}
              </div>
            </div>
            <textarea
              className="w-full h-52 p-5 bg-transparent text-zinc-200 text-[15px] leading-relaxed focus:outline-none resize-none placeholder:text-zinc-600"
              placeholder="Paste an essay, article, email, or any text you want to check for AI content..."
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setCharCount(e.target.value.length);
              }}
            />
          </div>
        </div>

        {/* Button */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={handleDetect}
            disabled={loading || text.trim().length < 50}
            className={`relative px-8 py-3.5 rounded-xl font-semibold text-[15px] transition-all duration-300 ${
              loading
                ? "bg-cyan-600/50 text-cyan-200 cursor-wait"
                : text.trim().length >= 50
                  ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/25 hover:-translate-y-0.5"
                  : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
            }`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Scanning across 6 engines...
              </span>
            ) : (
              "Detect AI Content"
            )}
          </button>
          {text.trim() && !loading && (
            <button
              onClick={() => {
                setText("");
                setCharCount(0);
                setResult(null);
                setError("");
              }}
              className="px-4 py-3.5 rounded-xl text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-all text-sm"
            >
              Clear
            </button>
          )}
        </div>

        {/* Loading state with engine progress */}
        {loading && (
          <div className="mt-8 space-y-3">
            <div className="bg-[#0e0e16] rounded-2xl border border-white/5 p-5">
              <p
                className="text-xs text-zinc-500 mb-4"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                SCANNING ENGINES...
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  "RoBERTa Large (OpenAI)",
                  "AI Text Detector (Fakespot)",
                  "AI Content Detector (PirateXX)",
                  "RADAR Detector (TrustSafeAI)",
                  "ChatGPT Detector (SimpleAI)",
                  "Linguistic Analysis (Claude)",
                ].map((name, i) => (
                  <div
                    key={name}
                    className="rounded-xl bg-white/[0.02] border border-white/5 p-4"
                    style={{
                      animation: `fadeInUp 0.3s ease-out ${i * 0.1}s forwards`,
                      opacity: 0,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                      <span className="text-sm text-zinc-400">{name}</span>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden mt-3">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 scan-line"
                        style={{ width: "60%" }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Usage dots */}
        <div className="flex justify-center mt-4">
          <div className="flex items-center gap-1.5">
            {Array.from({ length: FREE_LIMIT }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${i < displayUsage ? "bg-cyan-500" : "bg-zinc-700"}`}
              />
            ))}
            <span
              className="text-xs text-zinc-600 ml-2"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              {FREE_LIMIT - displayUsage} left today
            </span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Upgrade Banner */}
        {showUpgrade && (
          <div className="mt-8 relative overflow-hidden rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 opacity-90"></div>
            <div className="relative z-10 p-8 text-center">
              <h2 className="text-2xl font-bold mb-2">Go unlimited</h2>
              <p className="text-cyan-100 mb-6 max-w-md mx-auto">
                Unlimited scans, all detection layers, sentence-level
                highlighting, and export reports.
              </p>
              <a
                href="#"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-cyan-700 font-bold rounded-xl hover:bg-cyan-50 transition-all hover:-translate-y-0.5"
              >
                Upgrade to Pro — $14.99/mo
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
              <p className="text-cyan-200/60 text-xs mt-4">
                Cancel anytime. Free scans reset daily.
              </p>
            </div>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div className="mt-8 space-y-4">
            {/* Verdict Card */}
            <div
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${getVerdictColor(result.verdict).bg} p-[1px]`}
            >
              <div className="bg-[#0e0e16] rounded-2xl p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div>
                    <p
                      className="text-xs text-zinc-500 mb-1"
                      style={{ fontFamily: "'Space Mono', monospace" }}
                    >
                      VERDICT
                    </p>
                    <h2
                      className={`text-3xl font-bold ${getVerdictColor(result.verdict).text}`}
                    >
                      {result.verdict}
                    </h2>
                    <p className="text-zinc-400 text-sm mt-2">
                      {result.summary}
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-center">
                      <div className="w-20 h-20 rounded-full border-4 border-red-500/30 flex items-center justify-center relative">
                        <span
                          className="text-2xl font-bold text-red-400"
                          style={{ fontFamily: "'Space Mono', monospace" }}
                        >
                          {result.consensus_ai}%
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-2">
                        Consensus AI
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="w-20 h-20 rounded-full border-4 border-emerald-500/30 flex items-center justify-center">
                        <span
                          className="text-2xl font-bold text-emerald-400"
                          style={{ fontFamily: "'Space Mono', monospace" }}
                        >
                          {result.consensus_human}%
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-2">
                        Consensus Human
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Engine Results */}
            <div className="bg-[#0e0e16] rounded-2xl border border-white/5 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-zinc-200">
                  Engine results
                </h3>
                <span
                  className="text-xs text-zinc-500"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  {result.engines_used}/6 responded
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.engines.map((engine, i) => {
                  const aiScore = engine.ai_score ?? 0;
                  const isWorking =
                    engine.status === "success" && engine.ai_score !== null;
                  const statusInfo = getEngineStatusInfo(engine);
                  return (
                    <div
                      key={engine.name + i}
                      className="rounded-xl bg-white/[0.02] border border-white/5 p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${statusInfo.dot}`}
                          ></span>
                          <span className="text-sm text-zinc-300">
                            {engine.name}
                          </span>
                        </div>
                        <span
                          className={`text-sm font-bold ${
                            !isWorking
                              ? "text-zinc-600"
                              : aiScore >= 70
                                ? "text-red-400"
                                : aiScore >= 40
                                  ? "text-amber-400"
                                  : "text-emerald-400"
                          }`}
                          style={{ fontFamily: "'Space Mono', monospace" }}
                        >
                          {isWorking ? `${aiScore}%` : "—"}
                        </span>
                      </div>
                      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        {isWorking && (
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ${getAiScoreColor(aiScore)}`}
                            style={{ width: `${aiScore}%` }}
                          ></div>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-600 mt-2">
                        {statusInfo.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Highlighted Text View */}
            {result.flagged_sentences && result.flagged_sentences.length > 0 && (
              <div className="bg-[#0e0e16] rounded-xl border border-white/5 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                    <span
                      className="text-xs text-zinc-500"
                      style={{ fontFamily: "'Space Mono', monospace" }}
                    >
                      Text analysis — hover highlighted text for details
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px]" style={{ fontFamily: "'Space Mono', monospace" }}>
                    <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded bg-red-500/40"></span> High AI</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded bg-amber-500/40"></span> Medium</span>
                  </div>
                </div>
                <div className="text-sm text-zinc-300 leading-relaxed p-4 bg-white/[0.02] rounded-lg border border-white/5">
                  {highlightText(text, result.flagged_sentences)}
                </div>
              </div>
            )}

            {/* Flagged Sentences List */}
            {result.flagged_sentences && result.flagged_sentences.length > 0 && (
              <div className="bg-[#0e0e16] rounded-xl border border-red-500/10 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                    <span
                      className="text-xs text-zinc-500"
                      style={{ fontFamily: "'Space Mono', monospace" }}
                    >
                      {result.flagged_sentences.length} sentences flagged as AI
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  {result.flagged_sentences.map((sentence, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 text-sm text-zinc-400 pl-4 border-l-2 border-red-500/30 py-2"
                    >
                      <div className="flex-1">
                        <p>{typeof sentence === "string" ? sentence : sentence.text}</p>
                        {typeof sentence !== "string" && sentence.reason && (
                          <p className="text-xs text-zinc-600 mt-1">{sentence.reason}</p>
                        )}
                      </div>
                      {typeof sentence !== "string" && sentence.ai_score && (
                        <span
                          className={`text-xs font-bold shrink-0 ${
                            sentence.ai_score >= 80
                              ? "text-red-400"
                              : "text-amber-400"
                          }`}
                          style={{ fontFamily: "'Space Mono', monospace" }}
                        >
                          {sentence.ai_score}%
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Make it Human Section */}
            {result.consensus_ai >= 40 && (
              <div className="bg-[#0e0e16] rounded-xl border border-cyan-500/20 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">✏️</span>
                      <h3 className="text-sm font-semibold text-zinc-200">
                        Make it human
                      </h3>
                    </div>
                    <p className="text-xs text-zinc-500">
                      Rewrite your text to bypass AI detectors while keeping the
                      same meaning
                    </p>
                  </div>
                  <button
                    onClick={handleHumanize}
                    disabled={humanizing}
                    className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                      humanizing
                        ? "bg-cyan-600/30 text-cyan-300 cursor-wait"
                        : "bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/20 hover:-translate-y-0.5"
                    }`}
                  >
                    {humanizing ? (
                      <span className="flex items-center gap-2">
                        <svg
                          className="animate-spin h-3.5 w-3.5"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        Rewriting...
                      </span>
                    ) : (
                      "Humanize Text"
                    )}
                  </button>
                </div>

                {humanizedText && (
                  <div className="mt-4 space-y-3">
                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className="text-xs text-emerald-400"
                          style={{ fontFamily: "'Space Mono', monospace" }}
                        >
                          HUMANIZED VERSION
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(humanizedText);
                          }}
                          className="text-xs text-zinc-500 hover:text-cyan-400 transition-colors px-2 py-1 rounded hover:bg-white/5"
                        >
                          Copy
                        </button>
                      </div>
                      <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                        {humanizedText}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setText(humanizedText);
                          setCharCount(humanizedText.length);
                          setResult(null);
                          setHumanizedText("");
                        }}
                        className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors px-3 py-1.5 rounded-lg border border-cyan-500/20 hover:bg-cyan-500/10"
                      >
                        Re-scan humanized text
                      </button>
                      <span className="text-xs text-zinc-600">
                        Check if the rewritten version passes detection
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* How it works */}
            <div className="bg-[#0e0e16] rounded-xl border border-white/5 p-5">
              <h3 className="text-sm font-semibold text-zinc-200 mb-2">
                How it works
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                DetectAI runs your text through 6 independent AI detection
                models simultaneously and calculates a consensus score. This
                multi-engine approach is more accurate than any single detector
                — similar to how VirusTotal aggregates antivirus results.
              </p>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: "🔬",
              title: "6 detection engines",
              desc: "RoBERTa models, academic detectors, and Claude linguistic analysis — all checked simultaneously.",
            },
            {
              icon: "🎯",
              title: "Sentence-level flagging",
              desc: "See exactly which sentences triggered detection, not just a percentage.",
            },
            {
              icon: "🛡️",
              title: "Private and secure",
              desc: "Text is analyzed in real-time and never stored. Your content stays yours.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="p-5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-cyan-500/20 transition-all duration-300"
            >
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
              <p className="text-zinc-500 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Use cases */}
        <div className="mt-16 text-center">
          <h2 className="text-xl font-bold mb-6">Trusted by</h2>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              "Students",
              "Teachers",
              "Professors",
              "Writers",
              "Editors",
              "SEO specialists",
              "Publishers",
              "HR teams",
            ].map((role) => (
              <span
                key={role}
                className="px-4 py-2 rounded-full bg-white/[0.03] border border-white/5 text-zinc-400 text-sm hover:border-cyan-500/30 hover:text-cyan-400 transition-all duration-300 cursor-default"
              >
                {role}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-[10px] font-bold">
                D
              </div>
              <span className="text-sm text-zinc-500">DetectAI</span>
            </div>
            <div className="flex items-center gap-6">
              <a
                href="/privacy"
                className="text-xs text-zinc-500 hover:text-cyan-400 transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="/terms"
                className="text-xs text-zinc-500 hover:text-cyan-400 transition-colors"
              >
                Terms
              </a>
              <a
                href="/refund"
                className="text-xs text-zinc-500 hover:text-cyan-400 transition-colors"
              >
                Refund Policy
              </a>
            </div>
          </div>
          <div
            className="text-center mt-6 text-xs text-zinc-700"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            &copy; 2026 DetectAI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
