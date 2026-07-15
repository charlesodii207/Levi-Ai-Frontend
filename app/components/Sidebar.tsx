"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, MessageSquare, Trash2, Pencil, Check, X,
  LogOut, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
} from "lucide-react";
import { getConversations, deleteConversation, renameConversation } from "@/app/lib/api";
import { removeToken } from "@/app/lib/auth";
import { useRouter } from "next/navigation";
import { LeviMode, LEVI_MODES } from "@/app/lib/modes";

// Re-exported so existing imports like `import { LEVI_MODES } from "./Sidebar"`
// keep working unchanged elsewhere in the app.
export type { LeviMode };
export { LEVI_MODES };

type Conversation = {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
};

type SidebarProps = {
  currentConversationId: number | null;
  onSelectConversation: (id: number) => void;
  onNewChat: () => void;
  onSelectMode: (mode: LeviMode | null) => void;
  currentMode: LeviMode | null;
  refreshTrigger: number;
};

export default function Sidebar({
  currentConversationId, onSelectConversation, onNewChat,
  onSelectMode, currentMode, refreshTrigger,
}: SidebarProps) {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [showRecent, setShowRecent] = useState(true);
  const [showModes, setShowModes] = useState(true);
  const editRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadConversations(); }, [refreshTrigger]);
  useEffect(() => { if (editingId && editRef.current) editRef.current.focus(); }, [editingId]);

  async function loadConversations() {
    try { const data = await getConversations(); setConversations(data); } catch {}
  }

  async function handleDelete(e: React.MouseEvent, id: number) {
    e.stopPropagation();
    await deleteConversation(id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (currentConversationId === id) onNewChat();
  }

  function startEdit(e: React.MouseEvent, conv: Conversation) {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  }

  async function confirmEdit(id: number) {
    if (!editTitle.trim()) return cancelEdit();
    await renameConversation(id, editTitle.trim());
    setConversations((prev) => prev.map((c) => c.id === id ? { ...c, title: editTitle.trim() } : c));
    setEditingId(null);
  }

  function cancelEdit() { setEditingId(null); setEditTitle(""); }

  function handleModeClick(mode: LeviMode) {
    if (currentMode?.id === mode.id) { onSelectMode(null); }
    else { onSelectMode(mode); onNewChat(); }
  }

  return (
    <motion.div
      animate={{ width: collapsed ? 56 : 256 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      style={{
        height: "100vh",
        background: "#060A10",
        borderRight: "1px solid rgba(255,255,255,0.05)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div style={{
        padding: collapsed ? "16px 0" : "16px 14px",
        display: "flex",
        alignItems: "center",
        justifyContent: collapsed ? "center" : "space-between",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        flexShrink: 0,
        height: 52,
      }}>
        {collapsed ? (
          <img
            src="/logo-mark.png"
            alt="Levi"
            style={{ height: 26, width: "auto", display: "block" }}
          />
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <img
              src="/logo-mark.png"
              alt="Levi"
              style={{ height: 26, width: "auto", display: "block" }}
            />
            <span style={{
              background: "linear-gradient(135deg, #D4AF37, #F4D46B 40%, #3B82F6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              fontWeight: 900,
              fontSize: 16,
              letterSpacing: 3,
            }}>
              LEVI
            </span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            background: "transparent", border: "none",
            color: "#3D4F72", cursor: "pointer", padding: 4,
            display: "flex", alignItems: "center",
            borderRadius: 6,
          }}
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>

      {/* New Chat */}
      <div style={{ padding: collapsed ? "10px 8px" : "10px 10px", flexShrink: 0 }}>
        <button
          onClick={() => { onNewChat(); onSelectMode(null); }}
          style={{
            width: "100%",
            padding: collapsed ? "9px 0" : "9px 12px",
            background: "rgba(0,87,255,0.08)",
            border: "1px solid rgba(59,130,246,0.18)",
            borderRadius: 10,
            color: "#3B82F6",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            gap: 8,
            fontSize: 13,
            fontWeight: 600,
            transition: "all 0.15s",
          }}
        >
          <Plus size={14} />
          {!collapsed && "New Chat"}
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: collapsed ? "4px 8px" : "4px 10px" }}>

        {/* Modes */}
        {!collapsed && (
          <button
            onClick={() => setShowModes(!showModes)}
            style={{
              width: "100%", background: "none", border: "none",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "8px 4px", color: "#3D4F72",
              fontSize: 10, fontWeight: 700, letterSpacing: 1.2,
              cursor: "pointer", marginBottom: 2,
            }}
          >
            MODES {showModes ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
          </button>
        )}

        <AnimatePresence>
          {(showModes || collapsed) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: "hidden", marginBottom: 6 }}
            >
              {LEVI_MODES.map((mode) => {
                const isActive = currentMode?.id === mode.id;
                return (
                  <button
                    key={mode.id}
                    onClick={() => handleModeClick(mode)}
                    title={collapsed ? mode.label : undefined}
                    style={{
                      width: "100%",
                      padding: collapsed ? "9px 0" : "8px 10px",
                      background: isActive ? `${mode.color}12` : "transparent",
                      border: `1px solid ${isActive ? mode.color + "30" : "transparent"}`,
                      borderRadius: 9,
                      color: isActive ? mode.color : "#3D4F72",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: collapsed ? "center" : "flex-start",
                      gap: 9, fontSize: 13, fontWeight: 500,
                      marginBottom: 1, transition: "all 0.15s", textAlign: "left",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = "#8B9CC4";
                        e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = "#3D4F72";
                        e.currentTarget.style.background = "transparent";
                      }
                    }}
                  >
                    <span style={{ color: isActive ? mode.color : "#3D4F72", flexShrink: 0 }}>
                      {mode.icon}
                    </span>
                    {!collapsed && mode.label}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Divider */}
        {!collapsed && <div style={{ height: 1, background: "rgba(255,255,255,0.04)", margin: "6px 0 8px" }} />}

        {/* Recent */}
        {!collapsed && (
          <button
            onClick={() => setShowRecent(!showRecent)}
            style={{
              width: "100%", background: "none", border: "none",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "6px 4px", color: "#3D4F72",
              fontSize: 10, fontWeight: 700, letterSpacing: 1.2,
              cursor: "pointer", marginBottom: 2,
            }}
          >
            RECENT {showRecent ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
          </button>
        )}

        <AnimatePresence>
          {(showRecent || collapsed) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {conversations.slice(0, 25).map((conv) => {
                const isActive = currentConversationId === conv.id;
                return (
                  <motion.div
                    key={conv.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    onClick={() => onSelectConversation(conv.id)}
                    style={{
                      padding: collapsed ? "9px 0" : "7px 10px",
                      borderRadius: 9, marginBottom: 1, cursor: "pointer",
                      background: isActive ? "rgba(0,87,255,0.1)" : "transparent",
                      border: `1px solid ${isActive ? "rgba(59,130,246,0.2)" : "transparent"}`,
                      display: "flex", alignItems: "center",
                      justifyContent: collapsed ? "center" : "space-between",
                      gap: 8, transition: "all 0.12s",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                      <MessageSquare size={12} color={isActive ? "#3B82F6" : "#3D4F72"} style={{ flexShrink: 0 }} />
                      {!collapsed && (
                        editingId === conv.id ? (
                          <input
                            ref={editRef}
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") confirmEdit(conv.id);
                              if (e.key === "Escape") cancelEdit();
                            }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              flex: 1, background: "transparent", border: "none",
                              borderBottom: "1px solid #3B82F6", color: "white",
                              fontSize: 12, outline: "none", padding: "1px 0",
                            }}
                          />
                        ) : (
                          <span style={{
                            color: isActive ? "#F0F4FF" : "#3D4F72",
                            fontSize: 12, overflow: "hidden",
                            textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1,
                          }}>
                            {conv.title}
                          </span>
                        )
                      )}
                    </div>

                    {!collapsed && editingId !== conv.id && (
                      <div style={{ display: "flex", gap: 2, flexShrink: 0, opacity: 0 }}
                        className="conv-actions">
                        <button onClick={(e) => startEdit(e, conv)}
                          style={{ background: "none", border: "none", color: "#3D4F72", cursor: "pointer", padding: 3, borderRadius: 4 }}>
                          <Pencil size={10} />
                        </button>
                        <button onClick={(e) => handleDelete(e, conv.id)}
                          style={{ background: "none", border: "none", color: "#3D4F72", cursor: "pointer", padding: 3, borderRadius: 4 }}>
                          <Trash2 size={10} />
                        </button>
                      </div>
                    )}

                    {!collapsed && editingId === conv.id && (
                      <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                        <button onClick={(e) => { e.stopPropagation(); confirmEdit(conv.id); }}
                          style={{ background: "none", border: "none", color: "#22C55E", cursor: "pointer", padding: 3 }}>
                          <Check size={11} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); cancelEdit(); }}
                          style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", padding: 3 }}>
                          <X size={11} />
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div style={{
        padding: collapsed ? "12px 8px" : "12px 10px",
        borderTop: "1px solid rgba(255,255,255,0.04)",
        flexShrink: 0,
      }}>
        <button
          onClick={() => { removeToken(); router.push("/login"); }}
          style={{
            width: "100%",
            padding: collapsed ? "9px 0" : "9px 12px",
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.04)",
            borderRadius: 10, color: "#3D4F72", cursor: "pointer",
            display: "flex", alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            gap: 8, fontSize: 12, transition: "all 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#8B9CC4"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#3D4F72"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.04)"; }}
        >
          <LogOut size={13} />
          {!collapsed && "Sign Out"}
        </button>
      </div>
    </motion.div>
  );
}
