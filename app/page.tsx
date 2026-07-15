"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, ArrowRight, ChevronDown, Mail, Sparkles,
  Zap, LayoutGrid, ShieldCheck, Gauge, Download, Handshake,
} from "lucide-react";
import { LEVI_MODES } from "./components/Sidebar";
import { isLoggedIn } from "./lib/auth";
import SplashScreen from "./components/SplashScreen";

// ---------------------------------------------------------------------------
// Content data
// ---------------------------------------------------------------------------

const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Why Levi", href: "#why" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
  { label: "Contact", href: "#contact" },
];

const MODE_SPECS: Record<string, string[]> = {
  coding: [
    "Paste existing code, or describe what to build from scratch",
    "Explain, Debug, Optimize, Convert, Test, or Comment any code",
    "Automatic language detection across 16+ languages",
    "Dedicated code editor workspace, not a plain chat box",
  ],
  crypto: [
    "Live market data pulled in real time, not guessed",
    "AI trend analysis with an honest confidence score",
    "Entry, Stop Loss, and Take Profit levels calculated for you",
    "Multi-timeframe confluence + optional auto-refresh",
  ],
  business: [
    "Full business plan generation, section by section",
    "SWOT analysis and competitor research",
    "Financial projections and pricing strategy",
    "Pitch deck outlines built for investors",
  ],
  writing: [
    "Creative writing, storytelling, and fiction",
    "Copywriting for ads, landing pages, and email",
    "Blog posts, outlines, and content calendars",
    "Editing, tone adjustment, and proofreading",
  ],
  research: [
    "Topic Deep Dive — structured breakdowns on anything",
    "Comparison Analyst — side-by-side tables with a verdict",
    "Fact Checker — accuracy assessment, not just a summary",
    "Every result is copyable and downloadable",
  ],
};

const WHY_LEVI = [
  {
    icon: <LayoutGrid size={20} />,
    title: "Purpose-built Modes",
    description: "Not one generic chat trying to do everything. Each mode is its own workspace with tools tailored to the job.",
  },
  {
    icon: <Gauge size={20} />,
    title: "Live data where it matters",
    description: "Crypto mode pulls real market data. Research mode can fact-check against real claims. No made-up numbers presented as fact.",
  },
  {
    icon: <Download size={20} />,
    title: "Real deliverables, not just chat",
    description: "Copy or download structured results — reports, comparisons, code — instead of scrolling through a wall of chat bubbles.",
  },
  {
    icon: <Zap size={20} />,
    title: "Fast, premium interface",
    description: "Built to feel instant and get out of your way, not to look like a bolted-together prototype.",
  },
  {
    icon: <ShieldCheck size={20} />,
    title: "Honest about limits",
    description: "Confidence scores, accuracy assessments, and disclaimers are built in where it counts — not hidden or oversold.",
  },
  {
    icon: <Sparkles size={20} />,
    title: "Always adding more",
    description: "Levi isn't capped at 5 skills. More specialized modes are on the way as the platform grows.",
  },
];

const PRICING_TIERS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Everything you need to try Levi across every mode.",
    features: [
      "Access to all modes",
      "Limited messages per day",
      "Standard response speed",
      "Conversation history",
    ],
    highlighted: true,
    available: true,
    cta: "Get Started Free",
  },
  {
    name: "Pro",
    price: "$9.99",
    period: "/ month",
    description: "For people who use Levi daily and want more headroom.",
    features: [
      "Everything in Free",
      "Unlimited messages",
      "Priority response speed",
      "Full workspace exports",
    ],
    highlighted: false,
    available: false,
    cta: "Coming Soon",
  },
  {
    name: "Prime",
    price: "Custom",
    period: "",
    description: "For teams that want Levi across the whole company.",
    features: [
      "Everything in Pro",
      "Shared team workspace",
      "Admin controls",
      "Priority support",
    ],
    highlighted: false,
    available: false,
    cta: "Coming Soon",
  },
];

