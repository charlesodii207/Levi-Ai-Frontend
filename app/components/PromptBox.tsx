"use client";

import { useState, useRef } from "react";
import { Send, Paperclip, Mic, X, Loader2, FileText, Zap, Sparkles, ChevronDown } from "lucide-react";
import { getToken } from "../lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type LeviModel = "swift" | "nova";

const MODEL_OPTIONS: { id: LeviModel; label: string; description: string; icon: typeof Zap }[] = [
  { id: "swift", label: "Levi Swift", description: "Fast responses", icon: Zap },
  { id: "nova", label: "Levi Nova", description: "Deeper reasoning", icon: Sparkles },
];

type PromptBoxProps = {
  onSend: (message: string, hiddenContext?: string) => void;
  disabled?: boolean;
  selectedModel: LeviModel;
  onModelChange: (model: LeviModel) => void;
};

export default function PromptBox({ onSend, disabled = false, selectedModel, onModelChange }: PromptBoxProps) {
  const [message, setMessage] = useState("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isAttaching, setIsAttaching] = useState(false);
  const [attachError, setAttachError] = useState<string | null>(null);
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeModel = MODEL_OPTIONS.find((m) => m.id === selectedModel) ?? MODEL_OPTIONS[0];
  const ActiveIcon = activeModel.icon;

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

    // No attachment: business as usual, single clean message.
    if (!attachedFile) {
      onSend(trimmed);
      setMessage("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      return;
    }

    // With attachment: extract text via /chat/attach, then send a CLEAN
    // display message (what shows in the chat bubble) plus a separate
    // hidden context string (what actually gets sent to the AI). These
    // are never combined into one string here — that was the bug.
    setIsAttaching(true);
    setAttachError(null);
    try {
      const formData = new FormData();
      formData.append("file", attachedFile);
      formData.append("model", selectedModel);

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

      const hiddenContext = `[Attached file: ${data.filename}]\n${data.content}${
        data.truncated ? "\n[...content truncated]" : ""
      }`;

      // This is the only part the user sees in their own chat bubble.
      const displayMessage = `📎 ${data.filename}\n${trimmed || "What can you tell me about this file?"}`;

      onSend(displayMessage, hiddenContext);

      setMessage("");
      setAttachedFile(null);
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    } catch (err) {
      setAttachError(err instanceof Error ? err.message : "Failed to attach file");
    } finally {
      setIsAttaching(false);
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
        <div style={{ display: "flex", gap: 4, alignItems: "center", position: "relative" }}>
          <button
            onClick={() => setModelMenuOpen((open) => !open)}
            disabled={disabled}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              background: "rgba(59,130,246,0.08)",
              border: "1px solid rgba(59,130,246,0.2)",
              color: "#8B9CC4",
              cursor: disabled ? "not-allowed" : "pointer",
              padding: "6px 10px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              marginRight: 4,
            }}
          >
            <ActiveIcon size={13} color="#3B82F6" />
            {activeModel.label}
            <ChevronDown size={12} />
          </button>

          {modelMenuOpen && (
            <div style={{
              position: "absolute",
              bottom: "calc(100% + 8px)",
              left: 0,
              background: "rgba(13,20,32,0.98)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              padding: 6,
              minWidth: 200,
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              zIndex: 20,
            }}>
              {MODEL_OPTIONS.map((opt) => {
                const OptIcon = opt.icon;
                const isActive = opt.id === selectedModel;
                return (
                  <button
                    key={opt.id}
                    onClick={() => {
                      onModelChange(opt.id);
                      setModelMenuOpen(false);
                    }}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      width: "100%",
                      background: isActive ? "rgba(59,130,246,0.1)" : "transparent",
                      border: "none",
                      borderRadius: 8,
                      padding: "8px 10px",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <OptIcon size={15} color={isActive ? "#3B82F6" : "#8B9CC4"} />
                    <div>
                      <div style={{ color: isActive ? "#F0F4FF" : "#C9D4EE", fontSize: 13, fontWeight: 600 }}>
                        {opt.label}
                      </div>
                      <div style={{ color: "#3D4F72", fontSize: 11 }}>{opt.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

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
