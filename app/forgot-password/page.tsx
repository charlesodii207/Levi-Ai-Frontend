"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { forgotPassword } from "@/app/lib/api";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email) return;
    setLoading(true);
    setError("");
    try {
      await forgotPassword({ email });
      router.push(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      width: "100vw",
      height: "100vh",
      background: "#050608",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "Inter, sans-serif",
    }}>
      <div style={{
        position: "fixed",
        top: "30%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 600,
        height: 600,
        background: "radial-gradient(circle, rgba(0,87,255,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          width: "100%",
          maxWidth: 440,
          padding: "48px 40px",
          background: "#0D1117",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 24,
          boxShadow: "0 0 60px rgba(0,87,255,0.1)",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <span style={{
            fontSize: 42,
            fontWeight: 800,
            letterSpacing: 8,
            color: "#D4AF37",
            textShadow: "0 0 20px rgba(212,175,55,0.4)",
          }}>LEVI</span>
          <p style={{ color: "#6B7280", marginTop: 8, fontSize: 14 }}>
            Reset your password
          </p>
        </div>

        <p style={{ color: "#8B9CC4", fontSize: 13.5, marginBottom: 24, lineHeight: 1.6, textAlign: "center" }}>
          Enter the email on your account. We'll send a 6-digit code you can use
          to set a new password.
        </p>

        {/* Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ color: "#9CA3AF", fontSize: 13, marginBottom: 6, display: "block" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              style={{
                width: "100%",
                background: "#10141D",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                padding: "14px 16px",
                color: "white",
                fontSize: 15,
                outline: "none",
              }}
            />
          </div>

          {error && (
            <p style={{ color: "#EF4444", fontSize: 13, textAlign: "center" }}>
              {error}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              background: loading ? "#1a1f2e" : "linear-gradient(135deg, #0057ff, #3b82f6)",
              color: "white",
              border: "none",
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              marginTop: 8,
              transition: "opacity 0.2s",
            }}
          >
            {loading ? "Sending code..." : "Send Reset Code"}
          </button>
        </div>

        {/* Footer */}
        <p style={{ textAlign: "center", marginTop: 28, color: "#6B7280", fontSize: 14 }}>
          Remembered your password?{" "}
          <a href="/login" style={{ color: "#D4AF37", fontWeight: 600 }}>
            Sign in
          </a>
        </p>
      </motion.div>
    </div>
  );
}
