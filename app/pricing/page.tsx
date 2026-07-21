"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Loader2, Zap, Crown, Sparkles } from "lucide-react";
import { isLoggedIn } from "@/app/lib/auth";
import { getPlans, getBillingStatus, subscribeToPlan, type Plan } from "@/app/lib/api";

const TIER_META: Record<
  string,
  { icon: React.ReactNode; color: string; label: string }
> = {
  free: { icon: <Zap size={20} />, color: "#8B9CC4", label: "Free" },
  pro: { icon: <Sparkles size={20} />, color: "#3B82F6", label: "PRO" },
  prime: { icon: <Crown size={20} />, color: "#D4AF37", label: "Prime" },
};

export default function PricingPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentTier, setCurrentTier] = useState<string>("free");
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    Promise.all([getPlans(), getBillingStatus()])
      .then(([plansRes, statusRes]) => {
        setPlans(plansRes);
        setCurrentTier(statusRes.tier);
      })
      .catch(() => setError("Couldn't load plans. Try refreshing."))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleSubscribe(tier: string) {
    if (tier === "free" || tier === currentTier) return;
    setSubscribing(tier);
    setError(null);
    try {
      const res = await subscribeToPlan(tier as "pro" | "prime");
      window.location.href = res.authorization_url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start checkout");
      setSubscribing(null);
    }
  }

  if (loading) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          background: "#080C14",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Loader2 size={28} color="#3B82F6" className="animate-spin" />
      </div>
    );
  }

  return (
    <div style={{ width: "100vw", minHeight: "100vh", background: "#080C14", overflowY: "auto" }}>
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          background: `
            radial-gradient(ellipse 60% 40% at 50% 0%, rgba(0,87,255,0.08) 0%, transparent 70%),
            radial-gradient(ellipse 40% 30% at 80% 100%, rgba(212,175,55,0.05) 0%, transparent 60%)
          `,
        }}
      />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1000, margin: "0 auto", padding: "32px 24px 80px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
          <button
            onClick={() => router.push("/")}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#8B9CC4",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ArrowLeft size={17} />
          </button>
          <h1 style={{ color: "#F0F4FF", fontSize: 22, fontWeight: 700, margin: 0 }}>Plans & Pricing</h1>
        </div>

        <p style={{ color: "#3D4F72", fontSize: 14, marginBottom: 32, marginLeft: 50 }}>
          Prices shown in USD. Checkout converts to Naira at the live exchange rate.
        </p>

        {error && (
          <div
            style={{
              padding: "10px 16px",
              borderRadius: 10,
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.25)",
              color: "#EF4444",
              fontSize: 13,
              marginBottom: 24,
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 20,
          }}
        >
          {plans.map((plan) => {
            const meta = TIER_META[plan.name] ?? TIER_META.free;
            const isPaid = plan.name !== "free";
            const isPrime = plan.name === "prime";
            const isCurrent = plan.name === currentTier;

            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: "rgba(13,20,32,0.8)",
                  border: isCurrent
                    ? "1px solid rgba(34,197,94,0.35)"
                    : isPrime
                    ? "1px solid rgba(212,175,55,0.35)"
                    : "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 18,
                  padding: 28,
                  backdropFilter: "blur(8px)",
                  position: "relative",
                  boxShadow: isPrime && !isCurrent ? "0 0 40px rgba(212,175,55,0.08)" : "none",
                }}
              >
                {isCurrent && (
                  <div
                    style={{
                      position: "absolute",
                      top: -12,
                      left: 28,
                      padding: "3px 12px",
                      borderRadius: 20,
                      background: "linear-gradient(135deg, #22c55e, #16a34a)",
                      color: "#08140C",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    YOUR PLAN
                  </div>
                )}
                {!isCurrent && isPrime && (
                  <div
                    style={{
                      position: "absolute",
                      top: -12,
                      left: 28,
                      padding: "3px 12px",
                      borderRadius: 20,
                      background: "linear-gradient(135deg, #D4AF37, #F4D46B)",
                      color: "#080C14",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    BEST VALUE
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, color: meta.color }}>
                  {meta.icon}
                  <span style={{ color: "#F0F4FF", fontSize: 18, fontWeight: 700 }}>{meta.label}</span>
                </div>

                <div style={{ marginBottom: 6, display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ color: "#F0F4FF", fontSize: 32, fontWeight: 800 }}>
                    ${plan.price_usd.toFixed(0)}
                  </span>
                  <span style={{ color: "#3D4F72", fontSize: 13 }}>/month</span>
                </div>

                {plan.original_price_usd && plan.discount_percent && (
                  <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "#3D4F72", fontSize: 13, textDecoration: "line-through" }}>
                      ${plan.original_price_usd.toFixed(0)}/mo
                    </span>
                    <span
                      style={{
                        color: "#22c55e",
                        fontSize: 11,
                        fontWeight: 700,
                        background: "rgba(34,197,94,0.1)",
                        padding: "2px 8px",
                        borderRadius: 10,
                      }}
                    >
                      {plan.discount_percent}% off first year
                    </span>
                  </div>
                )}

                {!plan.original_price_usd && <div style={{ marginBottom: 20 }} />}

                <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "0 0 18px" }} />

                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", display: "flex", flexDirection: "column", gap: 10 }}>
                  <li style={{ display: "flex", alignItems: "center", gap: 8, color: "#8B9CC4", fontSize: 13 }}>
                    <Check size={14} color={meta.color} />
                    {plan.daily_limit ? `${plan.daily_limit} activities/day` : "Unlimited activities"}
                  </li>
                  <li style={{ display: "flex", alignItems: "center", gap: 8, color: "#8B9CC4", fontSize: 13 }}>
                    <Check size={14} color={meta.color} />
                    {plan.models.includes("nova") ? "Levi Swift + Levi Nova" : "Levi Swift"}
                  </li>
                  {plan.extras.map((extra) => (
                    <li key={extra} style={{ display: "flex", alignItems: "center", gap: 8, color: "#8B9CC4", fontSize: 13 }}>
                      <Check size={14} color={meta.color} />
                      {extra}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.name)}
                  disabled={!isPaid || isCurrent || subscribing === plan.name}
                  style={{
                    width: "100%",
                    padding: "11px 0",
                    borderRadius: 10,
                    border: isCurrent
                      ? "1px solid rgba(34,197,94,0.3)"
                      : isPrime
                      ? "1px solid rgba(212,175,55,0.4)"
                      : isPaid
                      ? "1px solid rgba(59,130,246,0.3)"
                      : "1px solid rgba(255,255,255,0.07)",
                    background: isCurrent
                      ? "rgba(34,197,94,0.08)"
                      : isPrime
                      ? "linear-gradient(135deg, rgba(212,175,55,0.15), rgba(244,212,107,0.1))"
                      : isPaid
                      ? "rgba(0,87,255,0.12)"
                      : "transparent",
                    color: isCurrent ? "#22c55e" : isPrime ? "#D4AF37" : isPaid ? "#3B82F6" : "#3D4F72",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: isPaid && !isCurrent ? "pointer" : "default",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  {subscribing === plan.name ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : isCurrent ? (
                    "Current Plan"
                  ) : isPaid ? (
                    "Subscribe"
                  ) : (
                    "Current default"
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
