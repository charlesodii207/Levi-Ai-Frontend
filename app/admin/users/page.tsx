"use client";

import { useEffect, useState } from "react";
import { listUsers, suspendUser, activateUser, deleteUser, getAdminMe } from "@/app/lib/adminApi";

type User = {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  last_login_at: string | null;
  last_login_ip: string | null;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [isSenior, setIsSenior] = useState(false);
  const [skip, setSkip] = useState(0);
  const limit = 50;

  useEffect(() => {
    getAdminMe().then((me) => setIsSenior(me.role === "senior")).catch(() => {});
  }, []);

  async function loadUsers() {
    setLoading(true);
    setError("");
    try {
      const data = await listUsers(skip, limit);
      setUsers(data);
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

  async function handleSuspend(user: User) {
    setActioningId(user.id);
    try {
      await suspendUser(user.id);
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, is_active: false } : u));
    } catch (err: any) {
      setError(err.message || "Failed to suspend user.");
    } finally {
      setActioningId(null);
    }
  }

  async function handleActivate(user: User) {
    setActioningId(user.id);
    try {
      await activateUser(user.id);
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, is_active: true } : u));
    } catch (err: any) {
      setError(err.message || "Failed to activate user.");
    } finally {
      setActioningId(null);
    }
  }

  async function handleDelete(user: User) {
    const confirmed = window.confirm(
      `Permanently delete "${user.username}"? This cannot be undone.`
    );
    if (!confirmed) return;

    setActioningId(user.id);
    try {
      await deleteUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (err: any) {
      setError(err.message || "Failed to delete user.");
    } finally {
      setActioningId(null);
    }
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <h1 style={{ color: "#F0F4FF", fontSize: "clamp(20px, 4vw, 26px)", fontWeight: 800, marginBottom: 4 }}>
        Users
      </h1>
      <p style={{ color: "#3D4F72", fontSize: 14, marginBottom: 24 }}>
        View, suspend, or manage user accounts.
      </p>

      {error && (
        <div style={{
          padding: "12px 16px", background: "rgba(239,68,68,0.08)",
          border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10,
          color: "#EF4444", fontSize: 13, marginBottom: 20,
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ color: "#8B9CC4", fontSize: 14 }}>Loading users...</p>
      ) : users.length === 0 ? (
        <p style={{ color: "#8B9CC4", fontSize: 14 }}>No users found.</p>
      ) : (
        <div style={{
          background: "#0D1420",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 16,
          overflowX: "auto",
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {["Username", "Email", "Status", "Verified", "Last Login", "Last IP", "Joined", "Actions"].map((h) => (
                  <th key={h} style={{
                    textAlign: "left", padding: "14px 16px",
                    color: "#8B9CC4", fontSize: 12, fontWeight: 700,
                    textTransform: "uppercase", letterSpacing: 0.5,
                    whiteSpace: "nowrap",
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding: "14px 16px", color: "#F0F4FF", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>
                    {user.username}
                  </td>
                  <td style={{ padding: "14px 16px", color: "#8B9CC4", fontSize: 13, whiteSpace: "nowrap" }}>
                    {user.email}
                  </td>
                  <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                    <span style={{
                      padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700,
                      background: user.is_active ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                      color: user.is_active ? "#22C55E" : "#EF4444",
                      border: `1px solid ${user.is_active ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                    }}>
                      {user.is_active ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px", color: "#8B9CC4", fontSize: 13, whiteSpace: "nowrap" }}>
                    {user.is_verified ? "✓" : "—"}
                  </td>
                  <td style={{ padding: "14px 16px", color: "#8B9CC4", fontSize: 13, whiteSpace: "nowrap" }}>
                    {formatDate(user.last_login_at)}
                  </td>
                  <td style={{ padding: "14px 16px", color: "#8B9CC4", fontSize: 13, whiteSpace: "nowrap", fontFamily: "monospace" }}>
                    {user.last_login_ip || "—"}
                  </td>
                  <td style={{ padding: "14px 16px", color: "#8B9CC4", fontSize: 13, whiteSpace: "nowrap" }}>
                    {formatDate(user.created_at)}
                  </td>
                  <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      {user.is_active ? (
                        <button
                          onClick={() => handleSuspend(user)}
                          disabled={actioningId === user.id}
                          style={actionBtnStyle("#EF4444")}
                        >
                          Suspend
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivate(user)}
                          disabled={actioningId === user.id}
                          style={actionBtnStyle("#22C55E")}
                        >
                          Activate
                        </button>
                      )}
                      {isSenior && (
                        <button
                          onClick={() => handleDelete(user)}
                          disabled={actioningId === user.id}
                          style={actionBtnStyle("#8B9CC4")}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <button
          onClick={() => setSkip(Math.max(0, skip - limit))}
          disabled={skip === 0 || loading}
          style={pageBtnStyle}
        >
          ← Previous
        </button>
        <button
          onClick={() => setSkip(skip + limit)}
          disabled={users.length < limit || loading}
          style={pageBtnStyle}
        >
          Next →
        </button>
      </div>
    </div>
  );
}

function actionBtnStyle(color: string): React.CSSProperties {
  return {
    padding: "6px 12px",
    background: `${color}14`,
    border: `1px solid ${color}4D`,
    borderRadius: 8,
    color,
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "Inter, sans-serif",
  };
}

const pageBtnStyle: React.CSSProperties = {
  padding: "10px 18px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 10,
  color: "#8B9CC4",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "Inter, sans-serif",
};
