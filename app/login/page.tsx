"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { login } from "@/app/lib/api";
import { saveToken } from "@/app/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    setError("");
    try {
      const res = await login({ email, password });
      saveToken(res.access_token);
      router.push("/app");
    } catch (err: any) {
      setError(err.message || "Login failed");
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
      {/* Background glow */}
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
            Sign in to your account
          </p>
        </div>

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
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
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

          <div>
            <label style={{ color: "#9CA3AF", fontSize: 13, marginBottom: 6, display: "block" }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
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
            onClick={handleLogin}
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
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </div>

        {/* Footer */}
        <p style={{ textAlign: "center", marginTop: 28, color: "#6B7280", fontSize: 14 }}>
          Don&apos;t have an account?{" "}
          <a href="/register" style={{ color: "#D4AF37", fontWeight: 600 }}>
            Create one
          </a>
        </p>
      </motion.div>
    </div>
  );
}
