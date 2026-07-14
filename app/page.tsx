"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import { LEVI_MODES } from "./components/Sidebar";
import { isLoggedIn } from "./lib/auth";

const PRICING_TIERS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Try Levi across every mode, no card required.",
    features: [
      "Access to all 5 modes",
      "Limited messages per day",
      "Standard response speed",
      "Conversation history",
    ],
    highlighted: false,
    cta: "Get Started",
  },
  {
    name: "Pro",
    price: "$19",
    period: "/ month",
    description: "For people who use Levi daily and want more headroom.",
    features: [
      "Everything in Free",
      "Unlimited messages",
      "Priority response speed",
      "Full Code, Crypto, Research workspaces",
      "Download & export results",
    ],
    highlighted: true,
    cta: "Start Free Trial",
  },
  {
    name: "Team",
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
    cta: "Contact Us",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    if (isLoggedIn()) {
      router.replace("/app");
    } else {
      setCheckingAuth(false);
    }
  }, [router]);

  // Avoid flashing marketing content at logged-in users mid-redirect
  if (checkingAuth) {
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
    }}>
      {/* Ambient background — brighter, more luminous than the app UI */}
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
        position: "sticky", top: 0, zIndex: 10,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "20px 40px",
        background: "rgba(8,12,20,0.7)",
        backdropFilter: "blur(14px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <img src="/logo.png" alt="Levi" style={{ height: 30, width: "auto" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href="/login" style={{
            color: "#C8D4F0", fontSize: 14, fontWeight: 600,
            textDecoration: "none", padding: "9px 16px",
          }}>
            Sign In
          </a>
          <a href="/register" style={{
            color: "#080C14", fontSize: 14, fontWeight: 700,
            textDecoration: "none", padding: "9px 20px",
            background: "linear-gradient(135deg, #D4AF37, #F4D46B)",
            borderRadius: 10,
            boxShadow: "0 4px 20px rgba(212,175,55,0.3)",
          }}>
            Get Started
          </a>
        </div>
      </div>

      {/* Hero */}
      <div style={{
        position: "relative", zIndex: 1,
        display: "flex", flexDirection: "column", alignItems: "center",
        textAlign: "center", padding: "100px 24px 90px",
      }}>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "6px 16px", marginBottom: 28,
            background: "rgba(212,175,55,0.1)",
            border: "1px solid rgba(212,175,55,0.3)",
            borderRadius: 20,
            color: "#F4D46B", fontSize: 13, fontWeight: 600,
          }}
        >
          ✨ One assistant, five specialties
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            fontSize: "clamp(38px, 6vw, 68px)",
            fontWeight: 900,
            lineHeight: 1.08,
            maxWidth: 880,
            margin: 0,
            letterSpacing: -1,
          }}
        >
          The AI assistant that's{" "}
          <span style={{
            background: "linear-gradient(135deg, #D4AF37 0%, #F4D46B 40%, #3B82F6 75%, #0057FF 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
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
            color: "#8B9CC4", fontSize: 18, maxWidth: 620,
            marginTop: 22, lineHeight: 1.6,
          }}
        >
          Levi switches into a dedicated workspace for coding, trading, business,
          writing, or research — instead of one generic chat trying to do everything.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ display: "flex", gap: 14, marginTop: 36, flexWrap: "wrap", justifyContent: "center" }}
        >
          <a href="/register" style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "15px 28px",
            background: "linear-gradient(135deg, #D4AF37, #F4D46B)",
            color: "#080C14", fontWeight: 700, fontSize: 15,
            borderRadius: 14, textDecoration: "none",
            boxShadow: "0 8px 30px rgba(212,175,55,0.35)",
          }}>
            Get Started Free <ArrowRight size={16} />
          </a>
          <a href="/login" style={{
            padding: "15px 28px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "white", fontWeight: 600, fontSize: 15,
            borderRadius: 14, textDecoration: "none",
          }}>
            Sign In
          </a>
        </motion.div>
      </div>

      {/* Features */}
      <div style={{ position: "relative", zIndex: 1, padding: "20px 24px 100px", maxWidth: 1180, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <p style={{ color: "#F4D46B", fontSize: 13, fontWeight: 700, letterSpacing: 1.5, marginBottom: 10 }}>
            FIVE DEDICATED MODES
          </p>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, margin: 0 }}>
            Not one chat box. Five real tools.
          </h2>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
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
                padding: "28px 22px",
                background: `${mode.color}0A`,
                border: `1px solid ${mode.color}30`,
                borderRadius: 18,
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
              <div style={{ color: "white", fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
                {mode.label}
              </div>
              <div style={{ color: "#8B9CC4", fontSize: 13.5, lineHeight: 1.6 }}>
                {FEATURE_BLURBS[mode.id]}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div style={{ position: "relative", zIndex: 1, padding: "20px 24px 110px", maxWidth: 1080, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <p style={{ color: "#F4D46B", fontSize: 13, fontWeight: 700, letterSpacing: 1.5, marginBottom: 10 }}>
            SIMPLE PRICING
          </p>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, margin: "0 0 12px" }}>
            Start free. Upgrade when you need to.
          </h2>
          <p style={{ color: "#8B9CC4", fontSize: 15 }}>No hidden fees. Cancel anytime.</p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 20,
          alignItems: "start",
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
                  MOST POPULAR
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

              <a
                href="/register"
                style={{
                  display: "block", textAlign: "center",
                  padding: "13px", borderRadius: 12,
                  textDecoration: "none", fontSize: 14, fontWeight: 700,
                  background: tier.highlighted
                    ? "linear-gradient(135deg, #D4AF37, #F4D46B)"
                    : "rgba(255,255,255,0.06)",
                  color: tier.highlighted ? "#080C14" : "white",
                  border: tier.highlighted ? "none" : "1px solid rgba(255,255,255,0.12)",
                }}
              >
                {tier.cta}
              </a>
            </div>
          ))}
        </div>
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
        }}>
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
        <img src="/logo.png" alt="Levi" style={{ height: 22, width: "auto", opacity: 0.7 }} />
        <span style={{ color: "#3D4F72", fontSize: 13 }}>
          © {new Date().getFullYear()} Levi AI. Built by Charles Odii Okechukwu.
        </span>
      </div>
    </div>
  );
}

const FEATURE_BLURBS: Record<string, string> = {
  coding: "Paste code or describe what to build. Explain, debug, optimize, convert, or generate from scratch — with automatic language detection.",
  crypto: "Live market data, AI trend analysis, entry/stop-loss/take-profit levels, and multi-timeframe confluence for any pair.",
  business: "Business plans, SWOT analysis, financial projections, competitor research, and pitch decks — structured, not just chat.",
  writing: "Creative writing, copywriting, blog posts, editing, and social content — organized by what you're actually trying to write.",
  research: "Deep dives, side-by-side comparisons, and fact-checking with accuracy assessments — with copy and download built in.",
};
