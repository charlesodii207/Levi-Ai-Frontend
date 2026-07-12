"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Search, Microscope, GitCompare, ShieldCheck, ArrowLeft,
  Copy, Check, Download, Loader2, Sparkles,
} from "lucide-react";

type View = "landing" | "deepdive" | "compare" | "factcheck";

const HUB_COLOR = "#F97316"; // overall Research identity (matches sidebar mode color)

type ToolDef = {
  id: View;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  tags: string[];
};

const TOOLS: ToolDef[] = [
  {
    id: "deepdive",
    label: "Topic Deep Dive",
    description: "Get a full structured breakdown of any topic — what it is, history, how it works, key facts, pros/cons, and future outlook.",
    icon: <Microscope size={20} color="#F59E0B" />,
    color: "#F59E0B", // amber
    tags: ["History", "How It Works", "Key Facts", "Future Outlook"],
  },
  {
    id: "compare",
    label: "Comparison Analyst",
    description: "Compare two products, ideas, countries, or technologies side by side, with a clear verdict at the end.",
    icon: <GitCompare size={20} color="#3B82F6" />,
    color: "#3B82F6", // blue
    tags: ["Side-by-Side", "Criteria", "Verdict"],
  },
  {
    id: "factcheck",
    label: "Fact Checker & Summarizer",
    description: "Paste any text or claim to extract key facts, get an accuracy assessment, and a simplified summary.",
    icon: <ShieldCheck size={20} color="#22C55E" />,
    color: "#22C55E", // green
    tags: ["Key Facts", "Accuracy", "Summary"],
  },
];

async function callLevi(prompt: string): Promise<string> {
  const token = localStorage.getItem("levi_token");
  const res = await fetch("http://127.0.0.1:8000/chat/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ message: prompt }),
  });
  const data = await res.json();
  return data.response || "No response received.";
}

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Shared output panel (copy + download + markdown render)
// ---------------------------------------------------------------------------

