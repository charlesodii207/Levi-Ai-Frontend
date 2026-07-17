export const TIER_LABELS: Record<string, string> = {
  owner: "System Owner",
  super_admin: "Super Admin",
  admin: "Administrator",
  moderator: "Moderator",
};

export const TIER_RANK: Record<string, number> = {
  owner: 1,
  super_admin: 2,
  admin: 3,
  moderator: 4,
};

export const TIER_COLORS: Record<string, string> = {
  owner: "#D4AF37",       // gold
  super_admin: "#3B82F6", // blue
  admin: "#22C55E",       // green
  moderator: "#8B9CC4",   // muted gray-blue
};

export const PLATFORM_ROLE_LABELS: Record<string, string> = {
  technical: "Technical",
  operations: "Operations",
  finance: "Finance",
  analytics: "Analytics",
  support: "Support",
  communications: "Communications",
};

export const PLATFORM_ROLES = Object.keys(PLATFORM_ROLE_LABELS);

/** Tiers that a "Create Admin" form should offer, given the actor's own tier. */
export function creatableTiersFor(actorTier: string): string[] {
  if (actorTier === "owner") return ["super_admin", "admin", "moderator"];
  if (actorTier === "super_admin") return ["admin", "moderator"];
  return [];
}

/** Which tiers a promote/demote dropdown should offer for a given target, by actor tier. */
export function assignableTiersFor(actorTier: string, targetTier: string): string[] {
  if (actorTier === "owner" && targetTier !== "owner") {
    return ["super_admin", "admin", "moderator"];
  }
  if (actorTier === "super_admin" && (targetTier === "admin" || targetTier === "moderator")) {
    return ["admin", "moderator"];
  }
  return [];
}