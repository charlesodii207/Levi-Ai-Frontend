"use client";

import { useEffect, useState } from "react";
import { getOverviewStats, getAdminMe } from "@/app/lib/adminApi";
import { IconUsers, IconCheckCircle, IconBan, IconShield, IconClock } from "@/app/components/Icons";

type Stats = {
  total_users: number;
  active_users: number;
  suspended_users: number;
  verified_users: number;
  unverified_users: number;
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminMe().then((me) => setUsername(me.username)).catch(() => {});
    getOverviewStats()
      .then(setStats)
      .catch((err) => setError(err.message || "Failed to load stats."))
      .finally(() => setLoading(false));
  }, []);

  const cards = stats ? [
    { label: "Total Users", value: stats.total_users, color: "#3B82F6", Icon: IconUsers },
    { label: "Active", value: stats.active_users, color: "#22C55E", Icon: IconCheckCircle },
    { label: "Suspended", value: stats.suspended_users, color: "#EF4444", Icon: IconBan },
    { label: "Verified", value: stats.verified_users, color: "#D4AF37", Icon: IconShield },
    { label: "Unverified", value: stats.unverified_users, color: "#8B9CC4", Icon: IconClock },
  ] : [];

  const greeting = getGreeting();

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <h1 style={{ color: "#F0F4FF", fontSize: "clamp(20px, 4vw, 27px)", fontWeight: 800, marginBottom: 5, letterSpacing: -0.3 }}>
        {greeting}{username ? `, ${username}` : ""}
      </h1>
      <p style={{ color: "#5A6B8C", fontSize: 14, marginBottom: 30 }}>
        Here's what's happening with Levi AI right now.
      </p>

      {loading && (
        <p style={{ color: "#8B9CC4", fontSize: 14 }}>Loading stats...</p>
      )}

      {error && (
        <div style={{ padding: "12px 16px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, color: "#EF4444", fontSize: 13, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 16 }}>
          {cards.map((card, i) => (
            <div
              key={card.label}
              style={{
                background: "#0D1420",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 18,
                padding: "22px",
                boxSizing: "border-box",
                transition: "border-color 0.2s ease, transform 0.2s ease",
                animation: `levi-card-in 0.35s ease-out ${i * 0.05}s both`,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${card.color}40`; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}
            >
              <div style={{
                width: 42, height: 42, borderRadius: 12,
                background: `linear-gradient(135deg, ${card.color}30, ${card.color}10)`,
                border: `1px solid ${card.color}30`,
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 16,
              }}>
                <card.Icon size={19} color={card.color} />
              </div>
              <div style={{ color: "#F0F4FF", fontSize: 30, fontWeight: 800, marginBottom: 4, letterSpacing: -0.5 }}>
                {card.value.toLocaleString()}
              </div>
              <div style={{ color: "#5A6B8C", fontSize: 13, fontWeight: 500 }}>
                {card.label}
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes levi-card-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
