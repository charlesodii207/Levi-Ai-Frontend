"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { verifyEmail, resendOtp } from "@/app/lib/api";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verified, setVerified] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  function handleOtpChange(index: number, value: string) {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // only take last digit
    setOtp(newOtp);
    setError("");

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits filled
    if (value && index === 5 && newOtp.every((d) => d !== "")) {
      handleVerify(newOtp.join(""));
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const newOtp = [...otp];
    pasted.split("").forEach((digit, i) => { if (i < 6) newOtp[i] = digit; });
    setOtp(newOtp);
    // Focus last filled or next empty
    const nextEmpty = newOtp.findIndex((d) => !d);
    const focusIndex = nextEmpty === -1 ? 5 : nextEmpty;
    inputRefs.current[focusIndex]?.focus();
    // Auto-submit if complete
    if (pasted.length === 6) handleVerify(pasted);
  }

  async function handleVerify(code?: string) {
    const otpCode = code || otp.join("");
    if (otpCode.length !== 6) { setError("Please enter the full 6-digit code."); return; }
    setLoading(true);
    setError("");
    try {
      await verifyEmail({ email, otp: otpCode });
      setVerified(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch (err: any) {
      setError(err.message || "Invalid OTP. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setResending(true);
    setResendSuccess(false);
    setError("");
    try {
      await resendOtp({ email });
      setResendSuccess(true);
      setResendCooldown(60);
      setTimeout(() => setResendSuccess(false), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to resend OTP.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div style={{
      width: "100vw", height: "100vh",
      background: "#080C14",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "Inter, sans-serif",
    }}>
      {/* Background glow */}
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
          padding: "48px 40px",
          background: "#0D1420",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 24,
          boxShadow: "0 0 60px rgba(0,87,255,0.08)",
          textAlign: "center",
        }}
      >
        {verified ? (
          // Success state
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
              Email Verified!
            </h2>
            <p style={{ color: "#3D4F72", fontSize: 14 }}>
              Your account is ready. Redirecting to login...
            </p>
          </motion.div>
        ) : (
          <>
            {/* Logo */}
            <div style={{ marginBottom: 32 }}>
              <div style={{
                fontSize: 32, fontWeight: 900, letterSpacing: 6,
                background: "linear-gradient(135deg, #D4AF37, #F4D46B 40%, #3B82F6)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                backgroundClip: "text", marginBottom: 16,
              }}>LEVI</div>

              {/* Email icon */}
              <div style={{
                width: 60, height: 60, borderRadius: "50%",
                background: "rgba(0,87,255,0.1)",
                border: "1px solid rgba(59,130,246,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 16px", fontSize: 26,
              }}>
                📧
              </div>

              <h2 style={{ color: "#F0F4FF", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
                Check your email
              </h2>
              <p style={{ color: "#3D4F72", fontSize: 13, lineHeight: 1.6 }}>
                We sent a 6-digit verification code to
                <br />
                <span style={{ color: "#8B9CC4", fontWeight: 600 }}>{email || "your email"}</span>
              </p>
            </div>

            {/* OTP inputs */}
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 24 }}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  style={{
                    width: 48, height: 56,
                    background: digit ? "rgba(0,87,255,0.1)" : "rgba(6,10,16,0.8)",
                    border: `2px solid ${digit ? "rgba(59,130,246,0.4)" : "rgba(255,255,255,0.08)"}`,
                    borderRadius: 12,
                    color: "#F0F4FF",
                    fontSize: 22, fontWeight: 700,
                    textAlign: "center",
                    outline: "none",
                    transition: "all 0.15s",
                    fontFamily: "Inter, sans-serif",
                    cursor: "text",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "rgba(59,130,246,0.6)";
                    e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = digit ? "rgba(59,130,246,0.4)" : "rgba(255,255,255,0.08)";
                    e.target.style.boxShadow = "none";
                  }}
                />
              ))}
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                style={{
                  padding: "10px 14px", background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10,
                  color: "#EF4444", fontSize: 13, marginBottom: 16,
                }}>
                {error}
              </motion.div>
            )}

            {resendSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                style={{
                  padding: "10px 14px", background: "rgba(34,197,94,0.08)",
                  border: "1px solid rgba(34,197,94,0.2)", borderRadius: 10,
                  color: "#22C55E", fontSize: 13, marginBottom: 16,
                }}>
                ✓ New OTP sent to your email
              </motion.div>
            )}

            {/* Verify button */}
            <button
              onClick={() => handleVerify()}
              disabled={loading || otp.some((d) => !d)}
              style={{
                width: "100%", padding: "14px",
                background: otp.every((d) => d) && !loading
                  ? "linear-gradient(135deg, #0057FF, #3B82F6)"
                  : "rgba(255,255,255,0.04)",
                border: "none", borderRadius: 12,
                color: otp.every((d) => d) && !loading ? "white" : "#3D4F72",
                fontSize: 15, fontWeight: 700,
                cursor: otp.every((d) => d) && !loading ? "pointer" : "not-allowed",
                marginBottom: 16,
                boxShadow: otp.every((d) => d) ? "0 4px 20px rgba(0,87,255,0.25)" : "none",
                transition: "all 0.2s",
              }}
            >
              {loading ? "Verifying..." : "Verify Email"}
            </button>

            {/* Resend */}
            <p style={{ color: "#3D4F72", fontSize: 13 }}>
              Didn't receive the code?{" "}
              <button
                onClick={handleResend}
                disabled={resending || resendCooldown > 0}
                style={{
                  background: "none", border: "none",
                  color: resendCooldown > 0 ? "#3D4F72" : "#3B82F6",
                  fontWeight: 600, fontSize: 13, cursor: resendCooldown > 0 ? "not-allowed" : "pointer",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                {resending ? "Sending..." : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
              </button>
            </p>

            <p style={{ color: "#3D4F72", fontSize: 12, marginTop: 20 }}>
              Wrong email?{" "}
              <a href="/register" style={{ color: "#D4AF37", fontWeight: 600 }}>Go back</a>
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
