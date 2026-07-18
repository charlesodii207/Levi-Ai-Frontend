"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { adminLogin, setAdminToken } from "@/app/lib/adminApi";
import { IconLock } from "@/app/components/Icons";

export default function AdminLoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Please enter both username and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await adminLogin(username, password);
      setAdminToken(res.access_token);
      router.push(res.must_change_password ? "/admin/change-password" : "/admin");
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      width: "100vw", height: "100vh", background: "#080C14",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "Inter, sans-serif",
    }}>
      <div style={{
        position: "fixed", top: "30%", left: "50%", transform: "translate(-50%, -50%)",
        width: 500, height: 500,
        background: "radial-gradient(circle, rgba(0,87,255,0.08) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        style={{
          width: "100%", maxWidth: 420,
          padding: "clamp(28px, 6vw, 48px) clamp(20px, 6vw, 40px)",
          background: "#0D1420", border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 24, boxShadow: "0 0 60px rgba(0,87,255,0.08)",
          textAlign: "center", margin: "16px", boxSizing: "border-box",
        }}
      >
        <div style={{ marginBottom: 32 }}>
          <div style={{
            fontSize: 32, fontWeight: 900, letterSpacing: 6,
            background: "linear-gradient(135deg, #D4AF37, #F4D46B 40%, #3B82F6)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            backgroundClip: "text", marginBottom: 16,
          }}>LEVI</div>

          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: "linear-gradient(135deg, rgba(59,130,246,0.18), rgba(0,87,255,0.06))",
            border: "1px solid rgba(59,130,246,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 18px",
          }}>
            <IconLock size={22} color="#3B82F6" />
          </div>

          <h2 style={{ color: "#F0F4FF", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Admin Sign In</h2>
          <p style={{ color: "#5A6B8C", fontSize: 13, lineHeight: 1.6 }}>
            Staff access only. If you don't have admin
            <br />credentials, this isn't the page you're looking for.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16, textAlign: "left" }}>
            <label style={labelStyle}>Username</label>
            <input
              type="text" value={username}
              onChange={(e) => { setUsername(e.target.value); setError(""); }}
              autoCapitalize="none" autoCorrect="off"
              style={inputStyle}
              onFocus={focusStyle} onBlur={blurStyle}
            />
          </div>

          <div style={{ marginBottom: 20, textAlign: "left" }}>
            <label style={labelStyle}>Password</label>
            <input
              type="password" value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              style={inputStyle}
              onFocus={focusStyle} onBlur={blurStyle}
            />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              style={{
                padding: "10px 14px", background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10,
                color: "#EF4444", fontSize: 13, marginBottom: 16, textAlign: "left",
              }}>
              {error}
            </motion.div>
          )}

          <button
            type="submit" disabled={loading}
            style={{
              width: "100%", padding: "14px",
              background: loading ? "rgba(255,255,255,0.04)" : "linear-gradient(135deg, #0057FF, #3B82F6)",
              border: "none", borderRadius: 12,
              color: loading ? "#3D4F72" : "white",
              fontSize: 15, fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : "0 4px 20px rgba(0,87,255,0.25)",
              transition: "all 0.2s",
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { color: "#8B9CC4", fontSize: 12, fontWeight: 600, marginBottom: 6, display: "block" };

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "12px 14px",
  background: "rgba(6,10,16,0.8)", border: "2px solid rgba(255,255,255,0.08)",
  borderRadius: 10, color: "#F0F4FF", fontSize: 14, outline: "none",
  fontFamily: "Inter, sans-serif", boxSizing: "border-box",
};

function focusStyle(e: React.FocusEvent<HTMLInputElement>) {
  e.target.style.borderColor = "rgba(59,130,246,0.6)";
  e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)";
}
function blurStyle(e: React.FocusEvent<HTMLInputElement>) {
  e.target.style.borderColor = "rgba(255,255,255,0.08)";
  e.target.style.boxShadow = "none";
}
