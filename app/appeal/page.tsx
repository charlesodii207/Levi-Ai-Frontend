"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { submitAppeal } from "@/app/lib/appealsApi";

function AppealForm() {
  const searchParams = useSearchParams();
  const prefillEmail = searchParams.get("email") || "";

  const [email, setEmail] = useState(prefillEmail);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email || !message.trim()) {
      setError("Please fill in both fields.");
      return;
    }

    setLoading(true);
    try {
      await submitAppeal(email, message.trim());
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Failed to submit appeal. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      width: "100vw", height: "100vh", background: "#050608",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "Inter, sans-serif",
    }}>
      <div style={{
        position: "fixed", top: "30%", left: "50%", transform: "translate(-50%, -50%)",
        width: 600, height: 600,
        background: "radial-gradient(circle, rgba(0,87,255,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        style={{
          width: "100%", maxWidth: 440,
          padding: "clamp(32px, 6vw, 48px) clamp(24px, 6vw, 40px)",
          background: "#0D1117", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 24, boxShadow: "0 0 60px rgba(0,87,255,0.1)",
          margin: 16, boxSizing: "border-box",
        }}
      >
        {submitted ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: "center" }}>
            <div style={{
              width: 60, height: 60, borderRadius: 16,
              background: "rgba(34,197,94,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" /><path d="M8.5 12.5l2.5 2.5 5-5.5" />
              </svg>
            </div>
            <h2 style={{ color: "#F0F4FF", fontSize: 20, fontWeight: 700, marginBottom: 10 }}>Appeal submitted</h2>
            <p style={{ color: "#9CA3AF", fontSize: 14, lineHeight: 1.6 }}>
              If your account is eligible, our team will review your appeal and reach a decision as soon as possible. You don't need to submit another one.
            </p>
          </motion.div>
        ) : (
          <>
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <span style={{
                fontSize: 36, fontWeight: 800, letterSpacing: 7,
                color: "#D4AF37", textShadow: "0 0 20px rgba(212,175,55,0.4)",
              }}>LEVI</span>
              <h2 style={{ color: "#F0F4FF", fontSize: 18, fontWeight: 700, marginTop: 14, marginBottom: 8 }}>
                Appeal your suspension
              </h2>
              <p style={{ color: "#6B7280", fontSize: 13.5, lineHeight: 1.6 }}>
                Tell us why your account should be reinstated. Our team will review it.
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={labelStyle}>Email</label>
                <input
                  type="email" value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="you@example.com"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Why should your account be reinstated?</label>
                <textarea
                  value={message}
                  onChange={(e) => { setMessage(e.target.value); setError(""); }}
                  placeholder="Explain what happened and why you believe this was a mistake, or how you'd like to make it right..."
                  rows={5}
                  style={{ ...inputStyle, resize: "vertical", fontFamily: "Inter, sans-serif", lineHeight: 1.5 }}
                />
              </div>

              {error && (
                <p style={{ color: "#EF4444", fontSize: 13, textAlign: "center", margin: 0 }}>{error}</p>
              )}

              <button
                type="submit" disabled={loading}
                style={{
                  width: "100%", padding: "14px",
                  background: loading ? "#1a1f2e" : "linear-gradient(135deg, #0057ff, #3b82f6)",
                  color: "white", border: "none", borderRadius: 12,
                  fontSize: 15.5, fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  marginTop: 4,
                }}
              >
                {loading ? "Submitting..." : "Submit Appeal"}
              </button>
            </form>

            <p style={{ textAlign: "center", marginTop: 24, color: "#6B7280", fontSize: 13.5 }}>
              <a href="/login" style={{ color: "#3B82F6", fontWeight: 600, textDecoration: "none" }}>← Back to login</a>
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default function AppealPage() {
  return (
    <Suspense fallback={null}>
      <AppealForm />
    </Suspense>
  );
}

const labelStyle: React.CSSProperties = { color: "#9CA3AF", fontSize: 13, marginBottom: 6, display: "block" };

const inputStyle: React.CSSProperties = {
  width: "100%", background: "#10141D",
  border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12,
  padding: "14px 16px", color: "white", fontSize: 15, outline: "none",
  boxSizing: "border-box",
};
