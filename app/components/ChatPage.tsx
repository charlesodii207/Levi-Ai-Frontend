"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu } from "lucide-react";
import Sidebar, { LeviMode } from "./Sidebar";
import MessageList from "./MessageList";
import PromptBox from "./PromptBox";
import CryptoAnalyzer from "./CryptoAnalyzer";
import CodeWorkspace from "./CodeWorkspace";
import BusinessHub from "./BusinessHub";
import WritingStudio from "./WritingStudio";
import ResearchHub from "./ResearchHub";
import { streamMessage, getMessages } from "@/app/lib/api";
import { isLoggedIn } from "@/app/lib/auth";
import type { LeviModel } from "./PromptBox";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const SUGGESTIONS = [
  { label: "Write me a business plan", icon: "💼" },
  { label: "Explain quantum computing", icon: "⚛️" },
  { label: "Debug my Python code", icon: "🐍" },
  { label: "Best productivity tips", icon: "⚡" },
];

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [refreshSidebar, setRefreshSidebar] = useState(0);
  const [streamingContent, setStreamingContent] = useState("");
  const [currentMode, setCurrentMode] = useState<LeviMode | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<LeviModel>("swift");

  useEffect(() => {
    if (!isLoggedIn()) router.push("/login");
  }, [router]);

  async function loadConversation(id: number) {
    try {
      const msgs = await getMessages(id);
      setConversationId(id);
      setMessages(msgs.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })));
      setStreamingContent("");
      setCurrentMode(null);
    } catch {}
  }

  function handleNewChat() {
    setConversationId(null);
    setMessages([]);
    setStreamingContent("");
  }

  function handleSelectMode(mode: LeviMode | null) {
    setCurrentMode(mode);
    setConversationId(null);
    setMessages([]);
    setStreamingContent("");
  }

  async function handleSend(message: string, hiddenContext?: string) {
    if (!message.trim() || isStreaming) return;
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setIsStreaming(true);
    setStreamingContent("");
    let fullContent = "";

    // The AI needs the full attached document content to answer well, but
    // the chat bubble the user sees (`message`) stays clean — the hidden
    // context is only stitched in for the actual backend call, never shown
    // in the visible conversation.
    const outgoingForAI = hiddenContext ? `${hiddenContext}\n\n${message}` : message;

    try {
      await streamMessage(
        { message: outgoingForAI, conversation_id: conversationId ?? undefined, mode_prompt: currentMode?.systemPrompt, model: selectedModel },
        (chunk) => { fullContent += chunk; setStreamingContent(fullContent); },
        (meta) => { if (meta.conversation_id) setConversationId(meta.conversation_id); setRefreshSidebar((n) => n + 1); },
        () => {
          setMessages((prev) => [...prev, { role: "assistant", content: fullContent }]);
          setStreamingContent("");
          setIsStreaming(false);
          setRefreshSidebar((n) => n + 1);
        }
      );
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, something went wrong. Please try again." }]);
      setStreamingContent("");
      setIsStreaming(false);
    }
  }

  const hasMessages = messages.length > 0 || isStreaming;
  const isCryptoMode = currentMode?.id === "crypto";
  const isCodingMode = currentMode?.id === "coding";
  const isBusinessMode = currentMode?.id === "business";
  const isWritingMode = currentMode?.id === "writing";
  const isResearchMode = currentMode?.id === "research";

  const displayMessages: Message[] = isStreaming && streamingContent
    ? [...messages, { role: "assistant", content: streamingContent }]
    : messages;

  // Dedicated UI modes — render full custom interface
  const isDedicatedMode = isCryptoMode || isCodingMode || isBusinessMode || isWritingMode || isResearchMode;

  return (
    <div style={{
      width: "100vw", height: "100vh",
      background: "#080C14",
      display: "flex", overflow: "hidden",
    }}>
      <Sidebar
        currentConversationId={conversationId}
        onSelectConversation={loadConversation}
        onNewChat={handleNewChat}
        onSelectMode={handleSelectMode}
        currentMode={currentMode}
        refreshTrigger={refreshSidebar}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        height: "100vh", overflow: "hidden", position: "relative",
      }}>

        {/* Ambient background */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
          background: `
            radial-gradient(ellipse 60% 40% at 50% 0%, rgba(0,87,255,0.08) 0%, transparent 70%),
            radial-gradient(ellipse 40% 30% at 80% 100%, rgba(212,175,55,0.05) 0%, transparent 60%)
          `,
        }} />

        {/* Top header bar */}
        <div style={{
          flexShrink: 0,
          height: 52,
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          background: "rgba(8,12,20,0.8)",
          backdropFilter: "blur(12px)",
          zIndex: 2,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              className="mobile-sidebar-trigger"
              onClick={() => setMobileSidebarOpen(true)}
              style={{
                display: "none",
                width: 34, height: 34, borderRadius: 9,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#8B9CC4", cursor: "pointer",
                alignItems: "center", justifyContent: "center",
                flexShrink: 0,
                position: "relative",
                zIndex: 51,
              }}
            >
              <Menu size={17} />
            </button>
            {currentMode && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "4px 12px",
                  background: `${currentMode.color}12`,
                  border: `1px solid ${currentMode.color}30`,
                  borderRadius: 20,
                  color: currentMode.color,
                  fontSize: 12, fontWeight: 600,
                }}
              >
                {currentMode.icon}
                {currentMode.label} Mode
              </motion.div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: "#22c55e",
              boxShadow: "0 0 6px #22c55e",
            }} />
            <span style={{ color: "#3D4F72", fontSize: 12 }}>Levi is online</span>
          </div>
        </div>

        {/* Dedicated mode UIs */}
        {isCodingMode ? (
          <div style={{ flex: 1, minHeight: 0, overflow: "hidden", zIndex: 1 }}>
            <CodeWorkspace />
          </div>
        ) : isCryptoMode ? (
          <div style={{ flex: 1, minHeight: 0, overflow: "hidden", zIndex: 1 }}>
            <CryptoAnalyzer />
          </div>
        ) : isBusinessMode ? (
          <div style={{ flex: 1, minHeight: 0, overflow: "hidden", zIndex: 1 }}>
            <BusinessHub />
          </div>
        ) : isWritingMode ? (
          <div style={{ flex: 1, minHeight: 0, overflow: "hidden", zIndex: 1 }}>
            <WritingStudio />
          </div>
        ) : isResearchMode ? (
          <div style={{ flex: 1, minHeight: 0, overflow: "hidden", zIndex: 1 }}>
            <ResearchHub />
          </div>
        ) : (
          <>
            {/* Empty state */}
            {!hasMessages && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{
                  flex: 1, display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  zIndex: 1, minHeight: 0, padding: "0 24px",
                }}
              >
                {currentMode ? (
                  <>
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      style={{
                        width: 72, height: 72, borderRadius: "50%",
                        background: `${currentMode.color}15`,
                        border: `1px solid ${currentMode.color}35`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        marginBottom: 20, color: currentMode.color,
                        fontSize: 28,
                        boxShadow: `0 0 40px ${currentMode.color}20`,
                      }}
                    >
                      {currentMode.icon}
                    </motion.div>
                    <p style={{ color: "#F0F4FF", fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
                      {currentMode.label} Mode
                    </p>
                    <p style={{ color: "#3D4F72", fontSize: 14 }}>
                      Levi is tuned for {currentMode.label.toLowerCase()} — ask anything
                    </p>
                  </>
                ) : (
                  <>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.6 }}
                      style={{ marginBottom: 12, position: "relative" }}
                    >
                      <div style={{
                        fontSize: 72,
                        fontWeight: 900,
                        letterSpacing: 16,
                        background: "linear-gradient(135deg, #D4AF37 0%, #F4D46B 30%, #3B82F6 60%, #0057FF 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        lineHeight: 1,
                        filter: "drop-shadow(0 0 30px rgba(212,175,55,0.3))",
                      }}>
                        LEVI
                      </div>
                      <div style={{
                        height: 2,
                        background: "linear-gradient(90deg, transparent, #D4AF37, #3B82F6, transparent)",
                        borderRadius: 2,
                        marginTop: 8,
                        opacity: 0.6,
                      }} />
                    </motion.div>

                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      style={{ color: "#3D4F72", fontSize: 15, marginBottom: 40, letterSpacing: 0.3 }}
                    >
                      Your intelligent AI assistant — built for excellence
                    </motion.p>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 10,
                        width: "100%",
                        maxWidth: 560,
                      }}
                    >
                      {SUGGESTIONS.map((s) => (
                        <button
                          key={s.label}
                          onClick={() => handleSend(s.label)}
                          style={{
                            padding: "14px 18px",
                            background: "rgba(13,20,32,0.8)",
                            border: "1px solid rgba(255,255,255,0.07)",
                            borderRadius: 14,
                            color: "#8B9CC4",
                            fontSize: 13,
                            fontWeight: 500,
                            textAlign: "left",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            transition: "all 0.2s",
                            backdropFilter: "blur(8px)",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "rgba(59,130,246,0.3)";
                            e.currentTarget.style.color = "#F0F4FF";
                            e.currentTarget.style.background = "rgba(0,87,255,0.08)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                            e.currentTarget.style.color = "#8B9CC4";
                            e.currentTarget.style.background = "rgba(13,20,32,0.8)";
                          }}
                        >
                          <span style={{ fontSize: 18 }}>{s.icon}</span>
                          {s.label}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </motion.div>
            )}

            {/* Messages */}
            {hasMessages && (
              <div style={{ flex: 1, minHeight: 0, overflow: "hidden", zIndex: 1 }}>
                <MessageList messages={displayMessages} />
              </div>
            )}

            {/* Prompt box */}
            <div style={{
              flexShrink: 0,
              padding: "12px 24px 20px",
              zIndex: 2,
              display: "flex",
              justifyContent: "center",
              background: "linear-gradient(to top, #080C14 70%, transparent)",
            }}>
              <div style={{ width: "100%", maxWidth: 760 }}>
                <PromptBox
                  onSend={handleSend}
                  disabled={isStreaming}
                  selectedModel={selectedModel}
                  onModelChange={setSelectedModel}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Below 860px, show the sidebar-open hamburger since the sidebar
          itself becomes an off-canvas drawer at that same breakpoint. */}
      <style>{`
        @media (max-width: 860px) {
          .mobile-sidebar-trigger {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
}
