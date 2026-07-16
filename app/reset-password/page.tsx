"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { resetPassword, forgotPassword } from "@/app/lib/api";
import { saveToken } from "@/app/lib/auth";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  const handleSubmit = async () => {
    setError("");

    if (!otp.trim() || otp.trim().length !== 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword({
        email,
        otp: otp.trim(),
        new_password: newPassword,
      });
      saveToken(res.access_token);
      router.push("/app");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    setResendMessage("");
    setError("");
    try {
      await forgotPassword({ email });
      setResendMessage("A new code has been sent.");
    } catch (err: any) {
      setError(err.message || "Couldn't resend the code.");
    } finally {
      setResending(false);
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
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <span style={{
            fontSize: 42,
            fontWeight: 800,
            letterSpacing: 8,
            color: "#D4AF37",
            textShadow: "0 0 20px rgba(212,175,55,0.4)",
          }}>LEVI</span>
          <p style={{ color: "#6B7280", marginTop: 8, fontSize: 14 }}>
            Enter your reset code
          </p>
        </div>

        <p style={{ color: "#8B9CC4", fontSize: 13.5, marginBottom: 24, lineHeight: 1.6, textAlign: "center" }}>
          We sent a 6-digit code to <strong style={{ color: "#C8D4F0" }}>{email || "your email"}</strong>.
          It expires in 10 minutes.
        </p>

        {/* Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ color: "#9CA3AF", fontSize: 13, marginBottom: 6, display: "block" }}>
              6-digit code
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              style={{
                width: "100%",
                background: "#10141D",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                padding: "14px 16px",
                color: "white",
                fontSize: 20,
                letterSpacing: 8,
                textAlign: "center",
                outline: "none",
                fontFamily: "monospace",
              }}
            />
          </div>

          <div>
            <label style={{ color: "#9CA3AF", fontSize: 13, marginBottom: 6, display: "block" }}>
              New password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
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
              Confirm new password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
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
          {resendMessage && !error && (
            <p style={{ color: "#22C55E", fontSize: 13, textAlign: "center" }}>
              {resendMessage}
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
              marginTop: 4,
              transition: "opacity 0.2s",
            }}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </div>

        {/* Footer */}
        <p style={{ textAlign: "center", marginTop: 24, color: "#6B7280", fontSize: 13.5 }}>
          Didn't get a code?{" "}
          <button
            onClick={handleResend}
            disabled={resending}
            style={{
              background: "none", border: "none", padding: 0,
              color: "#D4AF37", fontWeight: 600, fontSize: 13.5,
              cursor: resending ? "not-allowed" : "pointer",
            }}
          >
            {resending ? "Sending..." : "Resend"}
          </button>
        </p>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
