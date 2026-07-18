"use client";

import { useState, useRef } from "react";
import { Send, Paperclip, Mic, X, Loader2, FileText } from "lucide-react";
import { getToken } from "../lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

type PromptBoxProps = {
  onSend: (message: string) => void;
  disabled?: boolean;
};

export default function PromptBox({ onSend, disabled = false }: PromptBoxProps) {
  const [message, setMessage] = useState("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isAttaching, setIsAttaching] = useState(false);
  const [attachError, setAttachError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePaperclipClick = () => {
    if (disabled || isAttaching) return;
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file);
      setAttachError(null);
    }
    e.target.value = ""; // allow re-selecting the same file later
  };

  const removeAttachment = () => {
    setAttachedFile(null);
    setAttachError(null);
  };

  const handleSend = async () => {
    const trimmed = message.trim();
    if ((!trimmed && !attachedFile) || disabled || isAttaching) return;

    let outgoingMessage = trimmed;

    // One-off attachment: extract text via /chat/attach, fold it into this
    // single message. Nothing gets saved permanently — this is scoped to
    // this message only, unlike the /knowledge page uploads.
    if (attachedFile) {
      setIsAttaching(true);
      setAttachError(null);
      try {
        const formData = new FormData();
        formData.append("file", attachedFile);

        const token = getToken();
        const res = await fetch(`${API_BASE}/chat/attach`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => null);
          throw new Error(errBody?.detail || "Failed to process attachment");
        }

        const data: { filename: string; content: string; truncated: boolean } = await res.json();

        const attachmentBlock = `[Attached file: ${data.filename}]\n${data.content}${
          data.truncated ? "\n[...content truncated]" : ""
        }`;

        outgoingMessage = trimmed
          ? `${attachmentBlock}\n\n${trimmed}`
          : `${attachmentBlock}\n\nWhat can you tell me about this file?`;
      } catch (err) {
        setAttachError(err instanceof Error ? err.message : "Failed to attach file");
        setIsAttaching(false);
        return;
      }
      setIsAttaching(false);
    }

    onSend(outgoingMessage);
    setMessage("");
    setAttachedFile(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    // Auto-resize
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
  };

  const canSend = (message.trim() || attachedFile) && !disabled && !isAttaching;

  return (
    <div style={{
      width: "100%",
      background: "rgba(13,20,32,0.95)",
      borderRadius: 18,
      border: `1px solid ${disabled ? "rgba(255,255,255,0.04)" : canSend ? "rgba(59,130,246,0.25)" : "rgba(255,255,255,0.08)"}`,
      boxShadow: canSend
        ? "0 0 0 1px rgba(59,130,246,0.1), 0 8px 32px rgba(0,87,255,0.12)"
        : "0 4px 24px rgba(0,0,0,0.3)",
      transition: "all 0.25s ease",
      backdropFilter: "blur(16px)",
    }}>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        style={{ display: "none" }}
        onChange={handleFileSelect}
        accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.webp,.bmp"
      />

      {attachedFile && (
        <div style={{
          margin: "10px 16px 0",
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "rgba(59,130,246,0.08)",
          border: "1px solid rgba(59,130,246,0.2)",
          borderRadius: 10,
          padding: "6px 10px",
          width: "fit-content",
          maxWidth: "90%",
        }}>
          <FileText size={14} color="#8B9CC4" />
          <span style={{
            color: "#C9D4EE",
            fontSize: 12,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: 220,
          }}>
            {attachedFile.name}
          </span>
          <button
            onClick={removeAttachment}
            style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", color: "#3D4F72" }}
          >
            <X size={13} />
          </button>
        </div>
      )}

      {attachError && (
        <p style={{ margin: "8px 16px 0", color: "#F87171", fontSize: 12 }}>{attachError}</p>
      )}

      <div style={{ padding: "14px 16px 10px" }}>
        <textarea
          ref={textareaRef}
          placeholder={disabled ? "Levi is thinking..." : "Ask Levi anything..."}
          rows={1}
          value={message}
          disabled={disabled}
          onChange={handleInput}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            outline: "none",
            color: disabled ? "#3D4F72" : "#F0F4FF",
            resize: "none",
            fontSize: 15,
            lineHeight: 1.6,
            fontFamily: "Inter, sans-serif",
            minHeight: 28,
            maxHeight: 160,
            overflow: "auto",
          }}
        />
      </div>

      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 14px 12px",
        borderTop: "1px solid rgba(255,255,255,0.04)",
      }}>
        {/* Left actions */}
        <div style={{ display: "flex", gap: 4 }}>
          <button
            onClick={handlePaperclipClick}
            disabled={disabled || isAttaching}
            style={{
              background: "transparent", border: "none",
              color: attachedFile ? "#3B82F6" : "#3D4F72",
              cursor: disabled || isAttaching ? "not-allowed" : "pointer", padding: "6px 8px",
              borderRadius: 8, display: "flex", alignItems: "center",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => { if (!disabled && !isAttaching) e.currentTarget.style.color = "#8B9CC4"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = attachedFile ? "#3B82F6" : "#3D4F72"; }}
          >
            {isAttaching ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
          </button>
          <button style={{
            background: "transparent", border: "none",
            color: "#3D4F72", cursor: "pointer", padding: "6px 8px",
            borderRadius: 8, display: "flex", alignItems: "center",
            transition: "color 0.15s",
          }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#8B9CC4"}
            onMouseLeave={(e) => e.currentTarget.style.color = "#3D4F72"}
          >
            <Mic size={16} />
          </button>
        </div>

        {/* Right — hint + send */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {message.trim() && !disabled && (
            <span style={{ color: "#3D4F72", fontSize: 11 }}>
              Shift+Enter for new line
            </span>
          )}
          <button
            onClick={handleSend}
            disabled={!canSend}
            style={{
              width: 36, height: 36,
              background: canSend
                ? "linear-gradient(135deg, #0057FF, #3B82F6)"
                : "rgba(255,255,255,0.04)",
              border: "none",
              borderRadius: 10,
              cursor: canSend ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: canSend ? "white" : "#3D4F72",
              transition: "all 0.2s",
              boxShadow: canSend ? "0 4px 16px rgba(0,87,255,0.35)" : "none",
              flexShrink: 0,
            }}
          >
            {isAttaching ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}
