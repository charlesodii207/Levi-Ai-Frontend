"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getAdminToken, clearAdminToken, getAdminMe } from "@/app/lib/adminApi";

type AdminInfo = {
  id: number;
  username: string;
  role: "senior" | "junior";
  status: string;
};

// Routes that must NOT be gated by the auth check below (or we'd get
// an infinite redirect loop: no token -> redirect to login -> layout
// re-checks token on the login page itself -> redirect to login...)
const PUBLIC_ADMIN_ROUTES = ["/admin/login"];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [admin, setAdmin] = useState<AdminInfo | null>(null);
  const [checking, setChecking] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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

        // Forced password change — send them there unless they're
        // already on that page.
        if (me.must_change_password && !isChangePasswordRoute) {
          router.push("/admin/change-password");
          return;
        }

        // Already changed their password but sitting on the change
        // password page — send them to the dashboard instead.
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

  function handleLogout() {
    clearAdminToken();
    router.push("/admin/login");
  }

  // Login page and the loading gap render with no chrome at all
  if (isPublicRoute || checking) {
    return <>{children}</>;
  }

  // Change-password page also renders without the sidebar — it's a
  // focused, single-task screen
  if (isChangePasswordRoute) {
    return <>{children}</>;
  }

  const navItems = [
    { label: "Dashboard", href: "/admin", icon: "📊", seniorOnly: false },
    { label: "Users", href: "/admin/users", icon: "👥", seniorOnly: false },
    { label: "Admins", href: "/admin/admins", icon: "🛡️", seniorOnly: true },
    { label: "Action Logs", href: "/admin/logs", icon: "📋", seniorOnly: true },
  ];

  const visibleNavItems = navItems.filter(
    (item) => !item.seniorOnly || admin?.role === "senior"
  );

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      background: "#080C14",
      fontFamily: "Inter, sans-serif",
    }}>
      {/* Mobile top bar */}
      {isMobile && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, height: 56,
          background: "#0D1420",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 16px", zIndex: 50,
        }}>
          <div style={{
            fontSize: 18, fontWeight: 900, letterSpacing: 4,
            background: "linear-gradient(135deg, #D4AF37, #F4D46B 40%, #3B82F6)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>LEVI</div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              background: "none", border: "none", color: "#F0F4FF",
              fontSize: 22, cursor: "pointer", padding: 4,
            }}
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>
      )}

      {/* Sidebar */}
      {(!isMobile || mobileMenuOpen) && (
        <div style={{
          width: isMobile ? "100%" : 240,
          position: isMobile ? "fixed" : "sticky",
          top: isMobile ? 56 : 0,
          left: 0,
          height: isMobile ? "calc(100vh - 56px)" : "100vh",
          background: "#0D1420",
          borderRight: isMobile ? "none" : "1px solid rgba(255,255,255,0.07)",
          display: "flex", flexDirection: "column",
          padding: "24px 16px",
          boxSizing: "border-box",
          zIndex: 40,
          flexShrink: 0,
        }}>
          {!isMobile && (
            <div style={{
              fontSize: 22, fontWeight: 900, letterSpacing: 4,
              background: "linear-gradient(135deg, #D4AF37, #F4D46B 40%, #3B82F6)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              backgroundClip: "text", marginBottom: 8, paddingLeft: 8,
            }}>LEVI</div>
          )}

          <div style={{ padding: "0 8px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 16 }}>
            <div style={{ color: "#F0F4FF", fontSize: 14, fontWeight: 700 }}>{admin?.username}</div>
            <div style={{
              display: "inline-block", marginTop: 6,
              padding: "3px 10px", borderRadius: 999,
              background: admin?.role === "senior" ? "rgba(212,175,55,0.12)" : "rgba(59,130,246,0.12)",
              border: `1px solid ${admin?.role === "senior" ? "rgba(212,175,55,0.3)" : "rgba(59,130,246,0.3)"}`,
              color: admin?.role === "senior" ? "#D4AF37" : "#3B82F6",
              fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5,
            }}>
              {admin?.role}
            </div>
          </div>

          <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
            {visibleNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "11px 12px", borderRadius: 10,
                    color: isActive ? "#F0F4FF" : "#8B9CC4",
                    background: isActive ? "rgba(59,130,246,0.12)" : "transparent",
                    fontSize: 14, fontWeight: isActive ? 700 : 500,
                    textDecoration: "none",
                    transition: "all 0.15s",
                  }}
                >
                  <span style={{ fontSize: 16 }}>{item.icon}</span>
                  {item.label}
                </a>
              );
            })}
          </nav>

          <button
            onClick={handleLogout}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "11px 12px", borderRadius: 10,
              background: "rgba(239,68,68,0.06)",
              border: "1px solid rgba(239,68,68,0.15)",
              color: "#EF4444",
              fontSize: 14, fontWeight: 600,
              cursor: "pointer",
              marginTop: 16,
              fontFamily: "Inter, sans-serif",
            }}
          >
            <span style={{ fontSize: 16 }}>🚪</span>
            Log Out
          </button>
        </div>
      )}

      {/* Main content */}
      <div style={{
        flex: 1,
        minWidth: 0,
        marginTop: isMobile ? 56 : 0,
        padding: isMobile ? "20px 16px" : "32px 40px",
        boxSizing: "border-box",
        display: isMobile && mobileMenuOpen ? "none" : "block",
      }}>
        {children}
      </div>
    </div>
  );
}
