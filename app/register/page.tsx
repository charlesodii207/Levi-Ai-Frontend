"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { register } from "@/app/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!username || !email || !password) return;
    setLoading(true);
    setError("");
    try {
      await register({ username, email, password });
      // Redirect to verify-email page with email as query param
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      width: "100vw", height: "100vh",
      background: "#080C14",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "Inter, sans-serif",
    }}>
      <div style={{
        position: "fixed", top: "30%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: 600, height: 600,
        background: "radial-gradient(circle, rgba(212,175,55,0.07) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          width: "100%", maxWidth: 440,
          padding: "48px 40px",
          background: "#0D1420",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 24,
          boxShadow: "0 0 60px rgba(212,175,55,0.07)",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            fontSize: 38, fontWeight: 900, letterSpacing: 8,
            background: "linear-gradient(135deg, #D4AF37, #F4D46B 40%, #3B82F6)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>LEVI</div>
          <p style={{ color: "#3D4F72", marginTop: 8, fontSize: 14 }}>Create your account</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            { label: "Username", type: "text", value: username, onChange: setUsername, placeholder: "yourname" },
            { label: "Email", type: "email", value: email, onChange: setEmail, placeholder: "you@example.com" },
            { label: "Password", type: "password", value: password, onChange: setPassword, placeholder: "••••••••" },
          ].map((f) => (
            <div key={f.label}>
              <label style={{ color: "#8B9CC4", fontSize: 12, marginBottom: 7, display: "block", fontWeight: 500 }}>
                {f.label}
              </label>
              <input
                type={f.type}
                value={f.value}
                onChange={(e) => f.onChange(e.target.value)}
                placeholder={f.placeholder}
                onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                style={{
                  width: "100%", background: "rgba(6,10,16,0.8)",
                  border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12,
                  padding: "13px 16px", color: "white", fontSize: 14,
                  outline: "none", fontFamily: "Inter, sans-serif",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => e.target.style.borderColor = "rgba(212,175,55,0.3)"}
                onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
              />
            </div>
          ))}

          {error && (
            <div style={{
              padding: "10px 14px", background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10,
              color: "#EF4444", fontSize: 13, textAlign: "center",
            }}>
              {error}
            </div>
          )}

          <button
            onClick={handleRegister}
            disabled={loading}
            style={{
              width: "100%", padding: "14px",
              background: loading ? "rgba(255,255,255,0.04)" : "linear-gradient(135deg, #D4AF37, #F4D46B)",
              color: loading ? "#3D4F72" : "black",
              border: "none", borderRadius: 12,
              fontSize: 15, fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              marginTop: 4,
              boxShadow: loading ? "none" : "0 4px 20px rgba(212,175,55,0.25)",
              transition: "all 0.2s",
            }}
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </div>

        <p style={{ textAlign: "center", marginTop: 28, color: "#3D4F72", fontSize: 14 }}>
          Already have an account?{" "}
          <a href="/login" style={{ color: "#D4AF37", fontWeight: 600 }}>Sign in</a>
        </p>
      </motion.div>
    </div>
  );
}
