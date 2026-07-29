"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  PenLine, ArrowLeft, Loader2, Copy, Check,
  RefreshCw, Download, FileText, Share2,
  Mail, Feather, Hash, ChevronDown, Zap, Sparkles, Send, MessageCircle,
} from "lucide-react";
import type { LeviModel } from "./PromptBox";

type Tool = "landing" | "article" | "social" | "email" | "creative";

async function callLevi(message: string, model: LeviModel = "swift"): Promise<string> {
  const token = localStorage.getItem("levi_token");
  const res = await fetch("https://levi-ai-1ug2.onrender.com/chat/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ message, model }),
  });
  const data = await res.json();
  return data.response || "";
}

const MODEL_OPTIONS: { id: LeviModel; label: string }[] = [
  { id: "swift", label: "Levi Swift" },
  { id: "nova", label: "Levi Nova" },
];

function ModelSelector({ value, onChange }: { value: LeviModel; onChange: (m: LeviModel) => void }) {
  return (
    <div style={{
      display: "flex",
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 10,
      padding: 3,
    }}>
      {MODEL_OPTIONS.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "6px 10px",
              background: active ? "rgba(59,130,246,0.15)" : "transparent",
              border: "none",
              borderRadius: 7,
              color: active ? "#3B82F6" : "#6B7280",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {opt.id === "nova" ? <Sparkles size={11} /> : <Zap size={11} />}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

const TOOLS = [
  {
    id: "article" as Tool,
    label: "Article & Blog",
    icon: <FileText size={22} />,
    color: "#3B82F6",
    description: "Full ready-to-publish articles and blog posts with headline, intro, body and conclusion",
    tags: ["Blog Posts", "Articles", "Op-eds", "Guides"],
  },
  {
    id: "social" as Tool,
    label: "Social Media",
    icon: <Share2 size={22} />,
    color: "#A855F7",
    description: "Platform-optimized captions with hashtags for Instagram, Twitter, LinkedIn and TikTok",
    tags: ["Instagram", "Twitter/X", "LinkedIn", "TikTok"],
  },
  {
    id: "email" as Tool,
    label: "Email Composer",
    icon: <Mail size={22} />,
    color: "#22C55E",
    description: "Professional emails for any purpose — cold outreach, newsletters, follow-ups and sales",
    tags: ["Cold Outreach", "Newsletter", "Follow-up", "Sales"],
  },
  {
    id: "creative" as Tool,
    label: "Creative Writer",
    icon: <Feather size={22} />,
    color: "#D4AF37",
    description: "Stories, scripts, poems, speeches and rap lyrics crafted with imagination and style",
    tags: ["Short Stories", "Scripts", "Poems", "Speeches"],
  },
];

const TONES = [
  { id: "professional", label: "Professional", emoji: "👔" },
  { id: "casual", label: "Casual", emoji: "😊" },
  { id: "bold", label: "Bold", emoji: "🔥" },
  { id: "inspirational", label: "Inspirational", emoji: "✨" },
  { id: "humorous", label: "Humorous", emoji: "😄" },
  { id: "formal", label: "Formal", emoji: "🎩" },
];

const WORD_COUNTS = ["300 words", "500 words", "800 words", "1000 words", "1500 words", "2000+ words"];

const PLATFORMS = [
  { id: "instagram", label: "Instagram", color: "#E1306C", limit: "2200 chars" },
  { id: "twitter", label: "Twitter/X", color: "#1DA1F2", limit: "280 chars" },
  { id: "linkedin", label: "LinkedIn", color: "#0077B5", limit: "3000 chars" },
  { id: "tiktok", label: "TikTok", color: "#FF0050", limit: "2200 chars" },
];

const EMAIL_TYPES = ["Cold Outreach", "Newsletter", "Follow-up", "Sales Email", "Announcement", "Apology", "Thank You", "Proposal"];
const CREATIVE_TYPES = ["Short Story", "Movie Script", "Poem", "Speech", "Rap Lyrics", "Song Lyrics", "Monologue", "Fairy Tale"];
const MOODS = ["Dark & Mysterious", "Light & Uplifting", "Romantic", "Thrilling", "Sad & Emotional", "Epic & Powerful", "Funny & Quirky"];

// ── Shared Components ─────────────────────────────────────────────────────────

function ToneSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label style={{ color: "#6B7280", fontSize: 11, fontWeight: 600, letterSpacing: 0.5, display: "block", marginBottom: 8 }}>TONE</label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {TONES.map((t) => (
          <button key={t.id} onClick={() => onChange(t.id)}
            style={{
              padding: "7px 13px",
              background: value === t.id ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${value === t.id ? "rgba(59,130,246,0.35)" : "rgba(255,255,255,0.07)"}`,
              borderRadius: 20, color: value === t.id ? "#3B82F6" : "#6B7280",
              fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all 0.15s",
              display: "flex", alignItems: "center", gap: 5,
            }}>
            {t.emoji} {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

type EditMsg = { role: "user" | "assistant"; content: string };

function EditChat({
  result, setResult, model, pieceLabel,
}: {
  result: string;
  setResult: (r: string) => void;
  model: LeviModel;
  pieceLabel: string;
}) {
  const [messages, setMessages] = useState<EditMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  async function sendEdit() {
    const instruction = input.trim();
    if (!instruction || sending) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: instruction }]);
    setSending(true);

    const prompt = `Here is the current ${pieceLabel}:

---
${result}
---

The user has requested this edit: "${instruction}"

Apply the requested change to the piece above. Output the FULL updated ${pieceLabel} with the edit applied — not a diff, not just the changed section, and no commentary or explanation before or after. Just the complete, ready-to-use updated piece, preserving everything that wasn't asked to change.`;

    try {
      const updated = await callLevi(prompt, model);
      setResult(updated);
      setMessages((prev) => [...prev, { role: "assistant", content: "Done — updated above." }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Something went wrong. Try again?" }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{
      marginTop: 14,
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 14,
      background: "rgba(255,255,255,0.02)",
      overflow: "hidden",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 7,
        padding: "10px 14px",
        borderBottom: messages.length ? "1px solid rgba(255,255,255,0.06)" : "none",
      }}>
        <MessageCircle size={13} color="#6B7280" />
        <span style={{ color: "#6B7280", fontSize: 11, fontWeight: 600, letterSpacing: 0.3 }}>
          ASK FOR AN EDIT
        </span>
      </div>

      {messages.length > 0 && (
        <div style={{
          maxHeight: 180, overflowY: "auto", padding: "10px 14px",
          display: "flex", flexDirection: "column", gap: 8,
        }}>
          {messages.map((m, i) => (
            <div key={i} style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              background: m.role === "user" ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.05)",
              color: m.role === "user" ? "#93C5FD" : "#8B9CC4",
              padding: "6px 12px", borderRadius: 10, fontSize: 12, maxWidth: "85%",
              lineHeight: 1.5,
            }}>
              {m.content}
            </div>
          ))}
          {sending && (
            <div style={{
              alignSelf: "flex-start", color: "#6B7280", fontSize: 12,
              display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
            }}>
              <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> Editing...
            </div>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, padding: 10 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") sendEdit(); }}
          placeholder="e.g. 'make the chorus shorter' or 'give it a happier ending'"
          disabled={sending}
          style={{
            flex: 1, background: "rgba(6,10,16,0.8)",
            border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8,
            padding: "9px 12px", color: "#F0F4FF", fontSize: 13,
            outline: "none", fontFamily: "Inter, sans-serif",
          }}
        />
        <button onClick={sendEdit} disabled={sending || !input.trim()}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 36, flexShrink: 0,
            background: (sending || !input.trim()) ? "rgba(255,255,255,0.04)" : "rgba(59,130,246,0.15)",
            border: `1px solid ${(sending || !input.trim()) ? "rgba(255,255,255,0.07)" : "rgba(59,130,246,0.3)"}`,
            borderRadius: 8,
            color: (sending || !input.trim()) ? "#3D4F72" : "#3B82F6",
            cursor: (sending || !input.trim()) ? "not-allowed" : "pointer",
          }}>
          {sending ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={14} />}
        </button>
      </div>
    </div>
  );
}

function ResultPanel({
  result, onRegenerate, onContinue, loading, continuing, setResult, model, pieceLabel,
}: {
  result: string;
  onRegenerate: () => void;
  onContinue: () => void;
  loading: boolean;
  continuing: boolean;
  setResult: (r: string) => void;
  model: LeviModel;
  pieceLabel: string;
}) {
  const [copied, setCopied] = useState(false);
  const wordCount = result.split(/\s+/).filter(Boolean).length;
  const charCount = result.length;

  function download() {
    const blob = new Blob([result], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "levi-writing.txt"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      {/* Stats bar */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 16, padding: "10px 14px",
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 10,
      }}>
        <div style={{ display: "flex", gap: 20 }}>
          <span style={{ color: "#3D4F72", fontSize: 12 }}>
            <span style={{ color: "#8B9CC4", fontWeight: 600 }}>{wordCount}</span> words
          </span>
          <span style={{ color: "#3D4F72", fontSize: 12 }}>
            <span style={{ color: "#8B9CC4", fontWeight: 600 }}>{charCount}</span> characters
          </span>
        </div>
        <div style={{ display: "flex", gap: 7 }}>
          <button onClick={onContinue} disabled={loading || continuing}
            style={{
              display: "flex", alignItems: "center", gap: 5, padding: "5px 11px",
              background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.3)",
              borderRadius: 8, color: "#D4AF37", fontSize: 11,
              cursor: (loading || continuing) ? "not-allowed" : "pointer",
            }}>
            {continuing
              ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} />
              : <PenLine size={11} />}
            {continuing ? "Continuing..." : "Continue"}
          </button>
          <button onClick={onRegenerate} disabled={loading || continuing}
            style={{
              display: "flex", alignItems: "center", gap: 5, padding: "5px 11px",
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 8, color: "#8B9CC4", fontSize: 11,
              cursor: (loading || continuing) ? "not-allowed" : "pointer",
            }}>
            <RefreshCw size={11} /> Regenerate
          </button>
          <button onClick={download}
            style={{
              display: "flex", alignItems: "center", gap: 5, padding: "5px 11px",
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 8, color: "#8B9CC4", fontSize: 11, cursor: "pointer",
            }}>
            <Download size={11} /> Download
          </button>
          <button onClick={() => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            style={{
              display: "flex", alignItems: "center", gap: 5, padding: "5px 11px",
              background: copied ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${copied ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.07)"}`,
              borderRadius: 8, color: copied ? "#22C55E" : "#8B9CC4", fontSize: 11, cursor: "pointer",
            }}>
            {copied ? <Check size={11} /> : <Copy size={11} />} {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{
        background: "rgba(6,10,16,0.6)", border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 14, padding: "24px 28px",
      }}>
        <div className="markdown-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
        </div>
      </div>

      <EditChat result={result} setResult={setResult} model={model} pieceLabel={pieceLabel} />
    </motion.div>
  );
}

function LoadingState({ color, label }: { color: string; label: string }) {
  const tips = [
    "Crafting the perfect opening...",
    "Finding the right words...",
    "Polishing every sentence...",
    "Adding the finishing touches...",
  ];
  const [tip] = useState(tips[Math.floor(Math.random() * tips.length)]);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 280, gap: 16 }}>
      <div style={{
        width: 56, height: 56, borderRadius: "50%",
        background: `${color}10`, border: `1px solid ${color}25`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Loader2 size={22} color={color} style={{ animation: "spin 1s linear infinite" }} />
      </div>
      <p style={{ color: "#3D4F72", fontSize: 13 }}>{tip}</p>
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick}
      style={{
        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 8, padding: "6px 10px", color: "#8B9CC4",
        cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 12,
      }}>
      <ArrowLeft size={13} /> Back
    </button>
  );
}

function GenerateButton({ onClick, disabled, color, label }: { onClick: () => void; disabled: boolean; color: string; label: string }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{
        width: "100%", padding: "14px",
        background: !disabled ? `linear-gradient(135deg, ${color}, ${color}cc)` : "rgba(255,255,255,0.04)",
        border: "none", borderRadius: 12,
        color: !disabled ? "white" : "#3D4F72",
        fontSize: 15, fontWeight: 700,
        cursor: !disabled ? "pointer" : "not-allowed",
        boxShadow: !disabled ? `0 4px 24px ${color}30` : "none",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        transition: "all 0.2s",
      }}>
      <PenLine size={16} /> {label}
    </button>
  );
}

function Dropdown({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen(!open)} onBlur={() => setTimeout(() => setOpen(false), 150)}
        style={{
          width: "100%", padding: "11px 14px",
          background: "rgba(6,10,16,0.8)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 10, color: value ? "#F0F4FF" : "#3D4F72",
          fontSize: 13, textAlign: "left", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          fontFamily: "Inter, sans-serif",
        }}>
        {value || placeholder} <ChevronDown size={13} color="#3D4F72" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{
              position: "absolute", top: "100%", left: 0, right: 0, zIndex: 20,
              background: "#0D1420", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10, marginTop: 4, maxHeight: 200, overflowY: "auto",
            }}>
            {options.map((opt) => (
              <button key={opt} onClick={() => { onChange(opt); setOpen(false); }}
                style={{
                  width: "100%", padding: "9px 14px",
                  background: value === opt ? "rgba(59,130,246,0.08)" : "transparent",
                  border: "none", borderBottom: "1px solid rgba(255,255,255,0.04)",
                  color: value === opt ? "#3B82F6" : "#8B9CC4",
                  fontSize: 13, textAlign: "left", cursor: "pointer",
                }}>
                {opt}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Article Tool ──────────────────────────────────────────────────────────────
function ArticleTool({ onBack, model, onModelChange }: { onBack: () => void; model: LeviModel; onModelChange: (m: LeviModel) => void }) {
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState("professional");
  const [wordCount, setWordCount] = useState("800 words");
  const [loading, setLoading] = useState(false);
  const [continuing, setContinuing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function generate() {
    if (!topic) return;
    setLoading(true); setResult(null);
    const prompt = `Write a high-quality, engaging ${wordCount} blog article about: "${topic}"

Target Audience: ${audience || "General readers"}
Tone: ${tone}

Structure the article with:
- A compelling headline (H1)
- A hook introduction that grabs attention
- Well-structured body with subheadings (H2/H3)
- Real examples, data points, or analogies where relevant
- A strong conclusion with a call to action
- Use markdown formatting

Make it feel human, original, and genuinely valuable. Not generic.`;
    try { setResult(await callLevi(prompt, model)); } catch {} finally { setLoading(false); }
  }

  async function continueWriting() {
    if (!result) return;
    setContinuing(true);
    const continuePrompt = `Here is a blog article in progress about "${topic}":

---
${result}
---

Continue the article from exactly where it leaves off. Expand on the ideas already introduced, add further sections, examples, or depth as appropriate. Keep the same tone (${tone}) and markdown formatting style. Do NOT repeat the headline or introduction, and do NOT restate anything already written — just continue seamlessly, as if it were always one article.`;
    try {
      const more = await callLevi(continuePrompt, model);
      setResult((prev) => (prev ? `${prev}\n\n${more}` : more));
    } catch {} finally { setContinuing(false); }
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ flexShrink: 0, padding: "14px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BackButton onClick={onBack} />
          <div>
            <h2 style={{ color: "#F0F4FF", fontSize: 16, fontWeight: 700, margin: 0 }}>Article & Blog Writer</h2>
            <p style={{ color: "#3D4F72", fontSize: 12, margin: 0 }}>Full ready-to-publish content in seconds</p>
          </div>
        </div>
        <ModelSelector value={model} onChange={onModelChange} />
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
        {!result && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: 680, margin: "0 auto" }}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ color: "#6B7280", fontSize: 11, fontWeight: 600, letterSpacing: 0.5, display: "block", marginBottom: 7 }}>TOPIC / TITLE *</label>
              <input value={topic} onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. How to build a successful startup in Africa"
                style={{ width: "100%", background: "rgba(6,10,16,0.8)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "12px 14px", color: "#F0F4FF", fontSize: 14, outline: "none", fontFamily: "Inter, sans-serif" }}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ color: "#6B7280", fontSize: 11, fontWeight: 600, letterSpacing: 0.5, display: "block", marginBottom: 7 }}>TARGET AUDIENCE</label>
                <input value={audience} onChange={(e) => setAudience(e.target.value)}
                  placeholder="e.g. Young entrepreneurs"
                  style={{ width: "100%", background: "rgba(6,10,16,0.8)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "11px 14px", color: "#F0F4FF", fontSize: 13, outline: "none", fontFamily: "Inter, sans-serif" }}
                />
              </div>
              <div>
                <label style={{ color: "#6B7280", fontSize: 11, fontWeight: 600, letterSpacing: 0.5, display: "block", marginBottom: 7 }}>WORD COUNT</label>
                <Dropdown value={wordCount} onChange={setWordCount} options={WORD_COUNTS} placeholder="Select length" />
              </div>
            </div>
            <div style={{ marginBottom: 24 }}>
              <ToneSelector value={tone} onChange={setTone} />
            </div>
            <GenerateButton onClick={generate} disabled={!topic} color="#3B82F6" label="Write Article" />
          </motion.div>
        )}
        {loading && <LoadingState color="#3B82F6" label="article" />}
        {result && !loading && (
          <ResultPanel
            result={result}
            onRegenerate={generate}
            onContinue={continueWriting}
            loading={loading}
            continuing={continuing}
            setResult={setResult}
            model={model}
            pieceLabel="article"
          />
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Social Media Tool ─────────────────────────────────────────────────────────
function SocialTool({ onBack, model, onModelChange }: { onBack: () => void; model: LeviModel; onModelChange: (m: LeviModel) => void }) {
  const [platform, setPlatform] = useState(PLATFORMS[0]);
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("casual");
  const [loading, setLoading] = useState(false);
  const [continuing, setContinuing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function generate() {
    if (!topic) return;
    setLoading(true); setResult(null);
    const prompt = `Write a highly engaging ${platform.label} post about: "${topic}"

Tone: ${tone}
Platform: ${platform.label} (character limit: ${platform.limit})

Provide:
1. The main caption/post (optimized for ${platform.label})
2. 10-15 relevant hashtags
3. A tip for the best time to post this content
4. An emoji suggestion to boost engagement

Make it feel authentic, not corporate. Optimize for maximum engagement on ${platform.label}. Keep within the character limit.`;
    try { setResult(await callLevi(prompt, model)); } catch {} finally { setLoading(false); }
  }

  async function continueWriting() {
    if (!result) return;
    setContinuing(true);
    const continuePrompt = `Here is a ${platform.label} post already drafted about "${topic}":

---
${result}
---

Generate an ALTERNATE version or a follow-up post idea (e.g. a part 2, a different angle, or a companion post) that builds on the same topic and tone (${tone}). Keep it optimized for ${platform.label} (character limit: ${platform.limit}). Clearly separate it from the content above — do not repeat the original caption or hashtags verbatim.`;
    try {
      const more = await callLevi(continuePrompt, model);
      setResult((prev) => (prev ? `${prev}\n\n---\n\n${more}` : more));
    } catch {} finally { setContinuing(false); }
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ flexShrink: 0, padding: "14px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BackButton onClick={onBack} />
          <div>
            <h2 style={{ color: "#F0F4FF", fontSize: 16, fontWeight: 700, margin: 0 }}>Social Media Suite</h2>
            <p style={{ color: "#3D4F72", fontSize: 12, margin: 0 }}>Platform-optimized content that actually performs</p>
          </div>
        </div>
        <ModelSelector value={model} onChange={onModelChange} />
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
        {!result && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: 620, margin: "0 auto" }}>
            {/* Platform selector */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ color: "#6B7280", fontSize: 11, fontWeight: 600, letterSpacing: 0.5, display: "block", marginBottom: 10 }}>PLATFORM</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                {PLATFORMS.map((p) => (
                  <button key={p.id} onClick={() => setPlatform(p)}
                    style={{
                      padding: "12px 8px",
                      background: platform.id === p.id ? `${p.color}12` : "rgba(255,255,255,0.03)",
                      border: `1px solid ${platform.id === p.id ? p.color + "40" : "rgba(255,255,255,0.07)"}`,
                      borderRadius: 12, cursor: "pointer", transition: "all 0.15s",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                    }}>
                    <span style={{ fontSize: 20 }}>
                      {p.id === "instagram" ? "📸" : p.id === "twitter" ? "🐦" : p.id === "linkedin" ? "💼" : "🎵"}
                    </span>
                    <span style={{ color: platform.id === p.id ? p.color : "#6B7280", fontSize: 11, fontWeight: 600 }}>{p.label}</span>
                    <span style={{ color: "#3D4F72", fontSize: 10 }}>{p.limit}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ color: "#6B7280", fontSize: 11, fontWeight: 600, letterSpacing: 0.5, display: "block", marginBottom: 7 }}>WHAT TO POST ABOUT *</label>
              <textarea value={topic} onChange={(e) => setTopic(e.target.value)}
                placeholder={`What do you want to post on ${platform.label}? e.g. Launching my new product, sharing a motivational thought, announcing an event...`}
                rows={3}
                style={{ width: "100%", background: "rgba(6,10,16,0.8)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "12px 14px", color: "#F0F4FF", fontSize: 13, outline: "none", resize: "none", fontFamily: "Inter, sans-serif", lineHeight: 1.6 }}
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <ToneSelector value={tone} onChange={setTone} />
            </div>
            <GenerateButton onClick={generate} disabled={!topic} color="#A855F7" label={`Create ${platform.label} Post`} />
          </motion.div>
        )}
        {loading && <LoadingState color="#A855F7" label="post" />}
        {result && !loading && (
          <ResultPanel
            result={result}
            onRegenerate={generate}
            onContinue={continueWriting}
            loading={loading}
            continuing={continuing}
            setResult={setResult}
            model={model}
            pieceLabel={`${platform.label} post`}
          />
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Email Tool ────────────────────────────────────────────────────────────────
function EmailTool({ onBack, model, onModelChange }: { onBack: () => void; model: LeviModel; onModelChange: (m: LeviModel) => void }) {
  const [emailType, setEmailType] = useState("");
  const [context, setContext] = useState("");
  const [recipient, setRecipient] = useState("");
  const [tone, setTone] = useState("professional");
  const [loading, setLoading] = useState(false);
  const [continuing, setContinuing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function generate() {
    if (!emailType || !context) return;
    setLoading(true); setResult(null);
    const prompt = `Write a highly effective ${emailType} email.

Context/Goal: ${context}
Recipient: ${recipient || "The relevant person/audience"}
Tone: ${tone}

Provide:
## Subject Line Options (3 variations)
List 3 compelling subject lines

## Email Body
Write the complete email body — greeting, opening hook, main message, value proposition, clear call to action, and professional sign-off.

Make it feel personal and human, not like a template. It should be persuasive without being pushy. Optimize for high open rates and responses.`;
    try { setResult(await callLevi(prompt, model)); } catch {} finally { setLoading(false); }
  }

  async function continueWriting() {
    if (!result) return;
    setContinuing(true);
    const continuePrompt = `Here is a ${emailType} email already drafted:

---
${result}
---

Since this email already contains a complete message, write a natural FOLLOW-UP email that could be sent a few days later if there's no response. Keep it brief, keep the same tone (${tone}) and recipient context (${recipient || "the same recipient"}), and reference the original email naturally without repeating it in full. Provide subject line + body, clearly separated from the original above.`;
    try {
      const more = await callLevi(continuePrompt, model);
      setResult((prev) => (prev ? `${prev}\n\n---\n\n${more}` : more));
    } catch {} finally { setContinuing(false); }
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ flexShrink: 0, padding: "14px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BackButton onClick={onBack} />
          <div>
            <h2 style={{ color: "#F0F4FF", fontSize: 16, fontWeight: 700, margin: 0 }}>Email Composer</h2>
            <p style={{ color: "#3D4F72", fontSize: 12, margin: 0 }}>Emails that get opened, read and replied to</p>
          </div>
        </div>
        <ModelSelector value={model} onChange={onModelChange} />
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
        {!result && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: 620, margin: "0 auto" }}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ color: "#6B7280", fontSize: 11, fontWeight: 600, letterSpacing: 0.5, display: "block", marginBottom: 7 }}>EMAIL TYPE *</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {EMAIL_TYPES.map((t) => (
                  <button key={t} onClick={() => setEmailType(t)}
                    style={{
                      padding: "7px 13px",
                      background: emailType === t ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${emailType === t ? "rgba(34,197,94,0.35)" : "rgba(255,255,255,0.07)"}`,
                      borderRadius: 20, color: emailType === t ? "#22C55E" : "#6B7280",
                      fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all 0.15s",
                    }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ color: "#6B7280", fontSize: 11, fontWeight: 600, letterSpacing: 0.5, display: "block", marginBottom: 7 }}>CONTEXT & GOAL *</label>
              <textarea value={context} onChange={(e) => setContext(e.target.value)}
                placeholder="What is this email about? What do you want to achieve? e.g. Reaching out to a potential investor about my fintech startup..."
                rows={3}
                style={{ width: "100%", background: "rgba(6,10,16,0.8)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "12px 14px", color: "#F0F4FF", fontSize: 13, outline: "none", resize: "none", fontFamily: "Inter, sans-serif", lineHeight: 1.6 }}
              />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ color: "#6B7280", fontSize: 11, fontWeight: 600, letterSpacing: 0.5, display: "block", marginBottom: 7 }}>RECIPIENT</label>
              <input value={recipient} onChange={(e) => setRecipient(e.target.value)}
                placeholder="e.g. Startup investor, HR manager, potential client"
                style={{ width: "100%", background: "rgba(6,10,16,0.8)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "11px 14px", color: "#F0F4FF", fontSize: 13, outline: "none", fontFamily: "Inter, sans-serif" }}
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <ToneSelector value={tone} onChange={setTone} />
            </div>
            <GenerateButton onClick={generate} disabled={!emailType || !context} color="#22C55E" label="Compose Email" />
          </motion.div>
        )}
        {loading && <LoadingState color="#22C55E" label="email" />}
        {result && !loading && (
          <ResultPanel
            result={result}
            onRegenerate={generate}
            onContinue={continueWriting}
            loading={loading}
            continuing={continuing}
            setResult={setResult}
            model={model}
            pieceLabel="email"
          />
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Creative Tool ─────────────────────────────────────────────────────────────
function CreativeTool({ onBack, model, onModelChange }: { onBack: () => void; model: LeviModel; onModelChange: (m: LeviModel) => void }) {
  const [creativeType, setCreativeType] = useState("");
  const [theme, setTheme] = useState("");
  const [characters, setCharacters] = useState("");
  const [mood, setMood] = useState("");
  const [loading, setLoading] = useState(false);
  const [continuing, setContinuing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function generate() {
    if (!creativeType || !theme) return;
    setLoading(true); setResult(null);
    const prompt = `Write an original, captivating ${creativeType} with the following details:

Theme/Idea: ${theme}
Characters/Subjects: ${characters || "Leave to your creative discretion"}
Mood/Atmosphere: ${mood || "Neutral"}

Guidelines:
- Be genuinely creative and original — avoid clichés
- Use vivid, descriptive language
- For scripts: include scene directions
- For poems: use rhythm and imagery
- For stories: have a clear arc (beginning, middle, end)
- For speeches: be inspiring and memorable
- For rap/song lyrics: use rhyme schemes, flow, and section labels like [Verse 1], [Chorus], [Bridge], [Outro]

Make it exceptional. This should feel like it was written by a talented human writer, not an AI.

IMPORTANT: Output ONLY the piece itself. Do not include any preamble ("Here's a..."), title explanation, or closing commentary/analysis about the piece afterward.`;
    try { setResult(await callLevi(prompt, model)); } catch {} finally { setLoading(false); }
  }

  async function continueWriting() {
    if (!result) return;
    setContinuing(true);
    const continuePrompt = `Here is a ${creativeType.toLowerCase() || "piece"} in progress:

---
${result}
---

Continue writing from exactly where this leaves off. Keep the same characters, tone, style, voice, and structural format established above (e.g. if it uses [Verse]/[Chorus]/[Bridge] labels, continue using them consistently and correctly numbered). Do not repeat, summarize, or restate anything already written, and do not add any commentary, analysis, or explanation about the piece — output only the continuation itself, picking up seamlessly as if it were always one continuous piece.`;
    try {
      const more = await callLevi(continuePrompt, model);
      setResult((prev) => (prev ? `${prev}\n\n${more}` : more));
    } catch {} finally { setContinuing(false); }
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ flexShrink: 0, padding: "14px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BackButton onClick={onBack} />
          <div>
            <h2 style={{ color: "#F0F4FF", fontSize: 16, fontWeight: 700, margin: 0 }}>Creative Writer</h2>
            <p style={{ color: "#3D4F72", fontSize: 12, margin: 0 }}>Stories, scripts, poems and lyrics crafted with soul</p>
          </div>
        </div>
        <ModelSelector value={model} onChange={onModelChange} />
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
        {!result && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: 620, margin: "0 auto" }}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ color: "#6B7280", fontSize: 11, fontWeight: 600, letterSpacing: 0.5, display: "block", marginBottom: 8 }}>WHAT DO YOU WANT TO CREATE? *</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {CREATIVE_TYPES.map((t) => (
                  <button key={t} onClick={() => setCreativeType(t)}
                    style={{
                      padding: "7px 13px",
                      background: creativeType === t ? "rgba(212,175,55,0.12)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${creativeType === t ? "rgba(212,175,55,0.35)" : "rgba(255,255,255,0.07)"}`,
                      borderRadius: 20, color: creativeType === t ? "#D4AF37" : "#6B7280",
                      fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all 0.15s",
                    }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ color: "#6B7280", fontSize: 11, fontWeight: 600, letterSpacing: 0.5, display: "block", marginBottom: 7 }}>THEME / IDEA *</label>
              <textarea value={theme} onChange={(e) => setTheme(e.target.value)}
                placeholder={`What is your ${creativeType || "piece"} about? e.g. A young man who discovers he can hear people's thoughts, set in Lagos 2045...`}
                rows={3}
                style={{ width: "100%", background: "rgba(6,10,16,0.8)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "12px 14px", color: "#F0F4FF", fontSize: 13, outline: "none", resize: "none", fontFamily: "Inter, sans-serif", lineHeight: 1.6 }}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
              <div>
                <label style={{ color: "#6B7280", fontSize: 11, fontWeight: 600, letterSpacing: 0.5, display: "block", marginBottom: 7 }}>CHARACTERS / SUBJECTS</label>
                <input value={characters} onChange={(e) => setCharacters(e.target.value)}
                  placeholder="e.g. Emeka, 25, software dev"
                  style={{ width: "100%", background: "rgba(6,10,16,0.8)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "11px 14px", color: "#F0F4FF", fontSize: 13, outline: "none", fontFamily: "Inter, sans-serif" }}
                />
              </div>
              <div>
                <label style={{ color: "#6B7280", fontSize: 11, fontWeight: 600, letterSpacing: 0.5, display: "block", marginBottom: 7 }}>MOOD</label>
                <Dropdown value={mood} onChange={setMood} options={MOODS} placeholder="Select mood" />
              </div>
            </div>
            <GenerateButton onClick={generate} disabled={!creativeType || !theme} color="#D4AF37" label={`Write ${creativeType || "Creative Piece"}`} />
          </motion.div>
        )}
        {loading && <LoadingState color="#D4AF37" label={creativeType.toLowerCase() || "piece"} />}
        {result && !loading && (
          <ResultPanel
            result={result}
            onRegenerate={generate}
            onContinue={continueWriting}
            loading={loading}
            continuing={continuing}
            setResult={setResult}
            model={model}
            pieceLabel={creativeType.toLowerCase() || "piece"}
          />
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Main Hub ──────────────────────────────────────────────────────────────────
export default function WritingStudio() {
  const [tool, setTool] = useState<Tool>("landing");
  const [model, setModel] = useState<LeviModel>("swift");

  if (tool === "article") return <ArticleTool onBack={() => setTool("landing")} model={model} onModelChange={setModel} />;
  if (tool === "social") return <SocialTool onBack={() => setTool("landing")} model={model} onModelChange={setModel} />;
  if (tool === "email") return <EmailTool onBack={() => setTool("landing")} model={model} onModelChange={setModel} />;
  if (tool === "creative") return <CreativeTool onBack={() => setTool("landing")} model={model} onModelChange={setModel} />;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 28px", overflow: "auto" }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16,
          background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px", boxShadow: "0 0 40px rgba(168,85,247,0.12)",
        }}>
          <PenLine size={28} color="#A855F7" />
        </div>
        <h1 style={{ color: "#F0F4FF", fontSize: 24, fontWeight: 800, marginBottom: 10 }}>Content Studio</h1>
        <p style={{ color: "#3D4F72", fontSize: 15 }}>What do you want to write today?</p>
      </motion.div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, width: "100%", maxWidth: 680 }}>
        {TOOLS.map((t, i) => (
          <motion.button
            key={t.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            onClick={() => setTool(t.id)}
            style={{
              padding: "24px 22px", background: "rgba(13,20,32,0.9)",
              border: `1px solid ${t.color}20`, borderRadius: 18,
              cursor: "pointer", textAlign: "left", transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = `${t.color}45`;
              e.currentTarget.style.background = `${t.color}06`;
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = `${t.color}20`;
              e.currentTarget.style.background = "rgba(13,20,32,0.9)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: `${t.color}12`, border: `1px solid ${t.color}25`,
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 14, color: t.color,
            }}>
              {t.icon}
            </div>
            <p style={{ color: "#F0F4FF", fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{t.label}</p>
            <p style={{ color: "#3D4F72", fontSize: 12, lineHeight: 1.55, marginBottom: 14 }}>{t.description}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {t.tags.map((tag) => (
                <span key={tag} style={{
                  padding: "3px 8px", background: `${t.color}08`,
                  border: `1px solid ${t.color}18`, borderRadius: 6,
                  color: t.color, fontSize: 10, fontWeight: 600,
                }}>{tag}</span>
              ))}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
