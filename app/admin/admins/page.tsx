"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  listAdmins, createAdmin, blockAdmin, unblockAdmin,
  deleteAdmin, changeAdminTier, getAdminMe,
} from "@/app/lib/adminApi";
import { isOnline, OnlineDot } from "@/app/lib/onlineStatus";
import {
  TIER_LABELS, TIER_COLORS, PLATFORM_ROLE_LABELS, PLATFORM_ROLES,
  creatableTiersFor, assignableTiersFor,
} from "@/app/lib/tiers";

type AdminUser = {
  id: number;
  username: string;
  tier: "owner" | "super_admin" | "admin" | "moderator";
  platform_role: string | null;
  status: string | null;           // null when masked (Tier 3 viewing a peer)
  must_change_password: boolean;
  created_at: string;
  last_login_at: string | null;
  last_login_ip: string | null;    // null when masked
  last_active_at: string | null;   // null when masked
};

// Mirrors app/core/tiers.py can_manage() — used only to decide which
// buttons to show. The backend is the real enforcement; this just
// keeps the UI from offering actions that would be rejected anyway.
function canManage(actorTier: string, targetTier: string): boolean {
  if (actorTier === "owner") return targetTier !== "owner";
  if (actorTier === "super_admin") return targetTier === "admin" || targetTier === "moderator";
  if (actorTier === "admin") return targetTier === "moderator";
  return false;
}

