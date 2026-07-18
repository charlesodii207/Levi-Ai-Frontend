const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://levi-ai-1ug2.onrender.com";

// ---------------------------------------------------------------------------
// Token helpers — admin tokens are stored separately from the regular
// user token so being logged in as a user and an admin at once (e.g. in
// two tabs) never conflicts.
// ---------------------------------------------------------------------------

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("admin_token");
}

export function setAdminToken(token: string) {
  localStorage.setItem("admin_token", token);
}

export function clearAdminToken() {
  localStorage.removeItem("admin_token");
}

// ---------------------------------------------------------------------------
// Core request wrapper
// ---------------------------------------------------------------------------

async function adminRequest(
  path: string,
  options: RequestInit = {}
) {
  const token = getAdminToken();

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    // no JSON body (e.g. some error responses)
  }

  if (!res.ok) {
    // 401/403 from a stale or invalid token — clear it so the layout
    // guard redirects back to login instead of looping on bad requests
    if (res.status === 401) {
      clearAdminToken();
    }
    throw new Error(data?.detail || "Something went wrong. Please try again.");
  }

  return data;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export function adminLogin(username: string, password: string) {
  return adminRequest("/admin/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export function adminChangePassword(current_password: string, new_password: string) {
  return adminRequest("/admin/change-password", {
    method: "POST",
    body: JSON.stringify({ current_password, new_password }),
  });
}

export function getAdminMe() {
  return adminRequest("/admin/me");
}

// ---------------------------------------------------------------------------
// Admin management
// ---------------------------------------------------------------------------

export function listAdmins() {
  return adminRequest("/admin/admins");
}

export function createAdmin(
  username: string,
  password: string,
  tier: "owner" | "super_admin" | "admin" | "moderator",
  platform_role?: string | null
) {
  return adminRequest("/admin/admins", {
    method: "POST",
    body: JSON.stringify({ username, password, tier, platform_role: platform_role || null }),
  });
}

export function changeAdminTier(adminId: number, newTier: string, platformRole?: string | null) {
  return adminRequest(`/admin/admins/${adminId}/change-tier`, {
    method: "POST",
    body: JSON.stringify({ new_tier: newTier, platform_role: platformRole || null }),
  });
}

export function blockAdmin(adminId: number) {
  return adminRequest(`/admin/admins/${adminId}/block`, { method: "POST" });
}

export function unblockAdmin(adminId: number) {
  return adminRequest(`/admin/admins/${adminId}/unblock`, { method: "POST" });
}

export function deleteAdmin(adminId: number) {
  return adminRequest(`/admin/admins/${adminId}`, { method: "DELETE" });
}

export function resetAdminPassword(adminId: number) {
  return adminRequest(`/admin/admins/${adminId}/reset-password`, { method: "POST" });
}

export function getActionLogs(limit = 100) {
  return adminRequest(`/admin/logs?limit=${limit}`);
}

// ---------------------------------------------------------------------------
// User management (shared — all tiers)
// ---------------------------------------------------------------------------

export function listUsers(skip = 0, limit = 50) {
  return adminRequest(`/admin/users?skip=${skip}&limit=${limit}`);
}

export function getUser(userId: number) {
  return adminRequest(`/admin/users/${userId}`);
}

export function suspendUser(userId: number) {
  return adminRequest(`/admin/users/${userId}/suspend`, { method: "POST" });
}

export function activateUser(userId: number) {
  return adminRequest(`/admin/users/${userId}/activate`, { method: "POST" });
}

export function deleteUser(userId: number) {
  return adminRequest(`/admin/users/${userId}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export function getOverviewStats() {
  return adminRequest("/admin/stats/overview");
}

// ---------------------------------------------------------------------------
// Suspension appeals
// ---------------------------------------------------------------------------

export function listAppeals(status?: string) {
  return adminRequest(`/admin/appeals${status ? `?status=${status}` : ""}`);
}

export function approveAppeal(appealId: number) {
  return adminRequest(`/admin/appeals/${appealId}/approve`, { method: "POST" });
}

export function rejectAppeal(appealId: number) {
  return adminRequest(`/admin/appeals/${appealId}/reject`, { method: "POST" });
}
