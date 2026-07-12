"use client";

import { useState, useRef } from "react";
import { Send, Paperclip, Mic } from "lucide-react";

type PromptBoxProps = {
  onSend: (message: string) => void;
  disabled?: boolean;
};

export default function PromptBox({ onSend, disabled = false }: PromptBoxProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setMessage("");
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

  const canSend = message.trim() && !disabled;

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
          <button style={{
            background: "transparent", border: "none",
            color: "#3D4F72", cursor: "pointer", padding: "6px 8px",
            borderRadius: 8, display: "flex", alignItems: "center",
            transition: "color 0.15s",
          }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#8B9CC4"}
            onMouseLeave={(e) => e.currentTarget.style.color = "#3D4F72"}
          >
            <Paperclip size={16} />
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
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
