"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { adminChangePassword, getAdminToken } from "@/app/lib/adminApi";

export default function AdminChangePasswordPage() {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!getAdminToken()) {
      router.push("/admin/login");
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords don't match.");
      return;
    }

    if (newPassword === currentPassword) {
      setError("New password must be different from your current password.");
      return;
    }

    setLoading(true);
    try {
      await adminChangePassword(currentPassword, newPassword);
      setSuccess(true);
      setTimeout(() => router.push("/admin"), 2000);
    } catch (err: any) {
      setError(err.message || "Failed to change password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

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
        width: 500, height: 500,
        background: "radial-gradient(circle, rgba(0,87,255,0.08) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          width: "100%", maxWidth: 420,
          padding: "clamp(28px, 6vw, 48px) clamp(20px, 6vw, 40px)",
          background: "#0D1420",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 24,
          boxShadow: "0 0 60px rgba(0,87,255,0.08)",
          textAlign: "center",
          margin: "16px",
          boxSizing: "border-box",
        }}
      >
        {success ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: "rgba(34,197,94,0.12)",
              border: "1px solid rgba(34,197,94,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px", fontSize: 32,
            }}>
              ✓
            </div>
            <h2 style={{ color: "#22C55E", fontSize: 22, fontWeight: 800, marginBottom: 10 }}>
              Password Updated
            </h2>
            <p style={{ color: "#3D4F72", fontSize: 14 }}>
              Taking you to the dashboard...
            </p>
          </motion.div>
        ) : (
          <>
            <div style={{ marginBottom: 32 }}>
              <div style={{
                fontSize: 32, fontWeight: 900, letterSpacing: 6,
                background: "linear-gradient(135deg, #D4AF37, #F4D46B 40%, #3B82F6)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                backgroundClip: "text", marginBottom: 16,
              }}>LEVI</div>

              <div style={{
                width: 60, height: 60, borderRadius: "50%",
                background: "rgba(212,175,55,0.1)",
                border: "1px solid rgba(212,175,55,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 16px", fontSize: 26,
              }}>
                🔑
              </div>

              <h2 style={{ color: "#F0F4FF", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
                Set a new password
              </h2>
              <p style={{ color: "#3D4F72", fontSize: 13, lineHeight: 1.6 }}>
                For security, you need to change your
                <br />
                temporary password before continuing.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 14, textAlign: "left" }}>
                <label style={{ color: "#8B9CC4", fontSize: 12, fontWeight: 600, marginBottom: 6, display: "block" }}>
                  Current (temporary) password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => { setCurrentPassword(e.target.value); setError(""); }}
                  style={inputStyle}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                />
              </div>

              <div style={{ marginBottom: 14, textAlign: "left" }}>
                <label style={{ color: "#8B9CC4", fontSize: 12, fontWeight: 600, marginBottom: 6, display: "block" }}>
                  New password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                  style={inputStyle}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                />
              </div>

              <div style={{ marginBottom: 20, textAlign: "left" }}>
                <label style={{ color: "#8B9CC4", fontSize: 12, fontWeight: 600, marginBottom: 6, display: "block" }}>
                  Confirm new password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                  style={inputStyle}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  style={{
                    padding: "10px 14px", background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10,
                    color: "#EF4444", fontSize: 13, marginBottom: 16,
                    textAlign: "left",
                  }}>
                  {error}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%", padding: "14px",
                  background: loading
                    ? "rgba(255,255,255,0.04)"
                    : "linear-gradient(135deg, #0057FF, #3B82F6)",
                  border: "none", borderRadius: 12,
                  color: loading ? "#3D4F72" : "white",
                  fontSize: 15, fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: loading ? "none" : "0 4px 20px rgba(0,87,255,0.25)",
                  transition: "all 0.2s",
                }}
              >
                {loading ? "Updating..." : "Update Password"}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "12px 14px",
  background: "rgba(6,10,16,0.8)",
  border: "2px solid rgba(255,255,255,0.08)",
  borderRadius: 10,
  color: "#F0F4FF",
  fontSize: 14,
  outline: "none",
  fontFamily: "Inter, sans-serif",
  boxSizing: "border-box",
};

function focusStyle(e: React.FocusEvent<HTMLInputElement>) {
  e.target.style.borderColor = "rgba(59,130,246,0.6)";
  e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)";
}

function blurStyle(e: React.FocusEvent<HTMLInputElement>) {
  e.target.style.borderColor = "rgba(255,255,255,0.08)";
  e.target.style.boxShadow = "none";
}