export default function AdminAdminsPage() {
  const router = useRouter();

  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [pendingTier, setPendingTier] = useState<Record<number, string>>({});
  const [, forceTick] = useState(0);

  // Create-admin form
  const [showForm, setShowForm] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newTier, setNewTier] = useState("");
  const [newPlatformRole, setNewPlatformRole] = useState("");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");

  async function loadAdmins() {
    setLoading(true);
    setError("");
    try {
      const data = await listAdmins();
      setAdmins(data);
    } catch (err: any) {
      if (err.message?.toLowerCase().includes("permission") || err.message?.toLowerCase().includes("access")) {
        router.push("/admin");
        return;
      }
      setError(err.message || "Failed to load admins.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getAdminMe().then((me) => {
      if (me.tier === "moderator") {
        router.push("/admin");
        return;
      }
      setCurrentAdmin(me);
      const options = creatableTiersFor(me.tier);
      if (options.length) setNewTier(options[options.length - 1]); // default to lowest tier they can create
      loadAdmins();
    }).catch(() => router.push("/admin/login"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const interval = setInterval(() => forceTick((t) => t + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!newUsername || !newPassword || !newTier) {
      setFormError("Username, password, and tier are required.");
      return;
    }
    if (newPassword.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }
    if (newTier === "admin" && !newPlatformRole) {
      setFormError("Administrator accounts require a department (platform role).");
      return;
    }

    setCreating(true);
    try {
      const created = await createAdmin(
        newUsername, newPassword, newTier as any,
        newTier === "admin" ? newPlatformRole : null
      );
      setAdmins((prev) => [created, ...prev]);
      setNewUsername("");
      setNewPassword("");
      setNewPlatformRole("");
      setShowForm(false);
    } catch (err: any) {
      setFormError(err.message || "Failed to create admin.");
    } finally {
      setCreating(false);
    }
  }

  async function handleBlock(admin: AdminUser) {
    setActioningId(admin.id);
    try {
      await blockAdmin(admin.id);
      setAdmins((prev) => prev.map((a) => a.id === admin.id ? { ...a, status: "blocked" } : a));
    } catch (err: any) {
      setError(err.message || "Failed to block admin.");
    } finally {
      setActioningId(null);
    }
  }

  async function handleUnblock(admin: AdminUser) {
    setActioningId(admin.id);
    try {
      await unblockAdmin(admin.id);
      setAdmins((prev) => prev.map((a) => a.id === admin.id ? { ...a, status: "active" } : a));
    } catch (err: any) {
      setError(err.message || "Failed to unblock admin.");
    } finally {
      setActioningId(null);
    }
  }

  async function handleDelete(admin: AdminUser) {
    const confirmed = window.confirm(
      `Permanently delete "${admin.username}"? This cannot be undone.`
    );
    if (!confirmed) return;

    setActioningId(admin.id);
    try {
      await deleteAdmin(admin.id);
      setAdmins((prev) => prev.filter((a) => a.id !== admin.id));
    } catch (err: any) {
      setError(err.message || "Failed to delete admin.");
    } finally {
      setActioningId(null);
    }
  }

  async function handleApplyTierChange(admin: AdminUser) {
    const target = pendingTier[admin.id];
    if (!target || target === admin.tier) return;

    const confirmed = window.confirm(
      `Change "${admin.username}" from ${TIER_LABELS[admin.tier]} to ${TIER_LABELS[target]}?`
    );
    if (!confirmed) return;

    setActioningId(admin.id);
    try {
      await changeAdminTier(admin.id, target);
      setAdmins((prev) => prev.map((a) =>
        a.id === admin.id
          ? { ...a, tier: target as any, platform_role: target === "admin" ? a.platform_role : null }
          : a
      ));
      setPendingTier((prev) => {
        const next = { ...prev };
        delete next[admin.id];
        return next;
      });
    } catch (err: any) {
      setError(err.message || "Failed to change tier.");
    } finally {
      setActioningId(null);
    }
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  const createOptions = currentAdmin ? creatableTiersFor(currentAdmin.tier) : [];

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        flexWrap: "wrap", gap: 12, marginBottom: 24,
      }}>
        <div>
          <h1 style={{ color: "#F0F4FF", fontSize: "clamp(20px, 4vw, 26px)", fontWeight: 800, marginBottom: 4 }}>
            Admins
          </h1>
          <p style={{ color: "#3D4F72", fontSize: 14 }}>
            Manage staff accounts, tiers, and access.
          </p>
        </div>
        {createOptions.length > 0 && (
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              padding: "11px 18px",
              background: "linear-gradient(135deg, #0057FF, #3B82F6)",
              border: "none", borderRadius: 10,
              color: "white", fontSize: 13, fontWeight: 700,
              cursor: "pointer", whiteSpace: "nowrap",
              fontFamily: "Inter, sans-serif",
            }}
          >
            {showForm ? "Cancel" : "+ New Admin"}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleCreate} style={{
          background: "#0D1420",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 16,
          padding: 20,
          marginBottom: 24,
        }}>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 14 }}>
            <div style={{ flex: "1 1 180px" }}>
              <label style={labelStyle}>Username</label>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                autoCapitalize="none"
                style={inputStyle}
              />
            </div>
            <div style={{ flex: "1 1 180px" }}>
              <label style={labelStyle}>Temporary Password</label>
              <input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={inputStyle}
                placeholder="They'll be forced to change it"
              />
            </div>
            <div style={{ flex: "1 1 140px" }}>
              <label style={labelStyle}>Tier</label>
              <select
                value={newTier}
                onChange={(e) => { setNewTier(e.target.value); setNewPlatformRole(""); }}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                {createOptions.map((t) => (
                  <option key={t} value={t}>{TIER_LABELS[t]}</option>
                ))}
              </select>
            </div>
            {newTier === "admin" && (
              <div style={{ flex: "1 1 160px" }}>
                <label style={labelStyle}>Department</label>
                <select
                  value={newPlatformRole}
                  onChange={(e) => setNewPlatformRole(e.target.value)}
                  style={{ ...inputStyle, cursor: "pointer" }}
                >
                  <option value="">Select...</option>
                  {PLATFORM_ROLES.map((r) => (
                    <option key={r} value={r}>{PLATFORM_ROLE_LABELS[r]}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {formError && (
            <div style={{
              padding: "10px 14px", background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10,
              color: "#EF4444", fontSize: 13, marginBottom: 14,
            }}>
              {formError}
            </div>
          )}

          <button
            type="submit"
            disabled={creating}
            style={{
              padding: "11px 20px",
              background: creating ? "rgba(255,255,255,0.04)" : "linear-gradient(135deg, #0057FF, #3B82F6)",
              border: "none", borderRadius: 10,
              color: creating ? "#3D4F72" : "white",
              fontSize: 13, fontWeight: 700,
              cursor: creating ? "not-allowed" : "pointer",
              fontFamily: "Inter, sans-serif",
            }}
          >
            {creating ? "Creating..." : "Create Admin"}
          </button>
        </form>
      )}

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
        <p style={{ color: "#8B9CC4", fontSize: 14 }}>Loading admins...</p>
      ) : (
        <div style={{
          background: "#0D1420",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 16,
          overflowX: "auto",
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 920 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {["", "Username", "Tier", "Department", "Status", "Last Login", "Last IP", "Created", "Actions"].map((h, i) => (
                  <th key={i} style={{
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
              {admins.map((admin) => {
                const isSelf = admin.id === currentAdmin?.id;
                const online = isOnline(admin.last_active_at);
                const manageable = !isSelf && currentAdmin && canManage(currentAdmin.tier, admin.tier);
                const tierOptions = currentAdmin ? assignableTiersFor(currentAdmin.tier, admin.tier) : [];
                const isMasked = admin.status === null;

                return (
                  <tr key={admin.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "14px 8px 14px 16px" }}>
                      {isMasked ? (
                        <span style={{ color: "#3D4F72", fontSize: 12 }}>—</span>
                      ) : (
                        <OnlineDot online={online} />
                      )}
                    </td>
                    <td style={{ padding: "14px 16px", color: "#F0F4FF", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>
                      {admin.username}
                      {isSelf && <span style={{ color: "#3D4F72", fontWeight: 500 }}> (you)</span>}
                    </td>
                    <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                      <span style={{
                        padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700,
                        background: `${TIER_COLORS[admin.tier]}1F`,
                        color: TIER_COLORS[admin.tier],
                        border: `1px solid ${TIER_COLORS[admin.tier]}4D`,
                        textTransform: "uppercase",
                      }}>
                        {TIER_LABELS[admin.tier]}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", color: "#8B9CC4", fontSize: 13, whiteSpace: "nowrap" }}>
                      {admin.tier === "super_admin" ? "Executive" : admin.platform_role ? PLATFORM_ROLE_LABELS[admin.platform_role] : "—"}
                    </td>
                    <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                      {isMasked ? (
                        <span style={{ color: "#3D4F72", fontSize: 12 }}>Hidden</span>
                      ) : (
                        <>
                          <span style={{
                            padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700,
                            background: admin.status === "active" ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                            color: admin.status === "active" ? "#22C55E" : "#EF4444",
                            border: `1px solid ${admin.status === "active" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                          }}>
                            {admin.status === "active" ? "Active" : "Blocked"}
                          </span>
                          {admin.must_change_password && admin.status === "active" && (
                            <div style={{ color: "#3D4F72", fontSize: 11, marginTop: 4 }}>Password not set</div>
                          )}
                        </>
                      )}
                    </td>
                    <td style={{ padding: "14px 16px", color: "#8B9CC4", fontSize: 13, whiteSpace: "nowrap" }}>
                      {formatDate(admin.last_login_at)}
                    </td>
                    <td style={{ padding: "14px 16px", color: "#8B9CC4", fontSize: 13, whiteSpace: "nowrap", fontFamily: "monospace" }}>
                      {isMasked ? "Hidden" : (admin.last_login_ip || "—")}
                    </td>
                    <td style={{ padding: "14px 16px", color: "#8B9CC4", fontSize: 13, whiteSpace: "nowrap" }}>
                      {formatDate(admin.created_at)}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      {!manageable ? (
                        <span style={{ color: "#3D4F72", fontSize: 12 }}>—</span>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 180 }}>
                          <div style={{ display: "flex", gap: 8 }}>
                            {admin.status === "active" ? (
                              <button
                                onClick={() => handleBlock(admin)}
                                disabled={actioningId === admin.id}
                                style={actionBtnStyle("#EF4444")}
                              >
                                Block
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUnblock(admin)}
                                disabled={actioningId === admin.id}
                                style={actionBtnStyle("#22C55E")}
                              >
                                Unblock
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(admin)}
                              disabled={actioningId === admin.id}
                              style={actionBtnStyle("#8B9CC4")}
                            >
                              Delete
                            </button>
                          </div>
                          {tierOptions.length > 0 && (
                            <div style={{ display: "flex", gap: 6 }}>
                              <select
                                value={pendingTier[admin.id] || admin.tier}
                                onChange={(e) => setPendingTier((prev) => ({ ...prev, [admin.id]: e.target.value }))}
                                style={{
                                  ...inputStyle, padding: "5px 8px", fontSize: 11,
                                  cursor: "pointer", width: "auto", flex: 1,
                                }}
                              >
                                {tierOptions.map((t) => (
                                  <option key={t} value={t}>{TIER_LABELS[t]}</option>
                                ))}
                              </select>
                              {pendingTier[admin.id] && pendingTier[admin.id] !== admin.tier && (
                                <button
                                  onClick={() => handleApplyTierChange(admin)}
                                  disabled={actioningId === admin.id}
                                  style={actionBtnStyle("#3B82F6")}
                                >
                                  Apply
                                </button>
                              )}
                            </div>
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
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  color: "#8B9CC4", fontSize: 12, fontWeight: 600, marginBottom: 6, display: "block",
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px",
  background: "rgba(6,10,16,0.8)",
  border: "2px solid rgba(255,255,255,0.08)",
  borderRadius: 8,
  color: "#F0F4FF",
  fontSize: 13,
  outline: "none",
  fontFamily: "Inter, sans-serif",
  boxSizing: "border-box",
};

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
    whiteSpace: "nowrap",
  };
}
