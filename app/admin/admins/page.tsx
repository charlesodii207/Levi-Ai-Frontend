"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  listAdmins, createAdmin, blockAdmin, unblockAdmin,
  deleteAdmin, changeAdminTier, resetAdminPassword, getAdminMe,
} from "@/app/lib/adminApi";
import { isOnline, OnlineDot } from "@/app/lib/onlineStatus";
import {
  TIER_LABELS, TIER_COLORS, PLATFORM_ROLE_LABELS, PLATFORM_ROLES,
  creatableTiersFor, assignableTiersFor,
} from "@/app/lib/tiers";
import { IconPlus, IconMoreVertical, IconBan, IconCheckCircle, IconTrash, IconArrowUpDown, IconSearch, IconLock } from "@/app/components/Icons";
import { ConfirmModal, PasswordRevealModal, useConfirm } from "@/app/components/ConfirmModal";

type AdminUser = {
  id: number;
  username: string;
  tier: "owner" | "super_admin" | "admin" | "moderator";
  platform_role: string | null;
  status: string | null;
  must_change_password: boolean;
  created_at: string;
  last_login_at: string | null;
  last_login_ip: string | null;
  last_active_at: string | null;
};

function canManage(actorTier: string, targetTier: string): boolean {
  if (actorTier === "owner") return targetTier !== "owner";
  if (actorTier === "super_admin") return targetTier === "admin" || targetTier === "moderator";
  if (actorTier === "admin") return targetTier === "moderator";
  return false;
}

function canDeleteAdmin(actorTier: string, targetTier: string): boolean {
  if (actorTier === "owner") return targetTier !== "owner";
  if (actorTier === "super_admin") return targetTier === "admin" || targetTier === "moderator";
  return false; // admin, moderator can never delete an admin account
}

function canResetPassword(actorTier: string, targetTier: string): boolean {
  if (actorTier === "owner") return targetTier !== "owner";
  if (actorTier === "super_admin") return targetTier === "super_admin" || targetTier === "admin" || targetTier === "moderator";
  return false;
}

