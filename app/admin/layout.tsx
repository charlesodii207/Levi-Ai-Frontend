"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getAdminToken, clearAdminToken, getAdminMe } from "@/app/lib/adminApi";
import { TIER_LABELS, TIER_COLORS, PLATFORM_ROLE_LABELS } from "@/app/lib/tiers";
import { IconDashboard, IconUsers, IconShield, IconLogs, IconLogOut, IconMenu, IconX, IconSettings, IconMail } from "@/app/components/Icons";

type AdminInfo = {
  id: number;
  username: string;
  tier: "owner" | "super_admin" | "admin" | "moderator";
  platform_role: string | null;
  status: string;
};

const PUBLIC_ADMIN_ROUTES = ["/admin/login"];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [admin, setAdmin] = useState<AdminInfo | null>(null);
  const [checking, setChecking] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);

  const isPublicRoute = PUBLIC_ADMIN_ROUTES.includes(pathname);
  const isChangePasswordRoute = pathname === "/admin/change-password";

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 768);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    async function checkAuth() {
      if (isPublicRoute) {
        setChecking(false);
        return;
      }
      const token = getAdminToken();
      if (!token) {
        router.push("/admin/login");
        return;
      }
      try {
        const me = await getAdminMe();
        setAdmin(me);
        if (me.must_change_password && !isChangePasswordRoute) {
          router.push("/admin/change-password");
          return;
        }
        if (!me.must_change_password && isChangePasswordRoute) {
          router.push("/admin");
          return;
        }
      } catch (err) {
        clearAdminToken();
        router.push("/admin/login");
        return;
      }
      setChecking(false);
    }
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (isPublicRoute || isChangePasswordRoute) return;
    const interval = setInterval(() => { getAdminMe().catch(() => {}); }, 60_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPublicRoute, isChangePasswordRoute]);

  function handleLogout() {
    clearAdminToken();
    router.push("/admin/login");
  }

  if (isPublicRoute || checking) return <>{children}</>;
  if (isChangePasswordRoute) return <>{children}</>;

  const tier = admin?.tier;

  const navItems = [
    { label: "Dashboard", href: "/admin", Icon: IconDashboard, visible: true },
    { label: "Users", href: "/admin/users", Icon: IconUsers, visible: true },
    { label: "Admins", href: "/admin/admins", Icon: IconShield, visible: tier !== "moderator" },
    { label: "Appeals", href: "/admin/appeals", Icon: IconMail, visible: tier !== "moderator" },
    { label: "Action Logs", href: "/admin/logs", Icon: IconLogs, visible: tier === "owner" || tier === "super_admin" },
    { label: "Settings", href: "/admin/settings", Icon: IconSettings, visible: true },
  ];
  const visibleNavItems = navItems.filter((i) => i.visible);

  const tierLabel = tier ? TIER_LABELS[tier] : "";
  const tierColor = tier ? TIER_COLORS[tier] : "#8B9CC4";
  const roleSubLabel = tier === "super_admin"
    ? "Executive"
    : tier === "admin" && admin?.platform_role
      ? PLATFORM_ROLE_LABELS[admin.platform_role]
      : null;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#080C14", fontFamily: "Inter, sans-serif" }}>
      {isMobile && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, height: 58,
          background: "rgba(13,20,32,0.9)", backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 18px", zIndex: 50,
        }}>
          <div style={{
            fontSize: 19, fontWeight: 900, letterSpacing: 4,
            background: "linear-gradient(135deg, #D4AF37, #F4D46B 40%, #3B82F6)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>LEVI</div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ background: "rgba(255,255,255,0.05)", border: "none", borderRadius: 8, color: "#F0F4FF", cursor: "pointer", padding: 8, display: "flex" }}
          >
            {mobileMenuOpen ? <IconX size={20} /> : <IconMenu size={20} />}
          </button>
        </div>
      )}

      {(!isMobile || mobileMenuOpen) && (
        <div style={{
          width: isMobile ? "100%" : 252,
          position: isMobile ? "fixed" : "sticky",
          top: isMobile ? 58 : 0, left: 0,
          height: isMobile ? "calc(100vh - 58px)" : "100vh",
          background: "#0B111C",
          borderRight: isMobile ? "none" : "1px solid rgba(255,255,255,0.06)",
          display: "flex", flexDirection: "column",
          padding: "26px 18px", boxSizing: "border-box",
          zIndex: 40, flexShrink: 0,
        }}>
          {!isMobile && (
            <div style={{
              fontSize: 23, fontWeight: 900, letterSpacing: 4,
              background: "linear-gradient(135deg, #D4AF37, #F4D46B 40%, #3B82F6)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              marginBottom: 28, paddingLeft: 6,
            }}>LEVI</div>
          )}

          {/* Profile card */}
          <div style={{
            padding: "14px", borderRadius: 14,
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.05)",
            marginBottom: 22,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10,
                background: `linear-gradient(135deg, ${tierColor}30, ${tierColor}10)`,
                border: `1px solid ${tierColor}40`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: tierColor, fontWeight: 800, fontSize: 14,
                flexShrink: 0, position: "relative",
              }}>
                {admin?.username?.[0]?.toUpperCase()}
                <span style={{
                  position: "absolute", bottom: -2, right: -2,
                  width: 9, height: 9, borderRadius: "50%",
                  background: "#22C55E", border: "2px solid #0B111C",
                }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: "#F0F4FF", fontSize: 13.5, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {admin?.username}
                </div>
                {roleSubLabel && (
                  <div style={{ color: "#5A6B8C", fontSize: 11.5 }}>{roleSubLabel}</div>
                )}
              </div>
            </div>
            <div style={{
              display: "inline-flex", alignItems: "center",
              padding: "3px 9px", borderRadius: 999,
              background: `${tierColor}18`, border: `1px solid ${tierColor}40`,
              color: tierColor, fontSize: 10.5, fontWeight: 700,
              textTransform: "uppercase", letterSpacing: 0.6,
            }}>
              {tierLabel}
            </div>
          </div>

          <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
            {visibleNavItems.map((item) => {
              const isActive = pathname === item.href;
              const isHovered = hoveredNav === item.href;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  onMouseEnter={() => setHoveredNav(item.href)}
                  onMouseLeave={() => setHoveredNav(null)}
                  style={{
                    display: "flex", alignItems: "center", gap: 11,
                    padding: "10px 12px", borderRadius: 10,
                    color: isActive ? "#F0F4FF" : isHovered ? "#C4D0EA" : "#7C8BAD",
                    background: isActive ? "rgba(59,130,246,0.14)" : isHovered ? "rgba(255,255,255,0.03)" : "transparent",
                    fontSize: 13.5, fontWeight: isActive ? 700 : 500,
                    textDecoration: "none",
                    transition: "all 0.15s ease",
                    position: "relative",
                  }}
                >
                  {isActive && (
                    <span style={{
                      position: "absolute", left: -18, top: "50%", transform: "translateY(-50%)",
                      width: 3, height: 18, borderRadius: 3, background: "#3B82F6",
                    }} />
                  )}
                  <item.Icon size={17} color={isActive ? "#3B82F6" : "currentColor"} />
                  {item.label}
                </a>
              );
            })}
          </nav>

          <button
            onClick={handleLogout}
            onMouseEnter={() => setHoveredNav("logout")}
            onMouseLeave={() => setHoveredNav(null)}
            style={{
              display: "flex", alignItems: "center", gap: 11,
              padding: "10px 12px", borderRadius: 10,
              background: hoveredNav === "logout" ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.05)",
              border: "1px solid rgba(239,68,68,0.15)",
              color: "#EF4444", fontSize: 13.5, fontWeight: 600,
              cursor: "pointer", marginTop: 14,
              fontFamily: "Inter, sans-serif", transition: "all 0.15s ease",
            }}
          >
            <IconLogOut size={16} />
            Log Out
          </button>
        </div>
      )}

      <div style={{
        flex: 1, minWidth: 0,
        marginTop: isMobile ? 58 : 0,
        padding: isMobile ? "22px 18px" : "36px 44px",
        boxSizing: "border-box",
        display: isMobile && mobileMenuOpen ? "none" : "block",
      }}>
        {children}
      </div>
    </div>
  );
}
