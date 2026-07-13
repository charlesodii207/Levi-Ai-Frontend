"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Briefcase, ArrowLeft, Loader2, Copy, Check,
  FileText, PresentationIcon, BarChart2, Sparkles,
  ChevronDown, Send, RefreshCw,
} from "lucide-react";

type Tool = "landing" | "bizplan" | "pitchdeck" | "market" | "branding";

const INDUSTRIES = [
  "Technology", "Healthcare", "Finance & Fintech", "E-commerce",
  "Education", "Food & Beverage", "Real Estate", "Fashion",
  "Agriculture", "Logistics", "Media & Entertainment", "Energy",
  "Travel & Tourism", "Beauty & Wellness", "Sports & Fitness",
];

const COUNTRIES = [
  "Nigeria", "United States", "United Kingdom", "Kenya", "Ghana",
  "South Africa", "India", "Canada", "Australia", "UAE",
  "Germany", "France", "Brazil", "Egypt", "Singapore",
];

const TOOLS = [
  {
    id: "bizplan" as Tool,
    label: "Business Plan",
    icon: <FileText size={22} />,
    color: "#D4AF37",
    description: "Generate a full professional business plan with executive summary, market analysis, revenue model and more",
    tags: ["Executive Summary", "Revenue Model", "Operations", "Financials"],
  },
  {
    id: "pitchdeck" as Tool,
    label: "Pitch Deck",
    icon: <PresentationIcon size={22} />,
    color: "#3B82F6",
    description: "Build a compelling slide-by-slide pitch deck outline ready to present to investors",
    tags: ["Problem", "Solution", "Market Size", "Traction", "The Ask"],
  },
  {
    id: "market" as Tool,
    label: "Market Research",
    icon: <BarChart2 size={22} />,
    color: "#22C55E",
    description: "Deep dive into your market — competitors, trends, opportunities and SWOT analysis",
    tags: ["Competitors", "SWOT", "Market Size", "Trends"],
  },
  {
    id: "branding" as Tool,
    label: "Name & Branding",
    icon: <Sparkles size={22} />,
    color: "#A855F7",
    description: "Get business name ideas, taglines, brand personality and positioning for your idea",
    tags: ["Name Ideas", "Taglines", "Brand Voice", "Positioning"],
  },
];

async function callLevi(message: string): Promise<string> {
  const token = localStorage.getItem("levi_token");
  const res = await fetch("https://levi-ai-1ug2.onrender.com/chat/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ message }),
  });
  const data = await res.json();
  return data.response || "No response received.";
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{
        display: "flex", alignItems: "center", gap: 5, padding: "5px 12px",
        background: copied ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.04)",
        border: `1px solid ${copied ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.07)"}`,
        borderRadius: 8, color: copied ? "#22C55E" : "#8B9CC4",
        fontSize: 12, cursor: "pointer",
      }}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function ResultPanel({ result, color, onReset }: { result: string; color: string; onReset: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <span style={{ color, fontSize: 13, fontWeight: 700 }}>✦ Result</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onReset}
            style={{
              display: "flex", alignItems: "center", gap: 5, padding: "5px 12px",
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 8, color: "#8B9CC4", fontSize: 12, cursor: "pointer",
            }}>
            <RefreshCw size={12} /> New
          </button>
          <CopyButton text={result} />
        </div>
      </div>
      <div className="markdown-body">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
      </div>
    </motion.div>
  );
}