const FAQS = [
  {
    q: "What is Levi AI?",
    a: "Levi is an AI assistant built around specialized Modes — Coding, Crypto & Forex, Business, Writing, and Research — each with its own dedicated workspace and tools, instead of one generic chat box trying to handle everything.",
  },
  {
    q: "Is Levi free to use?",
    a: "Yes — the Free tier gives you access to every mode with no card required. Pro and Prime tiers with higher limits are coming soon.",
  },
  {
    q: "Can I switch between modes?",
    a: "Yes, anytime. Each mode is a self-contained workspace, so you can jump from debugging code to analyzing a trading pair to drafting a business plan in seconds.",
  },
  {
    q: "Is my data private?",
    a: "Your conversations are tied to your account and aren't shared publicly. We're continuing to build out more detailed privacy controls as the platform grows.",
  },
  {
    q: "Will more modes be added?",
    a: "Yes — Levi isn't capped at 5 modes. More specialized workspaces are planned as the platform develops.",
  },
];

// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------

function scrollToId(id: string) {
  const el = document.querySelector(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function LandingPage() {
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  function handleSplashFinish() {
    if (isLoggedIn()) {
      setRedirecting(true);
      router.replace("/app");
    } else {
      setShowSplash(false);
    }
  }

  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  if (redirecting) {
    return <div style={{ width: "100vw", height: "100vh", background: "#080C14" }} />;
  }

  return (
    <div style={{
      width: "100%", minHeight: "100vh",
      background: "#080C14",
      color: "white",
      fontFamily: "Inter, sans-serif",
      overflowX: "hidden",
      position: "relative",
      scrollBehavior: "smooth",
    }}>
      {/* Ambient background */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        background: `
          radial-gradient(ellipse 70% 50% at 50% -10%, rgba(59,130,246,0.22) 0%, transparent 65%),
          radial-gradient(ellipse 50% 40% at 85% 15%, rgba(212,175,55,0.18) 0%, transparent 60%),
          radial-gradient(ellipse 45% 35% at 10% 60%, rgba(212,175,55,0.10) 0%, transparent 60%),
          radial-gradient(ellipse 55% 45% at 90% 90%, rgba(59,130,246,0.14) 0%, transparent 65%)
        `,
      }} />

      {/* Nav */}
      <div style={{
        position: "sticky", top: 0, zIndex: 20,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 40px",
        background: "rgba(8,12,20,0.75)",
        backdropFilter: "blur(14px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        flexWrap: "wrap", gap: 12,
      }}>
        <img src="/logolevi.png" alt="Levi" style={{ height: 28, width: "auto" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
          {NAV_LINKS.map((link) => (
            <button
              key={link.href}
              onClick={() => scrollToId(link.href)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#8B9CC4", fontSize: 13.5, fontWeight: 600,
                padding: 0, textShadow: "none",
                transition: "color 0.2s ease, text-shadow 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#F4D46B";
                e.currentTarget.style.textShadow = "0 0 12px rgba(212,175,55,0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#8B9CC4";
                e.currentTarget.style.textShadow = "none";
              }}
            >
              {link.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <a href="/login" style={{
            color: "#C8D4F0", fontSize: 13.5, fontWeight: 600,
            textDecoration: "none", padding: "8px 14px",
            borderRadius: 9, border: "1px solid transparent",
            transition: "all 0.2s ease",
          }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(59,130,246,0.4)";
              e.currentTarget.style.background = "rgba(59,130,246,0.1)";
              e.currentTarget.style.boxShadow = "0 0 20px rgba(59,130,246,0.25)";
              e.currentTarget.style.color = "#93C5FD";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "transparent";
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.color = "#C8D4F0";
            }}
          >
            Sign In
          </a>
          <a href="/register" style={{
            color: "#080C14", fontSize: 13.5, fontWeight: 700,
            textDecoration: "none", padding: "9px 18px",
            background: "linear-gradient(135deg, #D4AF37, #F4D46B)",
            borderRadius: 10,
            boxShadow: "0 4px 20px rgba(212,175,55,0.3)",
            transition: "all 0.2s ease", display: "inline-block",
          }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 6px 28px rgba(212,175,55,0.5)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "0 4px 20px rgba(212,175,55,0.3)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Get Started
          </a>
        </div>
      </div>

      {/* HOME / HERO */}
      <div id="home" style={{
        position: "relative", zIndex: 1,
        display: "flex", flexDirection: "column", alignItems: "center",
        textAlign: "center", padding: "90px 24px 40px",
      }}>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "6px 16px", marginBottom: 26,
            background: "rgba(212,175,55,0.1)",
            border: "1px solid rgba(212,175,55,0.3)",
            borderRadius: 20,
            color: "#F4D46B", fontSize: 13, fontWeight: 600,
          }}
        >
          ✨ Modes for the job, or just talk — your call
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            fontSize: "clamp(38px, 6vw, 66px)",
            fontWeight: 900, lineHeight: 1.08,
            maxWidth: 880, margin: 0, letterSpacing: -1,
          }}
        >
          The AI assistant that's{" "}
          <span style={{
            background: "linear-gradient(135deg, #D4AF37 0%, #F4D46B 40%, #3B82F6 75%, #0057FF 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            filter: "drop-shadow(0 0 30px rgba(212,175,55,0.35))",
          }}>
            actually built for the job
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            color: "#8B9CC4", fontSize: 18, maxWidth: 640,
            marginTop: 20, lineHeight: 1.6,
          }}
        >
          Levi switches into a dedicated workspace for coding, trading, business,
          writing, or research — each one tailored with its own tools and specs.
          Or skip the modes entirely and just have a normal conversation, like
          any other AI chat.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ display: "flex", gap: 14, marginTop: 32, flexWrap: "wrap", justifyContent: "center" }}
        >
          <a href="/register" style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "15px 28px",
            background: "linear-gradient(135deg, #D4AF37, #F4D46B)",
            color: "#080C14", fontWeight: 700, fontSize: 15,
            borderRadius: 14, textDecoration: "none",
            boxShadow: "0 8px 30px rgba(212,175,55,0.35)",
            transition: "all 0.25s ease",
          }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 10px 42px rgba(212,175,55,0.55)";
              e.currentTarget.style.transform = "translateY(-3px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "0 8px 30px rgba(212,175,55,0.35)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Get Started Free <ArrowRight size={16} />
          </a>
          <a href="/login" style={{
            padding: "15px 28px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "white", fontWeight: 600, fontSize: 15,
            borderRadius: 14, textDecoration: "none",
            transition: "all 0.25s ease",
          }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(59,130,246,0.12)";
              e.currentTarget.style.borderColor = "rgba(59,130,246,0.5)";
              e.currentTarget.style.boxShadow = "0 8px 30px rgba(59,130,246,0.3)";
              e.currentTarget.style.transform = "translateY(-3px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.05)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Sign In
          </a>
        </motion.div>

        {/* App preview — dominant, full-width. Swap to a <video> tag here later. */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.6 }}
          style={{
            position: "relative",
            marginTop: 60,
            width: "100%", maxWidth: 1080,
          }}
        >
          {/* Ambient blurred duplicate — atmosphere only, not meant to be read.
              This is the "picture as background" feeling without sacrificing
              legibility of the sharp image on top. */}
          <div style={{
            position: "absolute",
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%) scale(1.15)",
            width: "100%",
            zIndex: 0,
            opacity: 0.35,
            filter: "blur(60px) saturate(1.3)",
            pointerEvents: "none",
          }}>
            <img
              src="/hero-preview.png"
              alt=""
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </div>

          {/* Sharp dominant screenshot */}
          <div style={{
            position: "relative",
            width: "100%",
            borderRadius: 22,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 30px 90px rgba(0,0,0,0.55), 0 0 90px rgba(212,175,55,0.1)",
            zIndex: 1,
          }}>
            <img
              src="/hero-preview.png"
              alt="Levi app preview"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </div>
        </motion.div>
      </div>

      {/* ABOUT */}
      <div id="about" style={{
        position: "relative", zIndex: 1, padding: "100px 24px",
        maxWidth: 880, margin: "0 auto", textAlign: "center",
      }}>
        <p style={{ color: "#F4D46B", fontSize: 13, fontWeight: 700, letterSpacing: 1.5, marginBottom: 10 }}>
          ABOUT LEVI
        </p>
        <h2 style={{ fontSize: "clamp(26px, 4vw, 38px)", fontWeight: 800, margin: "0 0 18px" }}>
          Built to be genuinely useful, not just impressive
        </h2>
        <p style={{ color: "#8B9CC4", fontSize: 16, lineHeight: 1.75 }}>
          Most AI tools give you one chat box and expect it to handle everything —
          code, market analysis, business planning, writing, research — with the same
          shallow context every time. Levi takes a different approach: it switches into
          a dedicated Mode built specifically for what you're trying to do, complete with
          its own tools, layout, and output format. The result is an assistant that feels
          less like a generic chatbot and more like a set of purpose-built tools that
          happen to share one brain.
        </p>
      </div>

      {/* SERVICES / MODES */}
      <div id="services" style={{ position: "relative", zIndex: 1, padding: "20px 24px 100px", maxWidth: 1180, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <p style={{ color: "#F4D46B", fontSize: 13, fontWeight: 700, letterSpacing: 1.5, marginBottom: 10 }}>
            SERVICES
          </p>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, margin: "0 0 14px" }}>
            Not one chat box. Purpose-built modes.
          </h2>
          <p style={{ color: "#8B9CC4", fontSize: 15, maxWidth: 560, margin: "0 auto" }}>
            Levi isn't limited to these five — each is a fully specialized workspace,
            and more modes are on the way.
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 20,
        }}>
          {LEVI_MODES.map((mode, i) => (
            <motion.div
              key={mode.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              style={{
                padding: "26px 22px",
                background: `${mode.color}0A`,
                border: `1px solid ${mode.color}30`,
                borderRadius: 18,
                transition: "background 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease",
                boxShadow: "none",
                cursor: "default",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `${mode.color}18`;
                e.currentTarget.style.borderColor = `${mode.color}70`;
                e.currentTarget.style.boxShadow = `0 0 34px ${mode.color}30`;
                e.currentTarget.style.transform = "translateY(-3px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = `${mode.color}0A`;
                e.currentTarget.style.borderColor = `${mode.color}30`;
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: `${mode.color}18`,
                border: `1px solid ${mode.color}45`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: mode.color, marginBottom: 16,
              }}>
                {mode.icon}
              </div>
              <div style={{ color: "white", fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
                {mode.label}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {MODE_SPECS[mode.id].map((spec) => (
                  <div key={spec} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <Check size={13} color={mode.color} style={{ flexShrink: 0, marginTop: 3 }} />
                    <span style={{ color: "#8B9CC4", fontSize: 13, lineHeight: 1.5 }}>{spec}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}

          {/* "More coming" card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: LEVI_MODES.length * 0.06 }}
            style={{
              padding: "26px 22px",
              background: "rgba(255,255,255,0.02)",
              border: "1px dashed rgba(255,255,255,0.15)",
              borderRadius: 18,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              textAlign: "center", gap: 10,
            }}
          >
            <Sparkles size={26} color="#6B7280" />
            <div style={{ color: "white", fontSize: 15, fontWeight: 700 }}>More modes coming</div>
            <div style={{ color: "#6B7280", fontSize: 13 }}>Levi keeps expanding into new specialties.</div>
          </motion.div>
        </div>
      </div>

      {/* WHY LEVI */}
      <div id="why" style={{ position: "relative", zIndex: 1, padding: "20px 24px 100px", maxWidth: 1180, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <p style={{ color: "#F4D46B", fontSize: 13, fontWeight: 700, letterSpacing: 1.5, marginBottom: 10 }}>
            WHY LEVI AI
          </p>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, margin: 0 }}>
            What actually makes it different
          </h2>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 20,
        }}>
          {WHY_LEVI.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              style={{
                padding: "24px 22px",
                background: "#0D1117",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 16,
                transition: "background 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease",
                boxShadow: "none",
                cursor: "default",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(59,130,246,0.07)";
                e.currentTarget.style.borderColor = "rgba(59,130,246,0.45)";
                e.currentTarget.style.boxShadow = "0 0 34px rgba(59,130,246,0.22)";
                e.currentTarget.style.transform = "translateY(-3px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#0D1117";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: "rgba(212,175,55,0.1)",
                border: "1px solid rgba(212,175,55,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#F4D46B", marginBottom: 14,
              }}>
                {item.icon}
              </div>
              <div style={{ color: "white", fontSize: 15.5, fontWeight: 700, marginBottom: 8 }}>
                {item.title}
              </div>
              <div style={{ color: "#8B9CC4", fontSize: 13.5, lineHeight: 1.6 }}>
                {item.description}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* PRICING */}
      <div id="pricing" style={{ position: "relative", zIndex: 1, padding: "20px 24px 110px", maxWidth: 1080, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <p style={{ color: "#F4D46B", fontSize: 13, fontWeight: 700, letterSpacing: 1.5, marginBottom: 10 }}>
            SIMPLE PRICING
          </p>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, margin: "0 0 12px" }}>
            Start free. Upgrade when you need to.
          </h2>
          <p style={{ color: "#8B9CC4", fontSize: 15 }}>
            Pro and Prime are on the way — Free is fully open right now.
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 20, alignItems: "start",
        }}>
          {PRICING_TIERS.map((tier) => (
            <div
              key={tier.name}
              style={{
                padding: "32px 26px",
                background: tier.highlighted ? "rgba(212,175,55,0.06)" : "#0D1117",
                border: tier.highlighted
                  ? "1px solid rgba(212,175,55,0.4)"
                  : "1px solid rgba(255,255,255,0.07)",
                borderRadius: 20,
                position: "relative",
                boxShadow: tier.highlighted ? "0 0 50px rgba(212,175,55,0.12)" : "none",
                opacity: tier.available ? 1 : 0.7,
                transition: "background 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease",
                cursor: "default",
              }}
              onMouseEnter={(e) => {
                if (tier.highlighted) {
                  e.currentTarget.style.background = "rgba(212,175,55,0.1)";
                  e.currentTarget.style.borderColor = "rgba(212,175,55,0.65)";
                  e.currentTarget.style.boxShadow = "0 0 60px rgba(212,175,55,0.28)";
                } else {
                  e.currentTarget.style.background = "rgba(59,130,246,0.06)";
                  e.currentTarget.style.borderColor = "rgba(59,130,246,0.45)";
                  e.currentTarget.style.boxShadow = "0 0 44px rgba(59,130,246,0.2)";
                }
                e.currentTarget.style.transform = "translateY(-4px)";
              }}
              onMouseLeave={(e) => {
                if (tier.highlighted) {
                  e.currentTarget.style.background = "rgba(212,175,55,0.06)";
                  e.currentTarget.style.borderColor = "rgba(212,175,55,0.4)";
                  e.currentTarget.style.boxShadow = "0 0 50px rgba(212,175,55,0.12)";
                } else {
                  e.currentTarget.style.background = "#0D1117";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                  e.currentTarget.style.boxShadow = "none";
                }
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {tier.highlighted && (
                <div style={{
                  position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)",
                  padding: "4px 14px",
                  background: "linear-gradient(135deg, #D4AF37, #F4D46B)",
                  color: "#080C14", fontSize: 11, fontWeight: 800,
                  borderRadius: 20, letterSpacing: 0.5,
                }}>
                  AVAILABLE NOW
                </div>
              )}
              {!tier.available && (
                <div style={{
                  position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)",
                  padding: "4px 14px",
                  background: "rgba(59,130,246,0.12)",
                  border: "1px solid rgba(59,130,246,0.3)",
                  color: "#93C5FD", fontSize: 11, fontWeight: 800,
                  borderRadius: 20, letterSpacing: 0.5,
                }}>
                  COMING SOON
                </div>
              )}
              <div style={{ color: "white", fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
                {tier.name}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 10 }}>
                <span style={{ fontSize: 36, fontWeight: 900, color: "white" }}>{tier.price}</span>
                {tier.period && <span style={{ color: "#6B7280", fontSize: 14 }}>{tier.period}</span>}
              </div>
              <p style={{ color: "#8B9CC4", fontSize: 13.5, marginBottom: 22, lineHeight: 1.5, minHeight: 40 }}>
                {tier.description}
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 11, marginBottom: 26 }}>
                {tier.features.map((f) => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <Check size={15} color={tier.highlighted ? "#D4AF37" : "#3B82F6"} style={{ flexShrink: 0 }} />
                    <span style={{ color: "#C8D4F0", fontSize: 13.5 }}>{f}</span>
                  </div>
                ))}
              </div>

              {tier.available ? (
                <a
                  href="/register"
                  style={{
                    display: "block", textAlign: "center",
                    padding: "13px", borderRadius: 12,
                    textDecoration: "none", fontSize: 14, fontWeight: 700,
                    background: "linear-gradient(135deg, #D4AF37, #F4D46B)",
                    color: "#080C14",
                    transition: "box-shadow 0.25s ease, transform 0.25s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 6px 26px rgba(212,175,55,0.45)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {tier.cta}
                </a>
              ) : (
                <div style={{
                  display: "block", textAlign: "center",
                  padding: "13px", borderRadius: 12,
                  fontSize: 14, fontWeight: 700,
                  background: "rgba(255,255,255,0.04)",
                  color: "#6B7280",
                  border: "1px solid rgba(255,255,255,0.08)",
                  cursor: "not-allowed",
                }}>
                  {tier.cta}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* SPONSORSHIP BAR */}
      <div style={{
        position: "relative", zIndex: 1,
        margin: "0 24px 90px",
        maxWidth: 1080, marginLeft: "auto", marginRight: "auto",
        padding: "20px 28px",
        background: "linear-gradient(90deg, rgba(59,130,246,0.08), rgba(212,175,55,0.08))",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 14,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: "rgba(212,175,55,0.12)",
            border: "1px solid rgba(212,175,55,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#F4D46B", flexShrink: 0,
          }}>
            <Handshake size={18} />
          </div>
          <div>
            <div style={{ color: "white", fontSize: 14.5, fontWeight: 700 }}>
              Interested in sponsoring Levi AI?
            </div>
            <div style={{ color: "#8B9CC4", fontSize: 13 }}>
              We're open to partnerships and sponsorships as the platform grows.
            </div>
          </div>
        </div>
        <a href="mailto:charlesodii207@gmail.com" style={{
          padding: "10px 20px", borderRadius: 10,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.15)",
          color: "white", fontWeight: 600, fontSize: 13.5,
          textDecoration: "none", whiteSpace: "nowrap",
          transition: "all 0.25s ease",
        }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(59,130,246,0.14)";
            e.currentTarget.style.borderColor = "rgba(59,130,246,0.5)";
            e.currentTarget.style.boxShadow = "0 0 26px rgba(59,130,246,0.3)";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.06)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          Get in touch
        </a>
      </div>

      {/* FAQ */}
      <div id="faq" style={{ position: "relative", zIndex: 1, padding: "20px 24px 110px", maxWidth: 780, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <p style={{ color: "#F4D46B", fontSize: 13, fontWeight: 700, letterSpacing: 1.5, marginBottom: 10 }}>
            FAQ
          </p>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, margin: 0 }}>
            Common questions
          </h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {FAQS.map((item, i) => {
            const isOpen = openFaq === i;
            return (
              <div
                key={item.q}
                style={{
                  background: isOpen ? "rgba(59,130,246,0.05)" : "#0D1117",
                  border: isOpen ? "1px solid rgba(59,130,246,0.35)" : "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 14, overflow: "hidden",
                  transition: "background 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease",
                  boxShadow: isOpen ? "0 0 30px rgba(59,130,246,0.15)" : "none",
                }}
                onMouseEnter={(e) => {
                  if (!isOpen) {
                    e.currentTarget.style.background = "rgba(59,130,246,0.04)";
                    e.currentTarget.style.borderColor = "rgba(59,130,246,0.3)";
                    e.currentTarget.style.boxShadow = "0 0 24px rgba(59,130,246,0.12)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isOpen) {
                    e.currentTarget.style.background = "#0D1117";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                    e.currentTarget.style.boxShadow = "none";
                  }
                }}
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                  style={{
                    width: "100%", padding: "18px 20px",
                    background: "none", border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    textAlign: "left",
                  }}
                >
                  <span style={{ color: "white", fontSize: 14.5, fontWeight: 600 }}>{item.q}</span>
                  <motion.span animate={{ rotate: isOpen ? 180 : 0 }} style={{ color: "#6B7280", flexShrink: 0, marginLeft: 12 }}>
                    <ChevronDown size={17} />
                  </motion.span>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      style={{ overflow: "hidden" }}
                    >
                      <p style={{ color: "#8B9CC4", fontSize: 13.5, lineHeight: 1.6, padding: "0 20px 18px" }}>
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* CONTACT */}
      <div id="contact" style={{
        position: "relative", zIndex: 1,
        margin: "0 24px 100px",
        maxWidth: 780, marginLeft: "auto", marginRight: "auto",
        padding: "50px 40px",
        background: "#0D1117",
        border: "1px solid rgba(59,130,246,0.2)",
        borderRadius: 24,
        textAlign: "center",
      }}>
        <p style={{ color: "#60A5FA", fontSize: 13, fontWeight: 700, letterSpacing: 1.5, marginBottom: 10 }}>
          CONTACT
        </p>
        <h2 style={{ fontSize: "clamp(24px, 3.5vw, 32px)", fontWeight: 800, margin: "0 0 14px" }}>
          Questions? Reach out.
        </h2>
        <p style={{ color: "#8B9CC4", fontSize: 15, marginBottom: 26 }}>
          We're happy to help. Email us and we'll get back to you.
        </p>
        <a href="mailto:charlesodii207@gmail.com" style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "13px 24px",
          background: "rgba(59,130,246,0.1)",
          border: "1px solid rgba(59,130,246,0.35)",
          color: "#93C5FD", fontWeight: 700, fontSize: 14,
          borderRadius: 12, textDecoration: "none",
          transition: "all 0.25s ease",
        }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(59,130,246,0.18)";
            e.currentTarget.style.borderColor = "rgba(59,130,246,0.6)";
            e.currentTarget.style.boxShadow = "0 0 30px rgba(59,130,246,0.3)";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(59,130,246,0.1)";
            e.currentTarget.style.borderColor = "rgba(59,130,246,0.35)";
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <Mail size={16} /> charlesodii207@gmail.com
        </a>
      </div>

      {/* Final CTA */}
      <div style={{
        position: "relative", zIndex: 1,
        margin: "0 24px 100px",
        maxWidth: 900, marginLeft: "auto", marginRight: "auto",
        padding: "56px 40px",
        background: "linear-gradient(135deg, rgba(212,175,55,0.1), rgba(59,130,246,0.1))",
        border: "1px solid rgba(212,175,55,0.25)",
        borderRadius: 28,
        textAlign: "center",
      }}>
        <h2 style={{ fontSize: "clamp(24px, 3.5vw, 34px)", fontWeight: 800, margin: "0 0 14px" }}>
          Ready to get more done?
        </h2>
        <p style={{ color: "#8B9CC4", fontSize: 15, marginBottom: 28 }}>
          Create your free account and switch into the mode you need in seconds.
        </p>
        <a href="/register" style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "15px 30px",
          background: "linear-gradient(135deg, #D4AF37, #F4D46B)",
          color: "#080C14", fontWeight: 700, fontSize: 15,
          borderRadius: 14, textDecoration: "none",
          boxShadow: "0 8px 30px rgba(212,175,55,0.35)",
          transition: "all 0.25s ease",
        }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "0 10px 42px rgba(212,175,55,0.55)";
            e.currentTarget.style.transform = "translateY(-3px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "0 8px 30px rgba(212,175,55,0.35)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          Get Started Free <ArrowRight size={16} />
        </a>
      </div>

      {/* Footer */}
      <div style={{
        position: "relative", zIndex: 1,
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "28px 40px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 12,
      }}>
        <img src="/logolevi.png" alt="Levi" style={{ height: 22, width: "auto", opacity: 0.7 }} />
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {NAV_LINKS.map((link) => (
            <button
              key={link.href}
              onClick={() => scrollToId(link.href)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#3D4F72", fontSize: 12.5,
                transition: "color 0.2s ease, text-shadow 0.2s ease",
                textShadow: "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#60A5FA";
                e.currentTarget.style.textShadow = "0 0 10px rgba(59,130,246,0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#3D4F72";
                e.currentTarget.style.textShadow = "none";
              }}
            >
              {link.label}
            </button>
          ))}
        </div>
        <span style={{ color: "#3D4F72", fontSize: 13 }}>
          © {new Date().getFullYear()} Levi AI. Built by Charles Odii Okechukwu.
        </span>
      </div>
    </div>
  );
}
