"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { listAppeals, approveAppeal, rejectAppeal, getAdminMe } from "@/app/lib/adminApi";
import { IconCheckCircle, IconBan } from "@/app/components/Icons";
import { ConfirmModal, useConfirm } from "@/app/components/ConfirmModal";

type Appeal = {
  id: number;
  user_id: number;
  email: string;
  message: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  resolved_at: string | null;
  resolved_by: number | null;
};

const STATUS_COLORS: Record<string, string> = {
  pending: "#D4AF37",
  approved: "#22C55E",
  rejected: "#EF4444",
};

export default function AdminAppealsPage() {
  const router = useRouter();
  const confirm = useConfirm();

  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState("pending");

  async function loadAppeals(status?: string) {
    setLoading(true);
    setError("");
    try {
      setAppeals(await listAppeals(status === "all" ? undefined : status));
    } catch (err: any) {
      if (err.message?.toLowerCase().includes("permission") || err.message?.toLowerCase().includes("access")) {
        router.push("/admin");
        return;
      }
      setError(err.message || "Failed to load appeals.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getAdminMe().then((me) => {
      if (me.tier === "moderator") { router.push("/admin"); return; }
      loadAppeals(activeFilter);
    }).catch(() => router.push("/admin/login"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadAppeals(activeFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter]);

  function doApprove(appeal: Appeal) {
    confirm.ask({
      title: "Approve this appeal?",
      message: `"${appeal.email}" will be reactivated immediately and regain full access.`,
      confirmLabel: "Approve",
      onConfirm: async () => {
        setActioningId(appeal.id);
        try {
          await approveAppeal(appeal.id);
          setAppeals((prev) => activeFilter === "all"
            ? prev.map((a) => a.id === appeal.id ? { ...a, status: "approved" } : a)
            : prev.filter((a) => a.id !== appeal.id));
        } catch (err: any) {
          setError(err.message || "Failed to approve appeal.");
        } finally {
          setActioningId(null);
        }
      },
    });
  }

  function doReject(appeal: Appeal) {
    confirm.ask({
      title: "Reject this appeal?",
      message: `"${appeal.email}" will remain suspended.`,
      confirmLabel: "Reject",
      danger: true,
      onConfirm: async () => {
        setActioningId(appeal.id);
        try {
          await rejectAppeal(appeal.id);
          setAppeals((prev) => activeFilter === "all"
            ? prev.map((a) => a.id === appeal.id ? { ...a, status: "rejected" } : a)
            : prev.filter((a) => a.id !== appeal.id));
        } catch (err: any) {
          setError(err.message || "Failed to reject appeal.");
        } finally {
          setActioningId(null);
        }
      },
    });
  }

  function formatDateTime(dateStr: string | null) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  const tabs = [
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
    { key: "all", label: "All" },
  ];

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <h1 style={{ color: "#F0F4FF", fontSize: "clamp(20px, 4vw, 27px)", fontWeight: 800, marginBottom: 5, letterSpacing: -0.3 }}>
        Appeals
      </h1>
      <p style={{ color: "#5A6B8C", fontSize: 14, marginBottom: 24 }}>
        Suspended users requesting reinstatement.
      </p>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
        {tabs.map((tab) => {
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
                fontFamily: "Inter, sans-serif", transition: "all 0.15s ease",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {error && (
        <div style={{ padding: "12px 16px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, color: "#EF4444", fontSize: 13, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ color: "#8B9CC4", fontSize: 14 }}>Loading appeals...</p>
      ) : appeals.length === 0 ? (
        <div style={{ background: "#0D1420", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, padding: "48px 20px", textAlign: "center" }}>
          <p style={{ color: "#5A6B8C", fontSize: 14 }}>No {activeFilter !== "all" ? activeFilter : ""} appeals.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {appeals.map((appeal) => (
            <div
              key={appeal.id}
              style={{
                background: "#0D1420", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 16, padding: 20,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
                <div>
                  <div style={{ color: "#F0F4FF", fontSize: 14.5, fontWeight: 700, marginBottom: 3 }}>{appeal.email}</div>
                  <div style={{ color: "#5A6B8C", fontSize: 12 }}>Submitted {formatDateTime(appeal.created_at)}</div>
                </div>
                <span style={{
                  padding: "3px 10px", borderRadius: 999, fontSize: 10.5, fontWeight: 700,
                  background: `${STATUS_COLORS[appeal.status]}1A`, color: STATUS_COLORS[appeal.status],
                  border: `1px solid ${STATUS_COLORS[appeal.status]}40`, textTransform: "uppercase",
                }}>
                  {appeal.status}
                </span>
              </div>

              <p style={{ color: "#8B9CC4", fontSize: 13.5, lineHeight: 1.6, marginBottom: appeal.status === "pending" ? 16 : 0, whiteSpace: "pre-wrap" }}>
                {appeal.message}
              </p>

              {appeal.status === "pending" && (
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={() => doApprove(appeal)}
                    disabled={actioningId === appeal.id}
                    style={{
                      display: "flex", alignItems: "center", gap: 7,
                      padding: "8px 14px", background: "rgba(34,197,94,0.12)",
                      border: "1px solid rgba(34,197,94,0.3)", borderRadius: 9,
                      color: "#22C55E", fontSize: 12.5, fontWeight: 700, cursor: "pointer",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    <IconCheckCircle size={14} /> Approve
                  </button>
                  <button
                    onClick={() => doReject(appeal)}
                    disabled={actioningId === appeal.id}
                    style={{
                      display: "flex", alignItems: "center", gap: 7,
                      padding: "8px 14px", background: "rgba(239,68,68,0.08)",
                      border: "1px solid rgba(239,68,68,0.25)", borderRadius: 9,
                      color: "#EF4444", fontSize: 12.5, fontWeight: 700, cursor: "pointer",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    <IconBan size={14} /> Reject
                  </button>
                </div>
              )}

              {appeal.status !== "pending" && appeal.resolved_at && (
                <div style={{ color: "#3D4F72", fontSize: 11.5, marginTop: 10 }}>
                  Resolved {formatDateTime(appeal.resolved_at)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmModal {...confirm.props} />
    </div>
  );
}
