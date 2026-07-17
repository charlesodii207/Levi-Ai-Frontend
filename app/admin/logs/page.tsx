"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getActionLogs, getAdminMe } from "@/app/lib/adminApi";

type LogEntry = {
  id: number;
  admin_id: number;
  action: string;
  target_type: string | null;
  target_id: number | null;
  details: string | null;
  ip_address: string | null;
  created_at: string;
};

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  created_admin: { label: "Created admin", color: "#3B82F6" },
  changed_admin_tier: { label: "Changed admin tier", color: "#D4AF37" },
  blocked_admin: { label: "Blocked admin", color: "#EF4444" },
  unblocked_admin: { label: "Unblocked admin", color: "#22C55E" },
  deleted_admin: { label: "Deleted admin", color: "#EF4444" },
  changed_own_password: { label: "Changed own password", color: "#8B9CC4" },
  suspended_user: { label: "Suspended user", color: "#EF4444" },
  activated_user: { label: "Activated user", color: "#22C55E" },
  deleted_user: { label: "Deleted user", color: "#EF4444" },
};

const ALLOWED_TIERS = ["owner", "super_admin"];

export default function AdminLogsPage() {
  const router = useRouter();

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getAdminMe().then((me) => {
      if (!ALLOWED_TIERS.includes(me.tier)) {
        router.push("/admin");
        return;
      }
      loadLogs();
    }).catch(() => router.push("/admin/login"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadLogs() {
    setLoading(true);
    setError("");
    try {
      const data = await getActionLogs(200);
      setLogs(data);
    } catch (err: any) {
      if (err.message?.toLowerCase().includes("permission") || err.message?.toLowerCase().includes("access")) {
        router.push("/admin");
        return;
      }
      setError(err.message || "Failed to load logs.");
    } finally {
      setLoading(false);
    }
  }

  function formatDateTime(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleString(undefined, {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  }

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <h1 style={{ color: "#F0F4FF", fontSize: "clamp(20px, 4vw, 26px)", fontWeight: 800, marginBottom: 4 }}>
        Action Logs
      </h1>
      <p style={{ color: "#3D4F72", fontSize: 14, marginBottom: 24 }}>
        Every action taken by an admin, most recent first.
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
        <p style={{ color: "#8B9CC4", fontSize: 14 }}>Loading logs...</p>
      ) : logs.length === 0 ? (
        <p style={{ color: "#8B9CC4", fontSize: 14 }}>No actions logged yet.</p>
      ) : (
        <div style={{
          background: "#0D1420",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 16,
          overflowX: "auto",
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {["Admin ID", "Action", "Target", "Details", "IP", "When"].map((h) => (
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
              {logs.map((log) => {
                const meta = ACTION_LABELS[log.action] || { label: log.action, color: "#8B9CC4" };
                return (
                  <tr key={log.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "14px 16px", color: "#8B9CC4", fontSize: 13, whiteSpace: "nowrap" }}>
                      #{log.admin_id}
                    </td>
                    <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                      <span style={{
                        padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700,
                        background: `${meta.color}1F`,
                        color: meta.color,
                        border: `1px solid ${meta.color}4D`,
                      }}>
                        {meta.label}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", color: "#8B9CC4", fontSize: 13, whiteSpace: "nowrap" }}>
                      {log.target_type ? `${log.target_type} #${log.target_id}` : "—"}
                    </td>
                    <td style={{ padding: "14px 16px", color: "#8B9CC4", fontSize: 13 }}>
                      {log.details || "—"}
                    </td>
                    <td style={{ padding: "14px 16px", color: "#8B9CC4", fontSize: 13, whiteSpace: "nowrap", fontFamily: "monospace" }}>
                      {log.ip_address || "—"}
                    </td>
                    <td style={{ padding: "14px 16px", color: "#8B9CC4", fontSize: 13, whiteSpace: "nowrap" }}>
                      {formatDateTime(log.created_at)}
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
