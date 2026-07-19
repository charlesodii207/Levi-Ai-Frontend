"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Volume2, VolumeX } from "lucide-react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

// Strip markdown syntax before speaking so the voice doesn't read out
// "asterisk asterisk bold asterisk asterisk" etc. — just the plain words.
function stripMarkdownForSpeech(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " code block omitted ") // fenced code
    .replace(/`([^`]+)`/g, "$1") // inline code
    .replace(/!\[.*?\]\(.*?\)/g, "") // images
    .replace(/\[(.*?)\]\(.*?\)/g, "$1") // links -> just the label
    .replace(/[*_#>~-]/g, "") // markdown symbols
    .replace(/\n{2,}/g, ". ") // paragraph breaks -> pause
    .replace(/\n/g, " ")
    .trim();
}

export default function MessageList({ messages }: { messages: Message[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setSpeechSupported(false);
    }
    // Stop any speech in progress if the component unmounts (e.g. navigating away)
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function toggleSpeak(index: number, text: string) {
    if (!speechSupported) return;

    if (speakingIndex === index) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
      return;
    }

    // Only one message speaks at a time — cancel whatever's currently playing.
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(stripMarkdownForSpeech(text));
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onend = () => setSpeakingIndex(null);
    utterance.onerror = () => setSpeakingIndex(null);

    setSpeakingIndex(index);
    window.speechSynthesis.speak(utterance);
  }

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

            <div style={{ maxWidth: "75%" }}>
              <div style={{
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

              {/* Speak button — assistant messages only */}
              {msg.role === "assistant" && speechSupported && (
                <button
                  onClick={() => toggleSpeak(i, msg.content)}
                  title={speakingIndex === i ? "Stop reading" : "Read aloud"}
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    marginTop: 6, marginLeft: 4,
                    background: speakingIndex === i ? "rgba(59,130,246,0.1)" : "transparent",
                    border: "none",
                    borderRadius: 6,
                    padding: "4px 8px",
                    color: speakingIndex === i ? "#3B82F6" : "#3D4F72",
                    fontSize: 11,
                    cursor: "pointer",
                  }}
                >
                  {speakingIndex === i ? <VolumeX size={13} /> : <Volume2 size={13} />}
                  {speakingIndex === i ? "Stop" : "Listen"}
                </button>
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
