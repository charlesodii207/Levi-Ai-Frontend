"use client";

import { useState } from "react";
import { adminChangePassword } from "@/app/lib/adminApi";
import { IconLock, IconCheckCircle } from "@/app/components/Icons";

type Section = "password";

export default function AdminSettingsPage() {
  const [activeSection, setActiveSection] = useState<Section>("password");

  const sections: { key: Section; label: string; Icon: any }[] = [
    { key: "password", label: "Password", Icon: IconLock },
    // Future sections slot in here: Notifications, Sessions, 2FA, etc.
  ];

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <h1 style={{ color: "#F0F4FF", fontSize: "clamp(20px, 4vw, 27px)", fontWeight: 800, marginBottom: 5, letterSpacing: -0.3 }}>
        Settings
      </h1>
      <p style={{ color: "#5A6B8C", fontSize: 14, marginBottom: 28 }}>
        Manage your personal account preferences.
      </p>

      <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
        {/* Sub-nav */}
        <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 180, flex: "0 0 auto" }}>
          {sections.map((s) => {
            const active = activeSection === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setActiveSection(s.key)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px", borderRadius: 10,
                  background: active ? "rgba(59,130,246,0.14)" : "transparent",
                  border: "none",
                  color: active ? "#F0F4FF" : "#7C8BAD",
                  fontSize: 13.5, fontWeight: active ? 700 : 500,
                  cursor: "pointer", textAlign: "left",
                  fontFamily: "Inter, sans-serif",
                  transition: "all 0.15s ease",
                }}
              >
                <s.Icon size={16} color={active ? "#3B82F6" : "currentColor"} />
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div style={{ flex: "1 1 380px", maxWidth: 460 }}>
          {activeSection === "password" && <PasswordSection />}
        </div>
      </div>
    </div>
  );
}

function PasswordSection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!currentPassword || !newPassword || !confirmPassword) { setError("Please fill in all fields."); return; }
    if (newPassword.length < 8) { setError("New password must be at least 8 characters."); return; }
    if (newPassword !== confirmPassword) { setError("New passwords don't match."); return; }
    if (newPassword === currentPassword) { setError("New password must be different from your current password."); return; }

    setLoading(true);
    try {
      await adminChangePassword(currentPassword, newPassword);
      setSuccess(true);
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (err: any) {
      setError(err.message || "Failed to change password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ background: "#0D1420", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <IconLock size={17} color="#3B82F6" />
        <h2 style={{ color: "#F0F4FF", fontSize: 16, fontWeight: 700 }}>Change Password</h2>
      </div>
      <p style={{ color: "#5A6B8C", fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
        Choose a strong password you're not using anywhere else.
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Current password</label>
          <input type="password" value={currentPassword} onChange={(e) => { setCurrentPassword(e.target.value); setError(""); }} style={inputStyle} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>New password</label>
          <input type="password" value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setError(""); }} style={inputStyle} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Confirm new password</label>
          <input type="password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }} style={inputStyle} />
        </div>

        {error && (
          <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, color: "#EF4444", fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 10, color: "#22C55E", fontSize: 13, marginBottom: 16 }}>
            <IconCheckCircle size={15} /> Password updated successfully.
          </div>
        )}

        <button
          type="submit" disabled={loading}
          style={{
            padding: "11px 20px",
            background: loading ? "rgba(255,255,255,0.04)" : "linear-gradient(135deg, #0057FF, #3B82F6)",
            border: "none", borderRadius: 10,
            color: loading ? "#3D4F72" : "white",
            fontSize: 13.5, fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            fontFamily: "Inter, sans-serif",
          }}
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );
}

const labelStyle: React.CSSProperties = { color: "#8B9CC4", fontSize: 12, fontWeight: 600, marginBottom: 6, display: "block" };

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px",
  background: "rgba(6,10,16,0.8)", border: "2px solid rgba(255,255,255,0.08)",
  borderRadius: 8, color: "#F0F4FF", fontSize: 13.5, outline: "none",
  fontFamily: "Inter, sans-serif", boxSizing: "border-box",
};
