"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  User,
  Lock,
  Mail,
  Palette,
  Bot,
  Bell,
  Trash2,
  Check,
  Loader2,
} from "lucide-react";
import { isLoggedIn } from "@/app/lib/auth";
import {
  getSettings,
  updateProfile,
  changePassword,
  requestEmailChange,
  verifyEmailChange,
  deleteAccount,
  type UserSettings,
} from "@/app/lib/api";

// ── Shared style helpers (match ChatPage's visual language) ────────────────

const card: React.CSSProperties = {
  background: "rgba(13,20,32,0.8)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 16,
  padding: 24,
  backdropFilter: "blur(8px)",
};

const label: React.CSSProperties = {
  color: "#8B9CC4",
  fontSize: 13,
  fontWeight: 600,
  marginBottom: 8,
  display: "block",
};

const input: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  background: "rgba(8,12,20,0.8)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 10,
  color: "#F0F4FF",
  fontSize: 14,
  outline: "none",
};

const sectionTitle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  color: "#F0F4FF",
  fontSize: 16,
  fontWeight: 700,
  marginBottom: 18,
};

function PrimaryButton({
  children,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "10px 18px",
        borderRadius: 10,
        border: danger
          ? "1px solid rgba(239,68,68,0.3)"
          : "1px solid rgba(59,130,246,0.3)",
        background: danger ? "rgba(239,68,68,0.1)" : "rgba(0,87,255,0.12)",
        color: danger ? "#EF4444" : "#3B82F6",
        fontSize: 13,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      {children}
    </button>
  );
}