function OutputPanel({
  loading,
  loadingLabel,
  result,
  emptyLabel,
  filename,
  accentColor,
}: {
  loading: boolean;
  loadingLabel: string;
  result: string | null;
  emptyLabel: string;
  filename: string;
  accentColor: string;
}) {
  const [copied, setCopied] = useState(false);

  function copy() {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{
      background: "#0D1117",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 16,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      minHeight: 300,
    }}>
      <div style={{
        padding: "12px 18px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <span style={{ color: "#6B7280", fontSize: 11, fontWeight: 600, letterSpacing: 0.5 }}>
          RESULT
        </span>
        {result && !loading && (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={copy}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "5px 10px",
                background: copied ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${copied ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.08)"}`,
                borderRadius: 7, color: copied ? "#22c55e" : "#9CA3AF",
                fontSize: 11, cursor: "pointer",
              }}
            >
              {copied ? <Check size={11} /> : <Copy size={11} />}
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              onClick={() => downloadText(filename, result)}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "5px 10px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 7, color: "#9CA3AF",
                fontSize: 11, cursor: "pointer",
              }}
            >
              <Download size={11} />
              Download
            </button>
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "18px 22px" }}>
        {loading && (
          <div style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            height: "100%", gap: 14, minHeight: 220,
          }}>
            <Loader2 size={22} color={accentColor} style={{ animation: "spin 1s linear infinite" }} />
            <p style={{ color: "#6B7280", fontSize: 13 }}>{loadingLabel}</p>
          </div>
        )}

        {!loading && !result && (
          <div style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            height: "100%", gap: 10, minHeight: 220,
          }}>
            <Sparkles size={20} color="#374151" />
            <p style={{ color: "#374151", fontSize: 13, textAlign: "center" }}>
              {emptyLabel}
            </p>
          </div>
        )}

        {!loading && result && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="markdown-body"
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
          </motion.div>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ToolHeader({ tool, onBack }: { tool: ToolDef; onBack: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
      <button
        onClick={onBack}
        style={{
          width: 34, height: 34, borderRadius: 9,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "#9CA3AF", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <ArrowLeft size={16} />
      </button>
      <div style={{
        width: 38, height: 38, borderRadius: 10,
        background: `${tool.color}18`,
        border: `1px solid ${tool.color}45`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        {tool.icon}
      </div>
      <div>
        <h1 style={{ color: "white", fontSize: 18, fontWeight: 700, margin: 0 }}>
          {tool.label}
        </h1>
        <p style={{ color: "#6B7280", fontSize: 12.5, margin: 0 }}>
          {tool.description}
        </p>
      </div>
    </div>
  );
}

function SubmitButton({
  onClick, loading, color, icon, label, loadingLabel,
}: {
  onClick: () => void; loading: boolean; color: string;
  icon: React.ReactNode; label: string; loadingLabel: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        width: "100%", padding: "13px",
        background: loading ? "#0a0c12" : `linear-gradient(135deg, ${color}cc, ${color})`,
        border: "none", borderRadius: 12,
        color: loading ? "#4B5563" : "white",
        fontSize: 14, fontWeight: 700,
        cursor: loading ? "not-allowed" : "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      }}
    >
      {loading ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : icon}
      {loading ? loadingLabel : label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Tool 1: Topic Deep Dive
// ---------------------------------------------------------------------------

function DeepDiveTool({ onBack }: { onBack: () => void }) {
  const tool = TOOLS[0];
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function run() {
    if (!topic.trim()) { setError("Enter a topic first."); return; }
    setError("");
    setLoading(true);
    setResult(null);

    const prompt = `Give me a structured deep dive on the following topic: "${topic}".

Format the response in markdown with these exact sections, each as a header:

## What It Is
A clear, concise definition and overview.

## History
Key origins and how it has evolved over time.

## How It Works
The core mechanics, principles, or process involved.

## Key Facts
A bullet list of the most important facts someone should know.

## Pros and Cons
A short bullet list of pros, and a short bullet list of cons.

## Future Outlook
Where this is heading, trends, or what to watch for.

Be accurate and clear. If something is uncertain or disputed, say so rather than presenting it as settled fact.`;

    try {
      const response = await callLevi(prompt);
      setResult(response);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "28px 24px" }}>
      <div style={{ width: "100%", maxWidth: 820, margin: "0 auto" }}>
        <ToolHeader tool={tool} onBack={onBack} />

        <div style={{
          background: "#0D1117",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
        }}>
          <label style={{ color: "#6B7280", fontSize: 11, fontWeight: 600, letterSpacing: 0.5, display: "block", marginBottom: 8 }}>
            TOPIC
          </label>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && run()}
            placeholder="e.g. Quantum computing, The Roman Empire, CRISPR gene editing..."
            style={{
              width: "100%",
              background: "#080A10",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12,
              padding: "12px 14px",
              color: "white",
              fontSize: 14,
              fontWeight: 500,
              outline: "none",
              marginBottom: 14,
              fontFamily: "Inter, sans-serif",
            }}
          />

          {error && (
            <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 12, padding: "10px 14px", background: "rgba(239,68,68,0.08)", borderRadius: 8 }}>
              ⚠ {error}
            </p>
          )}

          <SubmitButton
            onClick={run}
            loading={loading}
            color={tool.color}
            icon={<Microscope size={15} />}
            label="Run Deep Dive"
            loadingLabel="Researching..."
          />
        </div>

        <OutputPanel
          loading={loading}
          loadingLabel="Building the breakdown..."
          result={result}
          emptyLabel={"Enter a topic above to get started"}
          filename={`${topic.trim().replace(/\s+/g, "-").toLowerCase() || "deep-dive"}.md`}
          accentColor={tool.color}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tool 2: Comparison Analyst
// ---------------------------------------------------------------------------

function CompareTool({ onBack }: { onBack: () => void }) {
  const tool = TOOLS[1];
  const [itemA, setItemA] = useState("");
  const [itemB, setItemB] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function run() {
    if (!itemA.trim() || !itemB.trim()) { setError("Enter both things you want to compare."); return; }
    setError("");
    setLoading(true);
    setResult(null);

    const prompt = `Compare "${itemA}" vs "${itemB}" for someone trying to decide between them or understand the difference.

Respond in markdown with:

1. A brief 1-2 sentence intro framing the comparison.
2. A markdown table with rows for the most relevant comparison criteria for these two things specifically (choose sensible criteria based on what they are — e.g. price, performance, use case, learning curve, longevity, etc.) and one column per item.
3. A "## Verdict" section with a clear, practical recommendation on which is better for which situation — avoid being wishy-washy, but note if it genuinely depends on the user's specific needs.`;

    try {
      const response = await callLevi(prompt);
      setResult(response);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "28px 24px" }}>
      <div style={{ width: "100%", maxWidth: 820, margin: "0 auto" }}>
        <ToolHeader tool={tool} onBack={onBack} />

        <div style={{
          background: "#0D1117",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "end", marginBottom: 14 }}>
            <div>
              <label style={{ color: "#6B7280", fontSize: 11, fontWeight: 600, letterSpacing: 0.5, display: "block", marginBottom: 8 }}>
                FIRST THING
              </label>
              <input
                value={itemA}
                onChange={(e) => setItemA(e.target.value)}
                placeholder="e.g. iPhone 16"
                style={{
                  width: "100%", background: "#080A10",
                  border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12,
                  padding: "12px 14px", color: "white", fontSize: 14, fontWeight: 500,
                  outline: "none", fontFamily: "Inter, sans-serif",
                }}
              />
            </div>
            <span style={{ color: "#4B5563", fontSize: 13, fontWeight: 700, paddingBottom: 12 }}>VS</span>
            <div>
              <label style={{ color: "#6B7280", fontSize: 11, fontWeight: 600, letterSpacing: 0.5, display: "block", marginBottom: 8 }}>
                SECOND THING
              </label>
              <input
                value={itemB}
                onChange={(e) => setItemB(e.target.value)}
                placeholder="e.g. Samsung Galaxy S25"
                style={{
                  width: "100%", background: "#080A10",
                  border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12,
                  padding: "12px 14px", color: "white", fontSize: 14, fontWeight: 500,
                  outline: "none", fontFamily: "Inter, sans-serif",
                }}
              />
            </div>
          </div>

          {error && (
            <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 12, padding: "10px 14px", background: "rgba(239,68,68,0.08)", borderRadius: 8 }}>
              ⚠ {error}
            </p>
          )}

          <SubmitButton
            onClick={run}
            loading={loading}
            color={tool.color}
            icon={<GitCompare size={15} />}
            label="Run Comparison"
            loadingLabel="Comparing..."
          />
        </div>

        <OutputPanel
          loading={loading}
          loadingLabel="Building the comparison..."
          result={result}
          emptyLabel={"Enter two things above to compare them"}
          filename={`comparison-${(itemA + "-vs-" + itemB).trim().replace(/\s+/g, "-").toLowerCase() || "result"}.md`}
          accentColor={tool.color}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tool 3: Fact Checker & Summarizer
// ---------------------------------------------------------------------------

function FactCheckTool({ onBack }: { onBack: () => void }) {
  const tool = TOOLS[2];
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function run() {
    if (!text.trim()) { setError("Paste some text or a claim first."); return; }
    setError("");
    setLoading(true);
    setResult(null);

    const prompt = `Analyze the following text or claim. Respond in markdown with these sections:

## Key Facts Extracted
A bullet list of the distinct factual claims made in the text.

## Accuracy Assessment
For each key claim, note whether it appears accurate, inaccurate, or needs more context, and briefly explain why. Use one of these verdict labels per claim: "Accurate", "Mostly Accurate", "Mixed", "Needs Context", or "Inaccurate" — avoid forcing a simple true/false when the reality is more nuanced. If you're not fully certain about a specific claim, say so rather than guessing confidently.

## Simplified Summary
A short, plain-language summary of what the text is saying overall.

Here is the text to analyze:
"""
${text}
"""`;

    try {
      const response = await callLevi(prompt);
      setResult(response);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "28px 24px" }}>
      <div style={{ width: "100%", maxWidth: 820, margin: "0 auto" }}>
        <ToolHeader tool={tool} onBack={onBack} />

        <div style={{
          background: "#0D1117",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
        }}>
          <label style={{ color: "#6B7280", fontSize: 11, fontWeight: 600, letterSpacing: 0.5, display: "block", marginBottom: 8 }}>
            TEXT OR CLAIM
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste an article excerpt, a claim you saw online, or any text you want fact-checked and summarized..."
            rows={6}
            style={{
              width: "100%",
              background: "#080A10",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12,
              padding: "12px 14px",
              color: "white",
              fontSize: 13.5,
              lineHeight: 1.6,
              outline: "none",
              marginBottom: 14,
              resize: "vertical",
              fontFamily: "Inter, sans-serif",
            }}
          />

          {error && (
            <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 12, padding: "10px 14px", background: "rgba(239,68,68,0.08)", borderRadius: 8 }}>
              ⚠ {error}
            </p>
          )}

          <SubmitButton
            onClick={run}
            loading={loading}
            color={tool.color}
            icon={<ShieldCheck size={15} />}
            label="Check & Summarize"
            loadingLabel="Checking..."
          />
        </div>

        <OutputPanel
          loading={loading}
          loadingLabel="Extracting facts and checking accuracy..."
          result={result}
          emptyLabel={"Paste text above to fact-check and summarize it"}
          filename="fact-check-result.md"
          accentColor={tool.color}
        />

        <p style={{ color: "#374151", fontSize: 11, textAlign: "center", marginTop: 14 }}>
          ⚠ AI-generated accuracy assessment. Verify important claims against primary sources.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Landing + router
// ---------------------------------------------------------------------------

export default function ResearchHub() {
  const [view, setView] = useState<View>("landing");

  if (view === "deepdive") return <DeepDiveTool onBack={() => setView("landing")} />;
  if (view === "compare") return <CompareTool onBack={() => setView("landing")} />;
  if (view === "factcheck") return <FactCheckTool onBack={() => setView("landing")} />;

  return (
    <div style={{
      height: "100%", overflowY: "auto",
      display: "flex", flexDirection: "column",
      alignItems: "center", padding: "40px 24px",
    }}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{
          width: 64, height: 64, borderRadius: "50%",
          background: `${HUB_COLOR}15`,
          border: `1px solid ${HUB_COLOR}35`,
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 18, color: HUB_COLOR,
          boxShadow: `0 0 40px ${HUB_COLOR}20`,
        }}
      >
        <Search size={26} />
      </motion.div>
      <p style={{ color: "white", fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
        Research Hub
      </p>
      <p style={{ color: "#6B7280", fontSize: 14, marginBottom: 32, textAlign: "center", maxWidth: 480 }}>
        Three focused tools for deep research — pick one to get started
      </p>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 16, width: "100%", maxWidth: 820,
      }}>
        {TOOLS.map((tool) => (
          <motion.button
            key={tool.id}
            whileHover={{ y: -3 }}
            onClick={() => setView(tool.id)}
            style={{
              padding: "24px 20px", textAlign: "left",
              background: `${tool.color}0A`,
              border: `1px solid ${tool.color}30`,
              borderRadius: 16, cursor: "pointer",
              display: "flex", flexDirection: "column", gap: 14,
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: `${tool.color}18`,
              border: `1px solid ${tool.color}45`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {tool.icon}
            </div>
            <div>
              <div style={{ color: "white", fontSize: 14.5, fontWeight: 700 }}>
                {tool.label}
              </div>
              <div style={{ color: "#6B7280", fontSize: 12.5, marginTop: 4, lineHeight: 1.5 }}>
                {tool.description}
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {tool.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    padding: "4px 9px",
                    background: `${tool.color}12`,
                    border: `1px solid ${tool.color}35`,
                    borderRadius: 7,
                    color: tool.color,
                    fontSize: 11, fontWeight: 700,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
