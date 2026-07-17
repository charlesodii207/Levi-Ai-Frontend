"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { listAdmins, createAdmin, blockAdmin, unblockAdmin, getAdminMe } from "@/app/lib/adminApi";

type AdminUser = {
  id: number;
  username: string;
  role: "senior" | "junior";
  status: "active" | "blocked";
  must_change_password: boolean;
  created_at: string;
  last_login_at: string | null;
  last_login_ip: string | null;
};

export default function AdminAdminsPage() {
  const router = useRouter();

  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [currentAdminId, setCurrentAdminId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actioningId, setActioningId] = useState<number | null>(null);

  // Create-admin form
  const [showForm, setShowForm] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"junior" | "senior">("junior");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");

  async function loadAdmins() {
    setLoading(true);
    setError("");
    try {
      const data = await listAdmins();
      setAdmins(data);
    } catch (err: any) {
      // A 403 here means a junior admin navigated to this URL directly —
      // the backend correctly refused, so send them back to the dashboard.
      if (err.message?.toLowerCase().includes("senior")) {
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
      if (me.role !== "senior") {
        router.push("/admin");
        return;
      }
      setCurrentAdminId(me.id);
      loadAdmins();
    }).catch(() => router.push("/admin/login"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!newUsername || !newPassword) {
      setFormError("Username and password are required.");
      return;
    }
    if (newPassword.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }

    setCreating(true);
    try {
      const newAdmin = await createAdmin(newUsername, newPassword, newRole);
      setAdmins((prev) => [newAdmin, ...prev]);
      setNewUsername("");
      setNewPassword("");
      setNewRole("junior");
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

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

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
            Create staff accounts and manage access.
          </p>
        </div>
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
            <div style={{ flex: "1 1 200px" }}>
              <label style={labelStyle}>Username</label>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                autoCapitalize="none"
                style={inputStyle}
              />
            </div>
            <div style={{ flex: "1 1 200px" }}>
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
              <label style={labelStyle}>Role</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as "junior" | "senior")}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                <option value="junior">Junior</option>
                <option value="senior">Senior</option>
              </select>
            </div>
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
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 680 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {["Username", "Role", "Status", "Last Login", "Last IP", "Created", "Actions"].map((h) => (
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
              {admins.map((admin) => (
                <tr key={admin.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding: "14px 16px", color: "#F0F4FF", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>
                    {admin.username}
                    {admin.id === currentAdminId && (
                      <span style={{ color: "#3D4F72", fontWeight: 500 }}> (you)</span>
                    )}
                  </td>
                  <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                    <span style={{
                      padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700,
                      background: admin.role === "senior" ? "rgba(212,175,55,0.12)" : "rgba(59,130,246,0.12)",
                      color: admin.role === "senior" ? "#D4AF37" : "#3B82F6",
                      border: `1px solid ${admin.role === "senior" ? "rgba(212,175,55,0.3)" : "rgba(59,130,246,0.3)"}`,
                      textTransform: "uppercase",
                    }}>
                      {admin.role}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
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
                  </td>
                  <td style={{ padding: "14px 16px", color: "#8B9CC4", fontSize: 13, whiteSpace: "nowrap" }}>
                    {formatDate(admin.last_login_at)}
                  </td>
                  <td style={{ padding: "14px 16px", color: "#8B9CC4", fontSize: 13, whiteSpace: "nowrap", fontFamily: "monospace" }}>
                    {admin.last_login_ip || "—"}
                  </td>
                  <td style={{ padding: "14px 16px", color: "#8B9CC4", fontSize: 13, whiteSpace: "nowrap" }}>
                    {formatDate(admin.created_at)}
                  </td>
                  <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                    {admin.id === currentAdminId ? (
                      <span style={{ color: "#3D4F72", fontSize: 12 }}>—</span>
                    ) : admin.status === "active" ? (
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
                  </td>
                </tr>
              ))}
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
  };
}
