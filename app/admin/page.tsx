"use client";

import { useEffect, useState } from "react";
import { getOverviewStats } from "@/app/lib/adminApi";

type Stats = {
  total_users: number;
  active_users: number;
  suspended_users: number;
  verified_users: number;
  unverified_users: number;
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await getOverviewStats();
        setStats(data);
      } catch (err: any) {
        setError(err.message || "Failed to load stats.");
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const cards = stats ? [
    { label: "Total Users", value: stats.total_users, color: "#3B82F6", icon: "👥" },
    { label: "Active Users", value: stats.active_users, color: "#22C55E", icon: "✅" },
    { label: "Suspended", value: stats.suspended_users, color: "#EF4444", icon: "⛔" },
    { label: "Verified", value: stats.verified_users, color: "#D4AF37", icon: "✔️" },
    { label: "Unverified", value: stats.unverified_users, color: "#8B9CC4", icon: "⏳" },
  ] : [];

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <h1 style={{ color: "#F0F4FF", fontSize: "clamp(20px, 4vw, 26px)", fontWeight: 800, marginBottom: 4 }}>
        Dashboard
      </h1>
      <p style={{ color: "#3D4F72", fontSize: 14, marginBottom: 28 }}>
        A quick look at how Levi AI is doing right now.
      </p>

      {loading && (
        <p style={{ color: "#8B9CC4", fontSize: 14 }}>Loading stats...</p>
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

      {stats && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: 16,
        }}>
          {cards.map((card) => (
            <div
              key={card.label}
              style={{
                background: "#0D1420",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 16,
                padding: "20px",
                boxSizing: "border-box",
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: `${card.color}1A`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, marginBottom: 14,
              }}>
                {card.icon}
              </div>
              <div style={{ color: "#F0F4FF", fontSize: 28, fontWeight: 800, marginBottom: 4 }}>
                {card.value.toLocaleString()}
              </div>
              <div style={{ color: "#8B9CC4", fontSize: 13, fontWeight: 500 }}>
                {card.label}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
