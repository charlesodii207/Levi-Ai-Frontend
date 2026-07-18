"use client";

import { useEffect } from "react";

type ConfirmModalProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onCancel]);

  if (!open) return null;

  const accent = danger ? "#EF4444" : "#3B82F6";

  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(4,6,10,0.72)",
        backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
        animation: "levi-fade-in 0.15s ease-out",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 400,
          background: "#0D1420",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 18,
          padding: 24,
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          fontFamily: "Inter, sans-serif",
          animation: "levi-scale-in 0.15s ease-out",
        }}
      >
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `${accent}1A`,
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 16,
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 9v4M12 17h.01M10.29 3.86l-8.18 14.14A1.5 1.5 0 0 0 3.4 20h17.2a1.5 1.5 0 0 0 1.29-2L13.71 3.86a1.5 1.5 0 0 0-2.42 0Z" />
          </svg>
        </div>

        <h3 style={{ color: "#F0F4FF", fontSize: 17, fontWeight: 700, marginBottom: 8 }}>
          {title}
        </h3>
        <p style={{ color: "#8B9CC4", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
          {message}
        </p>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{
              padding: "10px 18px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10,
              color: "#8B9CC4",
              fontSize: 13, fontWeight: 600,
              cursor: "pointer",
              fontFamily: "Inter, sans-serif",
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "10px 18px",
              background: accent,
              border: "none",
              borderRadius: 10,
              color: "white",
              fontSize: 13, fontWeight: 700,
              cursor: "pointer",
              fontFamily: "Inter, sans-serif",
              boxShadow: `0 4px 16px ${accent}40`,
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes levi-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes levi-scale-in { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}

/**
 * Shows a one-time generated value (e.g. a reset password) with a
 * copy button. Unlike ConfirmModal, this has no "cancel" path — it's
 * shown after an action already succeeded, purely to relay the result.
 */
type PasswordRevealModalProps = {
  open: boolean;
  username: string;
  password: string;
  onClose: () => void;
};

export function PasswordRevealModal({ open, username, password, onClose }: PasswordRevealModalProps) {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  function handleCopy() {
    navigator.clipboard.writeText(password).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(4,6,10,0.72)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20, animation: "levi-fade-in 0.15s ease-out",
      }}
    >
      <div
        style={{
          width: "100%", maxWidth: 400,
          background: "#0D1420", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 18, padding: 24,
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          fontFamily: "Inter, sans-serif",
          animation: "levi-scale-in 0.15s ease-out",
        }}
      >
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: "rgba(34,197,94,0.12)",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 16,
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" /><path d="M8.5 12.5l2.5 2.5 5-5.5" />
          </svg>
        </div>

        <h3 style={{ color: "#F0F4FF", fontSize: 17, fontWeight: 700, marginBottom: 8 }}>
          Password reset for {username}
        </h3>
        <p style={{ color: "#8B9CC4", fontSize: 13.5, lineHeight: 1.6, marginBottom: 16 }}>
          Share this temporary password with them securely. It won't be shown again — they'll be required to set a new one on their next login.
        </p>

        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "rgba(6,10,16,0.8)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 10, padding: "12px 14px", marginBottom: 20,
        }}>
          <code style={{ flex: 1, color: "#F0F4FF", fontSize: 15, fontFamily: "monospace", letterSpacing: 0.5 }}>
            {password}
          </code>
          <button
            onClick={handleCopy}
            style={{
              padding: "6px 12px", background: copied ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.06)",
              border: "none", borderRadius: 8,
              color: copied ? "#22C55E" : "#8B9CC4",
              fontSize: 12, fontWeight: 700, cursor: "pointer",
              fontFamily: "Inter, sans-serif", whiteSpace: "nowrap",
            }}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        <button
          onClick={onClose}
          style={{
            width: "100%", padding: "11px",
            background: "#3B82F6", border: "none", borderRadius: 10,
            color: "white", fontSize: 13.5, fontWeight: 700, cursor: "pointer",
            fontFamily: "Inter, sans-serif",
          }}
        >
          Done
        </button>
      </div>

      <style>{`
        @keyframes levi-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes levi-scale-in { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}
/**
 * Hook-style helper for the common case: confirm -> run an async action.
 * Usage:
 *   const confirm = useConfirm();
 *   confirm.ask({ title: "...", message: "...", danger: true, onConfirm: async () => { ... } });
 *   <ConfirmModal {...confirm.props} />
 */
import { useState, useCallback } from "react";

type AskArgs = {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void | Promise<void>;
};

export function useConfirm() {
  const [state, setState] = useState<AskArgs | null>(null);

  const ask = useCallback((args: AskArgs) => setState(args), []);
  const close = useCallback(() => setState(null), []);

  const handleConfirm = useCallback(async () => {
    if (!state) return;
    await state.onConfirm();
    setState(null);
  }, [state]);

  return {
    ask,
    props: {
      open: !!state,
      title: state?.title || "",
      message: state?.message || "",
      confirmLabel: state?.confirmLabel,
      danger: state?.danger,
      onConfirm: handleConfirm,
      onCancel: close,
    },
  };
}