export default function AdminAdminsPage() {
  const router = useRouter();
  const confirm = useConfirm();

  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; openUp: boolean }>({ top: 0, left: 0, openUp: false });
  const [tierPanelId, setTierPanelId] = useState<number | null>(null);
  const [pendingTier, setPendingTier] = useState<Record<number, string>>({});
  const [pendingDept, setPendingDept] = useState<Record<number, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [revealPassword, setRevealPassword] = useState<{ username: string; password: string } | null>(null);
  const [, forceTick] = useState(0);

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
      setAdmins(await listAdmins());
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
      if (me.tier === "moderator") { router.push("/admin"); return; }
      setCurrentAdmin(me);
      const options = creatableTiersFor(me.tier);
      if (options.length) setNewTier(options[options.length - 1]);
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
    if (!newUsername || !newPassword || !newTier) { setFormError("Username, password, and tier are required."); return; }
    if (newPassword.length < 8) { setFormError("Password must be at least 8 characters."); return; }
    if (newTier === "admin" && !newPlatformRole) { setFormError("Administrator accounts require a department."); return; }

    setCreating(true);
    try {
      const created = await createAdmin(newUsername, newPassword, newTier as any, newTier === "admin" ? newPlatformRole : null);
      setAdmins((prev) => [created, ...prev]);
      setNewUsername(""); setNewPassword(""); setNewPlatformRole(""); setShowForm(false);
    } catch (err: any) {
      setFormError(err.message || "Failed to create admin.");
    } finally {
      setCreating(false);
    }
  }

  function doBlock(admin: AdminUser) {
    setOpenMenuId(null);
    confirm.ask({
      title: "Block this admin?",
      message: `"${admin.username}" will lose access to the dashboard immediately.`,
      confirmLabel: "Block",
      danger: true,
      onConfirm: async () => {
        setActioningId(admin.id);
        try {
          await blockAdmin(admin.id);
          setAdmins((prev) => prev.map((a) => a.id === admin.id ? { ...a, status: "blocked" } : a));
        } catch (err: any) {
          setError(err.message || "Failed to block admin.");
        } finally {
          setActioningId(null);
        }
      },
    });
  }

  function doUnblock(admin: AdminUser) {
    setOpenMenuId(null);
    confirm.ask({
      title: "Unblock this admin?",
      message: `"${admin.username}" will regain access to the dashboard.`,
      confirmLabel: "Unblock",
      onConfirm: async () => {
        setActioningId(admin.id);
        try {
          await unblockAdmin(admin.id);
          setAdmins((prev) => prev.map((a) => a.id === admin.id ? { ...a, status: "active" } : a));
        } catch (err: any) {
          setError(err.message || "Failed to unblock admin.");
        } finally {
          setActioningId(null);
        }
      },
    });
  }

  function doDelete(admin: AdminUser) {
    setOpenMenuId(null);
    confirm.ask({
      title: "Delete this admin?",
      message: `"${admin.username}" will be permanently removed. This cannot be undone.`,
      confirmLabel: "Delete",
      danger: true,
      onConfirm: async () => {
        setActioningId(admin.id);
        try {
          await deleteAdmin(admin.id);
          setAdmins((prev) => prev.filter((a) => a.id !== admin.id));
        } catch (err: any) {
          setError(err.message || "Failed to delete admin.");
        } finally {
          setActioningId(null);
        }
      },
    });
  }

  function doResetPassword(admin: AdminUser) {
    setOpenMenuId(null);
    confirm.ask({
      title: "Reset this admin's password?",
      message: `A new temporary password will be generated for "${admin.username}". They'll be required to set their own on next login.`,
      confirmLabel: "Reset password",
      onConfirm: async () => {
        setActioningId(admin.id);
        try {
          const res = await resetAdminPassword(admin.id);
          setAdmins((prev) => prev.map((a) => a.id === admin.id ? { ...a, must_change_password: true } : a));
          setRevealPassword({ username: admin.username, password: res.temporary_password });
        } catch (err: any) {
          setError(err.message || "Failed to reset password.");
        } finally {
          setActioningId(null);
        }
      },
    });
  }

  function doChangeTier(admin: AdminUser) {
    const target = pendingTier[admin.id];
    if (!target || target === admin.tier) return;
    if (target === "admin" && !pendingDept[admin.id]) { setError("Select a department before promoting to Administrator."); return; }

    setOpenMenuId(null);
    confirm.ask({
      title: "Change tier?",
      message: `"${admin.username}" will move from ${TIER_LABELS[admin.tier]} to ${TIER_LABELS[target]}.`,
      confirmLabel: "Change tier",
      onConfirm: async () => {
        setActioningId(admin.id);
        try {
          await changeAdminTier(admin.id, target, target === "admin" ? pendingDept[admin.id] : null);
          setAdmins((prev) => prev.map((a) =>
            a.id === admin.id ? { ...a, tier: target as any, platform_role: target === "admin" ? pendingDept[admin.id] : null } : a
          ));
          setTierPanelId(null);
          setPendingTier((p) => { const n = { ...p }; delete n[admin.id]; return n; });
          setPendingDept((p) => { const n = { ...p }; delete n[admin.id]; return n; });
        } catch (err: any) {
          setError(err.message || "Failed to change tier.");
        } finally {
          setActioningId(null);
        }
      },
    });
  }

  function openAdminMenu(e: React.MouseEvent<HTMLButtonElement>, adminId: number) {
    if (openMenuId === adminId) { setOpenMenuId(null); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    const menuHeight = 180; // rough estimate, enough for the default 3-item menu
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < menuHeight;
    setMenuPos({
      top: openUp ? rect.top - 6 : rect.bottom + 6,
      left: Math.max(12, rect.right - 220),
      openUp,
    });
    setTierPanelId(null);
    setOpenMenuId(adminId);
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  const createOptions = currentAdmin ? creatableTiersFor(currentAdmin.tier) : [];

  const filterTabs: { key: string; label: string }[] = currentAdmin
    ? currentAdmin.tier === "owner" || currentAdmin.tier === "super_admin"
      ? [
          { key: "all", label: "All" },
          { key: "owner", label: "System Owner" },
          { key: "super_admin", label: "Super Admin" },
          { key: "admin", label: "Administrator" },
          { key: "moderator", label: "Moderator" },
        ]
      : [
          { key: "all", label: "All" },
          { key: "admin", label: "Administrator" },
          { key: "moderator", label: "Moderator" },
        ]
    : [];

  const filteredAdmins = admins.filter((a) => {
    const matchesTier = activeFilter === "all" || a.tier === activeFilter;
    const matchesSearch = a.username.toLowerCase().includes(searchQuery.trim().toLowerCase());
    return matchesTier && matchesSearch;
  });

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Backdrop to close any open row menu on outside click */}
      {openMenuId !== null && (
        <div onClick={() => setOpenMenuId(null)} style={{ position: "fixed", inset: 0, zIndex: 90 }} />
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 28 }}>
        <div>
          <h1 style={{ color: "#F0F4FF", fontSize: "clamp(20px, 4vw, 27px)", fontWeight: 800, marginBottom: 5, letterSpacing: -0.3 }}>
            Admins
          </h1>
          <p style={{ color: "#5A6B8C", fontSize: 14 }}>Manage staff accounts, tiers, and access.</p>
        </div>
        {createOptions.length > 0 && (
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "11px 18px",
              background: "linear-gradient(135deg, #0057FF, #3B82F6)",
              border: "none", borderRadius: 11,
              color: "white", fontSize: 13.5, fontWeight: 700,
              cursor: "pointer", whiteSpace: "nowrap",
              fontFamily: "Inter, sans-serif",
              boxShadow: "0 4px 16px rgba(0,87,255,0.25)",
            }}
          >
            <IconPlus size={15} /> New Admin
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleCreate} style={{
          background: "#0D1420", border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 18, padding: 22, marginBottom: 26,
        }}>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 14 }}>
            <div style={{ flex: "1 1 180px" }}>
              <label style={labelStyle}>Username</label>
              <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} autoCapitalize="none" style={inputStyle} />
            </div>
            <div style={{ flex: "1 1 180px" }}>
              <label style={labelStyle}>Temporary Password</label>
              <input type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={inputStyle} placeholder="They'll be forced to change it" />
            </div>
            <div style={{ flex: "1 1 140px" }}>
              <label style={labelStyle}>Tier</label>
              <select value={newTier} onChange={(e) => { setNewTier(e.target.value); setNewPlatformRole(""); }} style={{ ...inputStyle, cursor: "pointer" }}>
                {createOptions.map((t) => <option key={t} value={t}>{TIER_LABELS[t]}</option>)}
              </select>
            </div>
            {newTier === "admin" && (
              <div style={{ flex: "1 1 160px" }}>
                <label style={labelStyle}>Department</label>
                <select value={newPlatformRole} onChange={(e) => setNewPlatformRole(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                  <option value="">Select...</option>
                  {PLATFORM_ROLES.map((r) => <option key={r} value={r}>{PLATFORM_ROLE_LABELS[r]}</option>)}
                </select>
              </div>
            )}
          </div>

          {formError && (
            <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, color: "#EF4444", fontSize: 13, marginBottom: 14 }}>
              {formError}
            </div>
          )}

          <button type="submit" disabled={creating} style={{
            padding: "11px 20px",
            background: creating ? "rgba(255,255,255,0.04)" : "linear-gradient(135deg, #0057FF, #3B82F6)",
            border: "none", borderRadius: 10,
            color: creating ? "#3D4F72" : "white",
            fontSize: 13, fontWeight: 700,
            cursor: creating ? "not-allowed" : "pointer",
            fontFamily: "Inter, sans-serif",
          }}>
            {creating ? "Creating..." : "Create Admin"}
          </button>
        </form>
      )}

      {error && (
        <div style={{ padding: "12px 16px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, color: "#EF4444", fontSize: 13, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ color: "#8B9CC4", fontSize: 14 }}>Loading admins...</p>
      ) : (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {filterTabs.map((tab) => {
                const active = activeFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveFilter(tab.key)}
                    style={{
                      padding: "7px 14px", borderRadius: 999,
                      background: active ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${active ? "rgba(59,130,246,0.4)" : "rgba(255,255,255,0.07)"}`,
                      color: active ? "#3B82F6" : "#8B9CC4",
                      fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                      fontFamily: "Inter, sans-serif", whiteSpace: "nowrap",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div style={{ position: "relative", minWidth: 220, flex: "0 1 260px" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", display: "flex" }}>
                <IconSearch size={15} color="#5A6B8C" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by username..."
                style={{
                  width: "100%", padding: "9px 12px 9px 36px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 10, color: "#F0F4FF", fontSize: 13,
                  outline: "none", fontFamily: "Inter, sans-serif", boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {filteredAdmins.length === 0 ? (
            <div style={{ background: "#0D1420", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, padding: "48px 20px", textAlign: "center" }}>
              <p style={{ color: "#5A6B8C", fontSize: 14 }}>No admins match your search.</p>
            </div>
          ) : (
        <div style={{ background: "#0D1420", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, overflow: "visible" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 860 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["", "Username", "Tier", "Department", "Status", "Last Login", "Last IP", "Created", ""].map((h, i) => (
                    <th key={i} style={{ textAlign: "left", padding: "15px 16px", color: "#5A6B8C", fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredAdmins.map((admin) => {
                  const isSelf = admin.id === currentAdmin?.id;
                  const online = isOnline(admin.last_active_at);
                  const manageable = !isSelf && currentAdmin && canManage(currentAdmin.tier, admin.tier);
                  const deletable = !isSelf && currentAdmin && canDeleteAdmin(currentAdmin.tier, admin.tier);
                  const resettable = !isSelf && currentAdmin && canResetPassword(currentAdmin.tier, admin.tier);
                  const tierOptions = currentAdmin ? assignableTiersFor(currentAdmin.tier, admin.tier) : [];
                  const isMasked = admin.status === null;
                  const menuOpen = openMenuId === admin.id;

                  return (
                    <tr key={admin.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                      <td style={{ padding: "15px 8px 15px 16px" }}>
                        {isMasked ? <span style={{ color: "#3D4F72", fontSize: 12 }}>—</span> : <OnlineDot online={online} />}
                      </td>
                      <td style={{ padding: "15px 16px", color: "#F0F4FF", fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap" }}>
                        {admin.username}
                        {isSelf && <span style={{ color: "#5A6B8C", fontWeight: 500 }}> (you)</span>}
                      </td>
                      <td style={{ padding: "15px 16px", whiteSpace: "nowrap" }}>
                        <span style={{
                          padding: "3px 10px", borderRadius: 999, fontSize: 10.5, fontWeight: 700,
                          background: `${TIER_COLORS[admin.tier]}1A`, color: TIER_COLORS[admin.tier],
                          border: `1px solid ${TIER_COLORS[admin.tier]}40`, textTransform: "uppercase", letterSpacing: 0.4,
                        }}>
                          {TIER_LABELS[admin.tier]}
                        </span>
                      </td>
                      <td style={{ padding: "15px 16px", color: "#8B9CC4", fontSize: 13, whiteSpace: "nowrap" }}>
                        {admin.tier === "super_admin" ? "Executive" : admin.platform_role ? PLATFORM_ROLE_LABELS[admin.platform_role] : "—"}
                      </td>
                      <td style={{ padding: "15px 16px", whiteSpace: "nowrap" }}>
                        {isMasked ? <span style={{ color: "#3D4F72", fontSize: 12 }}>Hidden</span> : (
                          <>
                            <span style={{
                              padding: "3px 10px", borderRadius: 999, fontSize: 10.5, fontWeight: 700,
                              background: admin.status === "active" ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                              color: admin.status === "active" ? "#22C55E" : "#EF4444",
                              border: `1px solid ${admin.status === "active" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                            }}>
                              {admin.status === "active" ? "Active" : "Blocked"}
                            </span>
                            {admin.must_change_password && admin.status === "active" && (
                              <div style={{ color: "#5A6B8C", fontSize: 10.5, marginTop: 4 }}>Password not set</div>
                            )}
                          </>
                        )}
                      </td>
                      <td style={{ padding: "15px 16px", color: "#8B9CC4", fontSize: 13, whiteSpace: "nowrap" }}>{formatDate(admin.last_login_at)}</td>
                      <td style={{ padding: "15px 16px", color: "#8B9CC4", fontSize: 13, whiteSpace: "nowrap", fontFamily: "monospace" }}>
                        {isMasked ? "Hidden" : (admin.last_login_ip || "—")}
                      </td>
                      <td style={{ padding: "15px 16px", color: "#8B9CC4", fontSize: 13, whiteSpace: "nowrap" }}>{formatDate(admin.created_at)}</td>
                      <td style={{ padding: "15px 16px", textAlign: "right" }}>
                        {!manageable && !resettable ? (
                          <span style={{ color: "#3D4F72", fontSize: 12 }}>—</span>
                        ) : (
                          <>
                            <button
                              onClick={(e) => openAdminMenu(e, admin.id)}
                              disabled={actioningId === admin.id}
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
                                width: 220, background: "#141C2C",
                                border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12,
                                boxShadow: "0 12px 32px rgba(0,0,0,0.45)", zIndex: 100,
                                padding: 6, textAlign: "left",
                              }}>
                                {tierPanelId !== admin.id ? (
                                  <>
                                    {manageable && (
                                      admin.status === "active" ? (
                                        <MenuItem icon={<IconBan size={15} />} label="Block admin" color="#EF4444" onClick={() => doBlock(admin)} />
                                      ) : (
                                        <MenuItem icon={<IconCheckCircle size={15} />} label="Unblock admin" color="#22C55E" onClick={() => doUnblock(admin)} />
                                      )
                                    )}
                                    {resettable && (
                                      <MenuItem icon={<IconLock size={15} />} label="Reset password" color="#3B82F6" onClick={() => doResetPassword(admin)} />
                                    )}
                                    {manageable && tierOptions.length > 0 && (
                                      <MenuItem icon={<IconArrowUpDown size={15} />} label="Change tier" color="#3B82F6" onClick={() => setTierPanelId(admin.id)} />
                                    )}
                                    {deletable && (
                                      <MenuItem icon={<IconTrash size={15} />} label="Delete admin" color="#EF4444" onClick={() => doDelete(admin)} />
                                    )}
                                  </>
                                ) : (
                                  <div style={{ padding: 8 }}>
                                    <div style={{ color: "#8B9CC4", fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>Change tier</div>
                                    <select
                                      value={pendingTier[admin.id] || admin.tier}
                                      onChange={(e) => setPendingTier((p) => ({ ...p, [admin.id]: e.target.value }))}
                                      style={{ ...inputStyle, padding: "8px 10px", fontSize: 12.5, marginBottom: 8 }}
                                    >
                                      {tierOptions.map((t) => <option key={t} value={t}>{TIER_LABELS[t]}</option>)}
                                    </select>
                                    {pendingTier[admin.id] === "admin" && (
                                      <select
                                        value={pendingDept[admin.id] || ""}
                                        onChange={(e) => setPendingDept((p) => ({ ...p, [admin.id]: e.target.value }))}
                                        style={{ ...inputStyle, padding: "8px 10px", fontSize: 12.5, marginBottom: 8 }}
                                      >
                                        <option value="">Select department...</option>
                                        {PLATFORM_ROLES.map((r) => <option key={r} value={r}>{PLATFORM_ROLE_LABELS[r]}</option>)}
                                      </select>
                                    )}
                                    <div style={{ display: "flex", gap: 6 }}>
                                      <button onClick={() => setTierPanelId(null)} style={{ flex: 1, padding: "7px", background: "rgba(255,255,255,0.05)", border: "none", borderRadius: 8, color: "#8B9CC4", fontSize: 12, cursor: "pointer" }}>
                                        Back
                                      </button>
                                      <button
                                        onClick={() => doChangeTier(admin)}
                                        disabled={!pendingTier[admin.id] || pendingTier[admin.id] === admin.tier}
                                        style={{ flex: 1, padding: "7px", background: "#3B82F6", border: "none", borderRadius: 8, color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                                      >
                                        Apply
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </>
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
        </>
      )}

      <ConfirmModal {...confirm.props} />
      <PasswordRevealModal
        open={!!revealPassword}
        username={revealPassword?.username || ""}
        password={revealPassword?.password || ""}
        onClose={() => setRevealPassword(null)}
      />
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

const labelStyle: React.CSSProperties = { color: "#8B9CC4", fontSize: 12, fontWeight: 600, marginBottom: 6, display: "block" };

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px",
  background: "rgba(6,10,16,0.8)", border: "2px solid rgba(255,255,255,0.08)",
  borderRadius: 8, color: "#F0F4FF", fontSize: 13, outline: "none",
  fontFamily: "Inter, sans-serif", boxSizing: "border-box",
};
