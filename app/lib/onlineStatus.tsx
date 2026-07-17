// How recent last_active_at needs to be for someone to count as "online now"
const ONLINE_THRESHOLD_MS = 3 * 60 * 1000; // 3 minutes

export function isOnline(lastActiveAt: string | null): boolean {
  if (!lastActiveAt) return false;
  const last = new Date(lastActiveAt).getTime();
  return Date.now() - last < ONLINE_THRESHOLD_MS;
}

export function OnlineDot({ online }: { online: boolean }) {
  return (
    <span
      title={online ? "Online now" : "Offline"}
      style={{
        display: "inline-block",
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: online ? "#22C55E" : "#3D4F72",
        boxShadow: online ? "0 0 6px rgba(34,197,94,0.6)" : "none",
        marginRight: 8,
        flexShrink: 0,
      }}
    />
  );
}
