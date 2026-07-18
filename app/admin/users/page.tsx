"use client";

import { useEffect, useState } from "react";
import { listUsers, suspendUser, activateUser, deleteUser, getAdminMe } from "@/app/lib/adminApi";
import { isOnline, OnlineDot } from "@/app/lib/onlineStatus";
import { IconMoreVertical, IconBan, IconCheckCircle, IconTrash } from "@/app/components/Icons";
import { ConfirmModal, useConfirm } from "@/app/components/ConfirmModal";

type User = {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  last_login_at: string | null;
  last_login_ip: string | null;
  last_active_at: string | null;
};

const CAN_DELETE_TIERS = ["owner", "super_admin"];

export default function AdminUsersPage() {
  const confirm = useConfirm();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [canDelete, setCanDelete] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; openUp: boolean }>({ top: 0, left: 0, openUp: false });
  const [skip, setSkip] = useState(0);
  const [, forceTick] = useState(0);
  const limit = 50;

  useEffect(() => {
    getAdminMe().then((me) => setCanDelete(CAN_DELETE_TIERS.includes(me.tier))).catch(() => {});
  }, []);

  async function loadUsers() {
    setLoading(true);
    setError("");
    try {
      setUsers(await listUsers(skip, limit));
    } catch (err: any) {
      setError(err.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip]);

  useEffect(() => {
    const interval = setInterval(() => forceTick((t) => t + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  function doSuspend(user: User) {
    setOpenMenuId(null);
    confirm.ask({
      title: "Suspend this user?",
      message: `"${user.username}" will immediately lose access to Levi, including any active session.`,
      confirmLabel: "Suspend",
      danger: true,
      onConfirm: async () => {
        setActioningId(user.id);
        try {
          await suspendUser(user.id);
          setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, is_active: false } : u));
        } catch (err: any) {
          setError(err.message || "Failed to suspend user.");
        } finally {
          setActioningId(null);
        }
      },
    });
  }

  function doActivate(user: User) {
    setOpenMenuId(null);
    confirm.ask({
      title: "Reactivate this user?",
      message: `"${user.username}" will regain full access to their account.`,
      confirmLabel: "Reactivate",
      onConfirm: async () => {
        setActioningId(user.id);
        try {
          await activateUser(user.id);
          setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, is_active: true } : u));
        } catch (err: any) {
          setError(err.message || "Failed to activate user.");
        } finally {
          setActioningId(null);
        }
      },
    });
  }

  function doDelete(user: User) {
    setOpenMenuId(null);
    confirm.ask({
      title: "Delete this user?",
      message: `"${user.username}" and all of their data will be permanently deleted. This cannot be undone.`,
      confirmLabel: "Delete",
      danger: true,
      onConfirm: async () => {
        setActioningId(user.id);
        try {
          await deleteUser(user.id);
          setUsers((prev) => prev.filter((u) => u.id !== user.id));
        } catch (err: any) {
          setError(err.message || "Failed to delete user.");
        } finally {
          setActioningId(null);
        }
      },
    });
  }

  function openUserMenu(e: React.MouseEvent<HTMLButtonElement>, userId: number) {
    if (openMenuId === userId) { setOpenMenuId(null); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    const menuHeight = 120;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < menuHeight;
    setMenuPos({
      top: openUp ? rect.top - 6 : rect.bottom + 6,
      left: Math.max(12, rect.right - 200),
      openUp,
    });
    setOpenMenuId(userId);
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      {openMenuId !== null && (
        <div onClick={() => setOpenMenuId(null)} style={{ position: "fixed", inset: 0, zIndex: 90 }} />
      )}

      <h1 style={{ color: "#F0F4FF", fontSize: "clamp(20px, 4vw, 27px)", fontWeight: 800, marginBottom: 5, letterSpacing: -0.3 }}>
        Users
      </h1>
      <p style={{ color: "#5A6B8C", fontSize: 14, marginBottom: 26 }}>
        View, suspend, or manage user accounts.
      </p>

      {error && (
        <div style={{ padding: "12px 16px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, color: "#EF4444", fontSize: 13, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ color: "#8B9CC4", fontSize: 14 }}>Loading users...</p>
      ) : users.length === 0 ? (
        <p style={{ color: "#8B9CC4", fontSize: 14 }}>No users found.</p>
      ) : (
        <div style={{ background: "#0D1420", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18 }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["", "Username", "Email", "Status", "Verified", "Last Login", "Last IP", "Joined", ""].map((h, i) => (
                    <th key={i} style={{ textAlign: "left", padding: "15px 16px", color: "#5A6B8C", fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const online = isOnline(user.last_active_at);
                  const menuOpen = openMenuId === user.id;
                  return (
                    <tr key={user.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                      <td style={{ padding: "15px 8px 15px 16px" }}><OnlineDot online={online} /></td>
                      <td style={{ padding: "15px 16px", color: "#F0F4FF", fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap" }}>{user.username}</td>
                      <td style={{ padding: "15px 16px", color: "#8B9CC4", fontSize: 13, whiteSpace: "nowrap" }}>{user.email}</td>
                      <td style={{ padding: "15px 16px", whiteSpace: "nowrap" }}>
                        <span style={{
                          padding: "3px 10px", borderRadius: 999, fontSize: 10.5, fontWeight: 700,
                          background: user.is_active ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                          color: user.is_active ? "#22C55E" : "#EF4444",
                          border: `1px solid ${user.is_active ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                        }}>
                          {user.is_active ? "Active" : "Suspended"}
                        </span>
                      </td>
                      <td style={{ padding: "15px 16px", color: "#8B9CC4", fontSize: 13, whiteSpace: "nowrap" }}>{user.is_verified ? "✓" : "—"}</td>
                      <td style={{ padding: "15px 16px", color: "#8B9CC4", fontSize: 13, whiteSpace: "nowrap" }}>{formatDate(user.last_login_at)}</td>
                      <td style={{ padding: "15px 16px", color: "#8B9CC4", fontSize: 13, whiteSpace: "nowrap", fontFamily: "monospace" }}>{user.last_login_ip || "—"}</td>
                      <td style={{ padding: "15px 16px", color: "#8B9CC4", fontSize: 13, whiteSpace: "nowrap" }}>{formatDate(user.created_at)}</td>
                      <td style={{ padding: "15px 16px", textAlign: "right" }}>
                        <button
                          onClick={(e) => openUserMenu(e, user.id)}
                          disabled={actioningId === user.id}
                          style={{
                            background: menuOpen ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8,
                            color: "#8B9CC4", cursor: "pointer", padding: "7px 8px", display: "inline-flex",
                          }}
                        >
                          <IconMoreVertical size={16} />
                        </button>

                        {menuOpen && (
                          <div style={{
                            position: "fixed",
                            top: menuPos.openUp ? undefined : menuPos.top,
                            bottom: menuPos.openUp ? window.innerHeight - menuPos.top : undefined,
                            left: menuPos.left,
                            width: 200, background: "#141C2C",
                            border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12,
                            boxShadow: "0 12px 32px rgba(0,0,0,0.45)", zIndex: 100,
                            padding: 6, textAlign: "left",
                          }}>
                            {user.is_active ? (
                              <MenuItem icon={<IconBan size={15} />} label="Suspend user" color="#EF4444" onClick={() => doSuspend(user)} />
                            ) : (
                              <MenuItem icon={<IconCheckCircle size={15} />} label="Reactivate user" color="#22C55E" onClick={() => doActivate(user)} />
                            )}
                            {canDelete && (
                              <MenuItem icon={<IconTrash size={15} />} label="Delete user" color="#EF4444" onClick={() => doDelete(user)} />
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
        <button onClick={() => setSkip(Math.max(0, skip - limit))} disabled={skip === 0 || loading} style={pageBtnStyle}>← Previous</button>
        <button onClick={() => setSkip(skip + limit)} disabled={users.length < limit || loading} style={pageBtnStyle}>Next →</button>
      </div>

      <ConfirmModal {...confirm.props} />
    </div>
  );
}

function MenuItem({ icon, label, color, onClick }: { icon: React.ReactNode; label: string; color: string; onClick: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex", alignItems: "center", gap: 10, width: "100%",
        padding: "9px 10px", background: hover ? `${color}14` : "transparent",
        border: "none", borderRadius: 8, color,
        fontSize: 13, fontWeight: 600, cursor: "pointer",
        fontFamily: "Inter, sans-serif", textAlign: "left",
        transition: "background 0.1s ease",
      }}
    >
      {icon} {label}
    </button>
  );
}

const pageBtnStyle: React.CSSProperties = {
  padding: "10px 18px", background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10,
  color: "#8B9CC4", fontSize: 13, fontWeight: 600, cursor: "pointer",
  fontFamily: "Inter, sans-serif",
};
