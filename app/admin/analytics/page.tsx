"use client";

import { useEffect, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Loader2, Users, MessageSquare, TrendingUp, DollarSign, RefreshCw } from "lucide-react";
import {
  getAnalyticsOverview,
  getAnalyticsGrowth,
  getAnalyticsMessageVolume,
  getAnalyticsModels,
  getAnalyticsModes,
  getAnalyticsSubscriptions,
  getAnalyticsHistory,
  runAnalyticsSnapshot,
} from "@/app/lib/adminApi";

const COLORS = ["#3B82F6", "#D4AF37", "#22c55e", "#8B9CC4", "#EF4444"];

const cardStyle: React.CSSProperties = {
  background: "rgba(13,20,32,0.8)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 16,
  padding: 20,
  backdropFilter: "blur(8px)",
};

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub?: string }) {
  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#8B9CC4", fontSize: 12, marginBottom: 10 }}>
        {icon} {label}
      </div>
      <div style={{ color: "#F0F4FF", fontSize: 26, fontWeight: 800 }}>{value}</div>
      {sub && <div style={{ color: "#3D4F72", fontSize: 11, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<any>(null);
  const [growth, setGrowth] = useState<any[]>([]);
  const [messageVolume, setMessageVolume] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [modes, setModes] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [snapshotRunning, setSnapshotRunning] = useState(false);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [ov, gr, mv, md, mo, sub, hist] = await Promise.all([
        getAnalyticsOverview(),
        getAnalyticsGrowth(30),
        getAnalyticsMessageVolume(30),
        getAnalyticsModels(),
        getAnalyticsModes(),
        getAnalyticsSubscriptions(),
        getAnalyticsHistory(30),
      ]);
      setOverview(ov);
      setGrowth(gr);
      setMessageVolume(mv);
      setModels(md);
      setModes(mo);
      setSubscriptions(sub);
      setHistory(hist);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleRunSnapshot() {
    setSnapshotRunning(true);
    try {
      await runAnalyticsSnapshot();
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Snapshot failed");
    } finally {
      setSnapshotRunning(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <Loader2 size={28} color="#3B82F6" className="animate-spin" />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ color: "#F0F4FF", fontSize: 22, fontWeight: 700, margin: 0 }}>Analytics</h1>
        <button
          onClick={handleRunSnapshot}
          disabled={snapshotRunning}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 14px", borderRadius: 10,
            background: "rgba(59,130,246,0.12)",
            border: "1px solid rgba(59,130,246,0.3)",
            color: "#3B82F6", fontSize: 12, fontWeight: 600,
            cursor: snapshotRunning ? "not-allowed" : "pointer",
            opacity: snapshotRunning ? 0.6 : 1,
          }}
        >
          {snapshotRunning ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          Run snapshot now
        </button>
      </div>

      {error && (
        <div style={{ padding: "10px 16px", borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#EF4444", fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Overview cards */}
      {overview && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
          <StatCard icon={<Users size={14} />} label="Total Users" value={overview.total_users} />
          <StatCard icon={<TrendingUp size={14} />} label="New Today" value={overview.new_users.today} sub={`${overview.new_users.last_7_days} this week`} />
          <StatCard icon={<Users size={14} />} label="Active Today" value={overview.active_users.today} sub="point-in-time" />
          <StatCard icon={<MessageSquare size={14} />} label="Total Messages" value={overview.total_messages} />
          {subscriptions && (
            <StatCard icon={<DollarSign size={14} />} label="Est. MRR" value={`$${subscriptions.estimated_mrr_usd}`} />
          )}
        </div>
      )}

      {/* Signups + Active users history */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={cardStyle}>
          <div style={{ color: "#8B9CC4", fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Signups (30 days)</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={growth}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: "#3D4F72", fontSize: 10 }} />
              <YAxis tick={{ fill: "#3D4F72", fontSize: 10 }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#0D1420", border: "1px solid rgba(255,255,255,0.1)", fontSize: 12 }} />
              <Line type="monotone" dataKey="signups" stroke="#3B82F6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={cardStyle}>
          <div style={{ color: "#8B9CC4", fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
            Active Users (history — since snapshot job started)
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: "#3D4F72", fontSize: 10 }} />
              <YAxis tick={{ fill: "#3D4F72", fontSize: 10 }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#0D1420", border: "1px solid rgba(255,255,255,0.1)", fontSize: 12 }} />
              <Line type="monotone" dataKey="active_users" stroke="#D4AF37" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          {history.length === 0 && (
            <div style={{ color: "#3D4F72", fontSize: 11, marginTop: 8 }}>
              No history yet — click "Run snapshot now" to record today's data point.
            </div>
          )}
        </div>
      </div>

      {/* Message volume */}
      <div style={cardStyle}>
        <div style={{ color: "#8B9CC4", fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Message Volume (30 days)</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={messageVolume}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fill: "#3D4F72", fontSize: 10 }} />
            <YAxis tick={{ fill: "#3D4F72", fontSize: 10 }} allowDecimals={false} />
            <Tooltip contentStyle={{ background: "#0D1420", border: "1px solid rgba(255,255,255,0.1)", fontSize: 12 }} />
            <Bar dataKey="messages" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Models + Modes + Subscriptions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        <div style={cardStyle}>
          <div style={{ color: "#8B9CC4", fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Model Usage</div>
          {models.length === 0 ? (
            <div style={{ color: "#3D4F72", fontSize: 11 }}>No data yet — only counts messages sent since tracking was added.</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={models} dataKey="count" nameKey="model" cx="50%" cy="50%" outerRadius={60}>
                  {models.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#0D1420", border: "1px solid rgba(255,255,255,0.1)", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11, color: "#8B9CC4" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={cardStyle}>
          <div style={{ color: "#8B9CC4", fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Mode Adoption</div>
          {modes.length === 0 ? (
            <div style={{ color: "#3D4F72", fontSize: 11 }}>No data yet — only counts messages sent since tracking was added.</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={modes} dataKey="count" nameKey="mode" cx="50%" cy="50%" outerRadius={60}>
                  {modes.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#0D1420", border: "1px solid rgba(255,255,255,0.1)", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11, color: "#8B9CC4" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={cardStyle}>
          <div style={{ color: "#8B9CC4", fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Subscription Tiers</div>
          {subscriptions && (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={Object.entries(subscriptions.tier_counts).map(([tier, count]) => ({ tier, count }))}
                  dataKey="count"
                  nameKey="tier"
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                >
                  {Object.keys(subscriptions.tier_counts).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#0D1420", border: "1px solid rgba(255,255,255,0.1)", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11, color: "#8B9CC4" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
