"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function MessageList({ messages }: { messages: Message[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div
      ref={containerRef}
      style={{
        height: "100%",
        overflowY: "auto",
        padding: "32px 24px 16px",
      }}
    >
      <div style={{ maxWidth: 820, width: "100%", margin: "0 auto" }}>
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              marginBottom: 20,
            }}
          >
            {msg.role === "assistant" && (
              <div style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #0057ff, #3b82f6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 800,
                color: "white",
                flexShrink: 0,
                marginRight: 12,
                marginTop: 4,
                boxShadow: "0 0 12px rgba(0,87,255,0.4)",
              }}>
                L
              </div>
            )}

            <div style={{
              maxWidth: "75%",
              padding: msg.role === "user" ? "12px 18px" : "16px 20px",
              borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "4px 18px 18px 18px",
              background: msg.role === "user"
                ? "linear-gradient(135deg, #0057ff, #3b82f6)"
                : "#0D1117",
              border: msg.role === "assistant" ? "1px solid rgba(255,255,255,0.06)" : "none",
              color: "white",
              fontSize: 15,
              lineHeight: 1.65,
              boxShadow: msg.role === "user"
                ? "0 4px 20px rgba(0,87,255,0.25)"
                : "none",
            }}>
              {msg.role === "user" ? (
                <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{msg.content}</p>
              ) : (
                <div className="markdown-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>

            {msg.role === "user" && (
              <div style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #D4AF37, #f4d46b)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 800,
                color: "black",
                flexShrink: 0,
                marginLeft: 12,
                marginTop: 4,
              }}>
                U
              </div>
            )}
          </motion.div>
        ))}

        {/* Typing indicator — only show when last message is user and we're waiting */}
        {messages.length > 0 && messages[messages.length - 1].role === "user" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "linear-gradient(135deg, #0057ff, #3b82f6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 800, color: "white", flexShrink: 0,
              boxShadow: "0 0 12px rgba(0,87,255,0.4)",
            }}>L</div>
            <div style={{
              padding: "14px 18px",
              background: "#0D1117",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "4px 18px 18px 18px",
              display: "flex", gap: 6, alignItems: "center",
            }}>
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                  style={{ width: 6, height: 6, borderRadius: "50%", background: "#3b82f6" }}
                />
              ))}
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