export default function SettingsPage() {
  const router = useRouter();

  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Profile form state
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [defaultModel, setDefaultModel] = useState("swift");
  const [theme, setTheme] = useState("dark");
  const [emailNotifications, setEmailNotifications] = useState(true);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Email change flow state
  const [newEmail, setNewEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [emailStep, setEmailStep] = useState<"idle" | "otp-sent">("idle");

  // Delete account state
  const [deletePassword, setDeletePassword] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    getSettings()
      .then((s) => {
        setSettings(s);
        setUsername(s.username);
        setBio(s.bio ?? "");
        setAvatarUrl(s.avatar_url ?? "");
        setDefaultModel(s.default_model);
        setTheme(s.theme);
        setEmailNotifications(s.email_notifications);
      })
      .catch(() => setError("Couldn't load your settings. Try refreshing."))
      .finally(() => setLoading(false));
  }, [router]);

  function flash(msg: string) {
    setStatus(msg);
    setTimeout(() => setStatus(null), 3000);
  }

  async function handleSaveProfile() {
    setSaving(true);
    setError(null);
    try {
      const updated = await updateProfile({
        username,
        bio,
        avatar_url: avatarUrl,
        default_model: defaultModel,
        theme,
        email_notifications: emailNotifications,
      });
      setSettings(updated);
      flash("Profile updated");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    setSaving(true);
    setError(null);
    try {
      await changePassword({ current_password: currentPassword, new_password: newPassword });
      setCurrentPassword("");
      setNewPassword("");
      flash("Password changed");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to change password");
    } finally {
      setSaving(false);
    }
  }

  async function handleRequestEmailChange() {
    setSaving(true);
    setError(null);
    try {
      await requestEmailChange({ new_email: newEmail });
      setEmailStep("otp-sent");
      flash("Verification code sent");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to request email change");
    } finally {
      setSaving(false);
    }
  }

  async function handleVerifyEmailChange() {
    setSaving(true);
    setError(null);
    try {
      const res = await verifyEmailChange({ otp: emailOtp });
      flash(res.message || "Email updated");
      setEmailStep("idle");
      setNewEmail("");
      setEmailOtp("");
      const s = await getSettings();
      setSettings(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid or expired code");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    setSaving(true);
    setError(null);
    try {
      await deleteAccount({ password: deletePassword });
      router.push("/login");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete account");
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          background: "#080C14",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Loader2 size={28} color="#3B82F6" className="animate-spin" />
      </div>
    );
  }

  return (
    <div style={{ width: "100vw", minHeight: "100vh", background: "#080C14", overflowY: "auto" }}>
      {/* Ambient background, same as ChatPage */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          background: `
            radial-gradient(ellipse 60% 40% at 50% 0%, rgba(0,87,255,0.08) 0%, transparent 70%),
            radial-gradient(ellipse 40% 30% at 80% 100%, rgba(212,175,55,0.05) 0%, transparent 60%)
          `,
        }}
      />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 640, margin: "0 auto", padding: "32px 24px 80px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 32 }}>
          <button
            onClick={() => router.push("/")}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#8B9CC4",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ArrowLeft size={17} />
          </button>
          <h1 style={{ color: "#F0F4FF", fontSize: 22, fontWeight: 700, margin: 0 }}>Settings</h1>
        </div>

        {/* Status / error banners */}
        {status && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 16px",
              borderRadius: 10,
              background: "rgba(34,197,94,0.1)",
              border: "1px solid rgba(34,197,94,0.25)",
              color: "#22c55e",
              fontSize: 13,
              marginBottom: 20,
            }}
          >
            <Check size={14} /> {status}
          </motion.div>
        )}
        {error && (
          <div
            style={{
              padding: "10px 16px",
              borderRadius: 10,
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.25)",
              color: "#EF4444",
              fontSize: 13,
              marginBottom: 20,
            }}
          >
            {error}
          </div>
        )}

        {/* Profile */}
        <div style={{ ...card, marginBottom: 20 }}>
          <div style={sectionTitle}>
            <User size={17} color="#D4AF37" /> Profile
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={label}>Username</label>
            <input style={input} value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={label}>Bio</label>
            <textarea
              style={{ ...input, minHeight: 70, resize: "vertical" as const }}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell Levi a bit about yourself"
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={label}>Avatar URL</label>
            <input style={input} value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={label}>
                <Bot size={12} style={{ display: "inline", marginRight: 4 }} /> Default model
              </label>
              <select style={input} value={defaultModel} onChange={(e) => setDefaultModel(e.target.value)}>
                <option value="swift">Levi Swift</option>
                <option value="nova">Levi Nova</option>
              </select>
            </div>
            <div>
              <label style={label}>
                <Palette size={12} style={{ display: "inline", marginRight: 4 }} /> Theme
              </label>
              <select style={input} value={theme} onChange={(e) => setTheme(e.target.value)}>
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <label style={{ ...label, marginBottom: 0, display: "flex", alignItems: "center", gap: 6 }}>
              <Bell size={12} /> Email notifications
            </label>
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: "#3B82F6" }}
            />
          </div>

          <PrimaryButton onClick={handleSaveProfile} disabled={saving}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Save profile
          </PrimaryButton>
        </div>

        {/* Password */}
        <div style={{ ...card, marginBottom: 20 }}>
          <div style={sectionTitle}>
            <Lock size={17} color="#3B82F6" /> Change password
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={label}>Current password</label>
            <input
              type="password"
              style={input}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={label}>New password</label>
            <input type="password" style={input} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <PrimaryButton onClick={handleChangePassword} disabled={saving || !currentPassword || !newPassword}>
            Update password
          </PrimaryButton>
        </div>

        {/* Email */}
        <div style={{ ...card, marginBottom: 20 }}>
          <div style={sectionTitle}>
            <Mail size={17} color="#3B82F6" /> Change email
          </div>

          {emailStep === "idle" ? (
            <>
              <div style={{ marginBottom: 20 }}>
                <label style={label}>New email address</label>
                <input style={input} value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              <PrimaryButton onClick={handleRequestEmailChange} disabled={saving || !newEmail}>
                Send verification code
              </PrimaryButton>
            </>
          ) : (
            <>
              <p style={{ color: "#8B9CC4", fontSize: 13, marginBottom: 16 }}>
                We sent a code to {newEmail}. Enter it below to confirm the change.
              </p>
              <div style={{ marginBottom: 20 }}>
                <label style={label}>Verification code</label>
                <input style={input} value={emailOtp} onChange={(e) => setEmailOtp(e.target.value)} placeholder="6-digit code" />
              </div>
              <PrimaryButton onClick={handleVerifyEmailChange} disabled={saving || !emailOtp}>
                Confirm new email
              </PrimaryButton>
            </>
          )}
        </div>

        {/* Danger zone */}
        <div style={{ ...card, border: "1px solid rgba(239,68,68,0.2)" }}>
          <div style={{ ...sectionTitle, color: "#EF4444" }}>
            <Trash2 size={17} color="#EF4444" /> Delete account
          </div>
          <p style={{ color: "#8B9CC4", fontSize: 13, marginBottom: 16 }}>
            This permanently deletes your account, conversations, and memory. This can't be undone.
          </p>

          {!confirmingDelete ? (
            <PrimaryButton danger onClick={() => setConfirmingDelete(true)}>
              Delete my account
            </PrimaryButton>
          ) : (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={label}>Confirm your password</label>
                <input
                  type="password"
                  style={input}
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <PrimaryButton danger onClick={handleDeleteAccount} disabled={saving || !deletePassword}>
                  Confirm delete
                </PrimaryButton>
                <PrimaryButton onClick={() => setConfirmingDelete(false)} disabled={saving}>
                  Cancel
                </PrimaryButton>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