function LoadingState({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 300, gap: 16 }}>
      <div style={{
        width: 56, height: 56, borderRadius: "50%",
        background: `${color}10`, border: `1px solid ${color}25`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Loader2 size={22} color={color} style={{ animation: "spin 1s linear infinite" }} />
      </div>
      <p style={{ color: "#3D4F72", fontSize: 13 }}>Levi is generating your {label}...</p>
    </div>
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
        {value || placeholder}
        <ChevronDown size={13} color="#3D4F72" />
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
                  width: "100%", padding: "9px 14px", background: value === opt ? "rgba(212,175,55,0.08)" : "transparent",
                  border: "none", borderBottom: "1px solid rgba(255,255,255,0.04)",
                  color: value === opt ? "#D4AF37" : "#8B9CC4", fontSize: 13, textAlign: "left", cursor: "pointer",
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

// ── Business Plan ─────────────────────────────────────────────────────────────
function BizPlanTool({ onBack }: { onBack: () => void }) {
  const [form, setForm] = useState({ name: "", industry: "", market: "", problem: "", solution: "", model: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function generate() {
    if (!form.name || !form.industry || !form.problem) return;
    setLoading(true); setResult(null);
    const prompt = `Write a comprehensive, professional business plan for the following business. Format it with clear sections using markdown headers.

Business Name: ${form.name}
Industry: ${form.industry}
Target Market: ${form.market || "General consumers"}
Problem Being Solved: ${form.problem}
Solution/Product: ${form.solution || "To be defined"}
Revenue Model: ${form.model || "To be defined"}

Include these sections:
1. Executive Summary
2. Company Overview
3. Problem & Solution
4. Target Market & Customer Segments
5. Products/Services
6. Revenue Model & Pricing
7. Market Analysis
8. Competitive Advantage
9. Marketing & Sales Strategy
10. Operations Plan
11. Financial Projections (3-year outlook)
12. Funding Requirements (if any)
13. Conclusion

Be specific, realistic, and professional. Use bullet points where appropriate.`;
    try { setResult(await callLevi(prompt)); } catch {} finally { setLoading(false); }
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ flexShrink: 0, padding: "14px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "6px 10px", color: "#8B9CC4", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
          <ArrowLeft size={13} /> Back
        </button>
        <div>
          <h2 style={{ color: "#F0F4FF", fontSize: 16, fontWeight: 700, margin: 0 }}>Business Plan Generator</h2>
          <p style={{ color: "#3D4F72", fontSize: 12, margin: 0 }}>Fill in the details — Levi writes the full plan</p>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
        {!result && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: 680, margin: "0 auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              {[
                { key: "name", label: "Business Name *", placeholder: "e.g. PayFlow" },
                { key: "market", label: "Target Market", placeholder: "e.g. Small businesses in Nigeria" },
                { key: "solution", label: "Your Solution/Product", placeholder: "e.g. A mobile payment app" },
                { key: "model", label: "Revenue Model", placeholder: "e.g. Subscription, commission, ads" },
              ].map((f) => (
                <div key={f.key}>
                  <label style={{ color: "#6B7280", fontSize: 11, fontWeight: 600, letterSpacing: 0.5, display: "block", marginBottom: 7 }}>
                    {f.label.toUpperCase()}
                  </label>
                  <input
                    value={form[f.key as keyof typeof form]}
                    onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    style={{
                      width: "100%", background: "rgba(6,10,16,0.8)",
                      border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10,
                      padding: "11px 14px", color: "#F0F4FF", fontSize: 13,
                      outline: "none", fontFamily: "Inter, sans-serif",
                    }}
                  />
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ color: "#6B7280", fontSize: 11, fontWeight: 600, letterSpacing: 0.5, display: "block", marginBottom: 7 }}>INDUSTRY *</label>
              <Dropdown value={form.industry} onChange={(v) => setForm((p) => ({ ...p, industry: v }))} options={INDUSTRIES} placeholder="Select your industry" />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ color: "#6B7280", fontSize: 11, fontWeight: 600, letterSpacing: 0.5, display: "block", marginBottom: 7 }}>PROBLEM BEING SOLVED *</label>
              <textarea
                value={form.problem}
                onChange={(e) => setForm((p) => ({ ...p, problem: e.target.value }))}
                placeholder="What problem does your business solve? e.g. Small businesses in Nigeria struggle to accept online payments..."
                rows={3}
                style={{
                  width: "100%", background: "rgba(6,10,16,0.8)",
                  border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10,
                  padding: "11px 14px", color: "#F0F4FF", fontSize: 13,
                  outline: "none", resize: "none", fontFamily: "Inter, sans-serif", lineHeight: 1.6,
                }}
              />
            </div>

            <button onClick={generate} disabled={!form.name || !form.industry || !form.problem}
              style={{
                width: "100%", padding: "14px",
                background: form.name && form.industry && form.problem
                  ? "linear-gradient(135deg, #D4AF37, #F4D46B)"
                  : "rgba(255,255,255,0.04)",
                border: "none", borderRadius: 12,
                color: form.name && form.industry && form.problem ? "black" : "#3D4F72",
                fontSize: 15, fontWeight: 700,
                cursor: form.name && form.industry && form.problem ? "pointer" : "not-allowed",
                boxShadow: form.name && form.industry && form.problem ? "0 4px 24px rgba(212,175,55,0.25)" : "none",
              }}>
              Generate Business Plan
            </button>
          </motion.div>
        )}

        {loading && <LoadingState color="#D4AF37" label="business plan" />}
        {result && !loading && <ResultPanel result={result} color="#D4AF37" onReset={() => setResult(null)} />}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Pitch Deck ────────────────────────────────────────────────────────────────
function PitchDeckTool({ onBack }: { onBack: () => void }) {
  const [idea, setIdea] = useState("");
  const [stage, setStage] = useState("");
  const [ask, setAsk] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function generate() {
    if (!idea) return;
    setLoading(true); setResult(null);
    const prompt = `Create a detailed, compelling pitch deck outline for the following startup. Format each slide with a clear title, key points, and what visuals/data to include.

Business Idea: ${idea}
Funding Stage: ${stage || "Pre-seed/Seed"}
Funding Ask: ${ask || "To be determined"}

Create slides for:
1. Cover Slide
2. Problem
3. Solution
4. How It Works
5. Market Opportunity (TAM/SAM/SOM)
6. Business Model
7. Traction & Milestones
8. Competitive Landscape
9. Go-to-Market Strategy
10. Team
11. Financial Projections
12. The Ask & Use of Funds
13. Contact/Thank You

For each slide, provide: the slide title, 3-5 bullet points of content, and a tip for what visual or data to show. Make it investor-ready and compelling.`;
    try { setResult(await callLevi(prompt)); } catch {} finally { setLoading(false); }
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ flexShrink: 0, padding: "14px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "6px 10px", color: "#8B9CC4", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
          <ArrowLeft size={13} /> Back
        </button>
        <div>
          <h2 style={{ color: "#F0F4FF", fontSize: 16, fontWeight: 700, margin: 0 }}>Pitch Deck Builder</h2>
          <p style={{ color: "#3D4F72", fontSize: 12, margin: 0 }}>Investor-ready slide outline in seconds</p>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
        {!result && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: 620, margin: "0 auto" }}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ color: "#6B7280", fontSize: 11, fontWeight: 600, letterSpacing: 0.5, display: "block", marginBottom: 7 }}>YOUR BUSINESS IDEA *</label>
              <textarea value={idea} onChange={(e) => setIdea(e.target.value)}
                placeholder="Describe your business in 2-3 sentences. What do you do, who is it for, and what problem does it solve?"
                rows={4}
                style={{ width: "100%", background: "rgba(6,10,16,0.8)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "12px 14px", color: "#F0F4FF", fontSize: 13, outline: "none", resize: "none", fontFamily: "Inter, sans-serif", lineHeight: 1.6 }}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
              <div>
                <label style={{ color: "#6B7280", fontSize: 11, fontWeight: 600, letterSpacing: 0.5, display: "block", marginBottom: 7 }}>FUNDING STAGE</label>
                <Dropdown value={stage} onChange={setStage} options={["Pre-seed", "Seed", "Series A", "Series B", "Growth"]} placeholder="Select stage" />
              </div>
              <div>
                <label style={{ color: "#6B7280", fontSize: 11, fontWeight: 600, letterSpacing: 0.5, display: "block", marginBottom: 7 }}>FUNDING ASK</label>
                <input value={ask} onChange={(e) => setAsk(e.target.value)} placeholder="e.g. $500,000"
                  style={{ width: "100%", background: "rgba(6,10,16,0.8)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "11px 14px", color: "#F0F4FF", fontSize: 13, outline: "none", fontFamily: "Inter, sans-serif" }}
                />
              </div>
            </div>
            <button onClick={generate} disabled={!idea}
              style={{
                width: "100%", padding: "14px",
                background: idea ? "linear-gradient(135deg, #0057FF, #3B82F6)" : "rgba(255,255,255,0.04)",
                border: "none", borderRadius: 12, color: idea ? "white" : "#3D4F72",
                fontSize: 15, fontWeight: 700, cursor: idea ? "pointer" : "not-allowed",
                boxShadow: idea ? "0 4px 24px rgba(0,87,255,0.25)" : "none",
              }}>
              Build Pitch Deck
            </button>
          </motion.div>
        )}
        {loading && <LoadingState color="#3B82F6" label="pitch deck" />}
        {result && !loading && <ResultPanel result={result} color="#3B82F6" onReset={() => setResult(null)} />}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Market Research ───────────────────────────────────────────────────────────
function MarketTool({ onBack }: { onBack: () => void }) {
  const [niche, setNiche] = useState("");
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function generate() {
    if (!niche) return;
    setLoading(true); setResult(null);
    const prompt = `Conduct a thorough market research report for the following business niche. Be specific, data-driven, and insightful.

Business Niche/Idea: ${niche}
Industry: ${industry || "General"}
Target Country/Region: ${country || "Global"}

Provide a detailed report covering:

## 1. Market Overview
- Market size and value
- Growth rate and projections
- Key market segments

## 2. Target Customer Analysis
- Demographics and psychographics
- Customer pain points
- Buying behavior

## 3. Competitive Landscape
- Top 5 competitors (real or typical for this niche)
- Their strengths and weaknesses
- Market gaps and opportunities

## 4. SWOT Analysis
- Strengths, Weaknesses, Opportunities, Threats

## 5. Market Trends
- Current trends shaping the market
- Emerging opportunities
- Potential disruptions

## 6. Go-to-Market Insights
- Best channels to reach customers
- Pricing benchmarks
- Key success factors

## 7. Verdict & Recommendation
- Is this a good market to enter?
- Key risks to watch
- Top 3 strategic recommendations

Be thorough, realistic, and actionable.`;
    try { setResult(await callLevi(prompt)); } catch {} finally { setLoading(false); }
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ flexShrink: 0, padding: "14px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "6px 10px", color: "#8B9CC4", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
          <ArrowLeft size={13} /> Back
        </button>
        <div>
          <h2 style={{ color: "#F0F4FF", fontSize: 16, fontWeight: 700, margin: 0 }}>Market Research Tool</h2>
          <p style={{ color: "#3D4F72", fontSize: 12, margin: 0 }}>Deep market analysis powered by Levi</p>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
        {!result && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: 620, margin: "0 auto" }}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ color: "#6B7280", fontSize: 11, fontWeight: 600, letterSpacing: 0.5, display: "block", marginBottom: 7 }}>YOUR BUSINESS NICHE *</label>
              <textarea value={niche} onChange={(e) => setNiche(e.target.value)}
                placeholder="Describe your business idea or niche. e.g. An online platform connecting freelance designers with small businesses in Africa"
                rows={3}
                style={{ width: "100%", background: "rgba(6,10,16,0.8)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "12px 14px", color: "#F0F4FF", fontSize: 13, outline: "none", resize: "none", fontFamily: "Inter, sans-serif", lineHeight: 1.6 }}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
              <div>
                <label style={{ color: "#6B7280", fontSize: 11, fontWeight: 600, letterSpacing: 0.5, display: "block", marginBottom: 7 }}>INDUSTRY</label>
                <Dropdown value={industry} onChange={setIndustry} options={INDUSTRIES} placeholder="Select industry" />
              </div>
              <div>
                <label style={{ color: "#6B7280", fontSize: 11, fontWeight: 600, letterSpacing: 0.5, display: "block", marginBottom: 7 }}>TARGET COUNTRY</label>
                <Dropdown value={country} onChange={setCountry} options={COUNTRIES} placeholder="Select country" />
              </div>
            </div>
            <button onClick={generate} disabled={!niche}
              style={{
                width: "100%", padding: "14px",
                background: niche ? "linear-gradient(135deg, #16a34a, #22C55E)" : "rgba(255,255,255,0.04)",
                border: "none", borderRadius: 12, color: niche ? "white" : "#3D4F72",
                fontSize: 15, fontWeight: 700, cursor: niche ? "pointer" : "not-allowed",
                boxShadow: niche ? "0 4px 24px rgba(34,197,94,0.2)" : "none",
              }}>
              Run Market Research
            </button>
          </motion.div>
        )}
        {loading && <LoadingState color="#22C55E" label="market research" />}
        {result && !loading && <ResultPanel result={result} color="#22C55E" onReset={() => setResult(null)} />}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Branding ──────────────────────────────────────────────────────────────────
function BrandingTool({ onBack }: { onBack: () => void }) {
  const [idea, setIdea] = useState("");
  const [vibe, setVibe] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function generate() {
    if (!idea) return;
    setLoading(true); setResult(null);
    const prompt = `Generate creative business names, taglines, and branding concepts for the following business idea.

Business Idea: ${idea}
Brand Vibe/Personality: ${vibe || "Professional, modern, trustworthy"}

Provide:

## 10 Business Name Ideas
For each name: the name, why it works, and domain name suggestion (.com or .co)

## 5 Tagline Options
Short, punchy, memorable taglines for the brand

## Brand Personality
- Brand voice (how it speaks)
- Brand values (3-5 core values)
- Tone of communication

## Brand Positioning Statement
One paragraph describing what the brand stands for and how it differs from competitors

## Color Palette Suggestions
Suggest 2-3 color palette options with hex codes and the emotion each conveys

## Target Audience Profile
A brief profile of the ideal customer this brand should appeal to

Be creative, original, and think like a world-class branding agency.`;
    try { setResult(await callLevi(prompt)); } catch {} finally { setLoading(false); }
  }

  const VIBES = ["Luxury & Premium", "Fun & Playful", "Professional & Corporate", "Bold & Disruptive", "Minimal & Clean", "Warm & Friendly", "Tech & Futuristic"];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ flexShrink: 0, padding: "14px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "6px 10px", color: "#8B9CC4", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
          <ArrowLeft size={13} /> Back
        </button>
        <div>
          <h2 style={{ color: "#F0F4FF", fontSize: 16, fontWeight: 700, margin: 0 }}>Name & Branding Generator</h2>
          <p style={{ color: "#3D4F72", fontSize: 12, margin: 0 }}>Names, taglines, and brand identity</p>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
        {!result && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: 620, margin: "0 auto" }}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ color: "#6B7280", fontSize: 11, fontWeight: 600, letterSpacing: 0.5, display: "block", marginBottom: 7 }}>YOUR BUSINESS IDEA *</label>
              <textarea value={idea} onChange={(e) => setIdea(e.target.value)}
                placeholder="Describe your business. What does it do, who is it for? e.g. A delivery service for fresh farm produce in Lagos"
                rows={3}
                style={{ width: "100%", background: "rgba(6,10,16,0.8)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "12px 14px", color: "#F0F4FF", fontSize: 13, outline: "none", resize: "none", fontFamily: "Inter, sans-serif", lineHeight: 1.6 }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ color: "#6B7280", fontSize: 11, fontWeight: 600, letterSpacing: 0.5, display: "block", marginBottom: 10 }}>BRAND VIBE</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {VIBES.map((v) => (
                  <button key={v} onClick={() => setVibe(v === vibe ? "" : v)}
                    style={{
                      padding: "7px 14px",
                      background: vibe === v ? "rgba(168,85,247,0.12)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${vibe === v ? "rgba(168,85,247,0.35)" : "rgba(255,255,255,0.07)"}`,
                      borderRadius: 20, color: vibe === v ? "#A855F7" : "#6B7280",
                      fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all 0.15s",
                    }}>
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={generate} disabled={!idea}
              style={{
                width: "100%", padding: "14px",
                background: idea ? "linear-gradient(135deg, #7C3AED, #A855F7)" : "rgba(255,255,255,0.04)",
                border: "none", borderRadius: 12, color: idea ? "white" : "#3D4F72",
                fontSize: 15, fontWeight: 700, cursor: idea ? "pointer" : "not-allowed",
                boxShadow: idea ? "0 4px 24px rgba(168,85,247,0.2)" : "none",
              }}>
              Generate Brand Identity
            </button>
          </motion.div>
        )}
        {loading && <LoadingState color="#A855F7" label="brand identity" />}
        {result && !loading && <ResultPanel result={result} color="#A855F7" onReset={() => setResult(null)} />}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Main Hub ──────────────────────────────────────────────────────────────────
export default function BusinessHub() {
  const [tool, setTool] = useState<Tool>("landing");

  if (tool === "bizplan") return <BizPlanTool onBack={() => setTool("landing")} />;
  if (tool === "pitchdeck") return <PitchDeckTool onBack={() => setTool("landing")} />;
  if (tool === "market") return <MarketTool onBack={() => setTool("landing")} />;
  if (tool === "branding") return <BrandingTool onBack={() => setTool("landing")} />;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 28px", overflow: "auto" }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16,
          background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px", boxShadow: "0 0 40px rgba(212,175,55,0.12)",
        }}>
          <Briefcase size={28} color="#D4AF37" />
        </div>
        <h1 style={{ color: "#F0F4FF", fontSize: 24, fontWeight: 800, marginBottom: 10 }}>Business Hub</h1>
        <p style={{ color: "#3D4F72", fontSize: 15 }}>What do you want to build today?</p>
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
