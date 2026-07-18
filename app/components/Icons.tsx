type IconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

const base = (size = 18, strokeWidth = 2) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export function IconDashboard({ size, color, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} style={{ color }}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  );
}

export function IconUsers({ size, color, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} style={{ color }}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function IconShield({ size, color, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} style={{ color }}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    </svg>
  );
}

export function IconLogs({ size, color, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} style={{ color }}>
      <path d="M8 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2" />
      <rect x="8" y="1" width="8" height="4" rx="1" />
      <path d="M8 11h8M8 15h8M8 19h5" />
    </svg>
  );
}

export function IconLogOut({ size, color, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} style={{ color }}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

export function IconPlus({ size, color, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} style={{ color }}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconChevronDown({ size, color, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} style={{ color }}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function IconMoreVertical({ size, color, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} style={{ color }}>
      <circle cx="12" cy="5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="12" cy="19" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconTrash({ size, color, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} style={{ color }}>
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

export function IconBan({ size, color, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} style={{ color }}>
      <circle cx="12" cy="12" r="9" />
      <path d="M5.5 5.5l13 13" />
    </svg>
  );
}

export function IconCheckCircle({ size, color, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} style={{ color }}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.5l2.5 2.5 5-5.5" />
    </svg>
  );
}

export function IconArrowUpDown({ size, color, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} style={{ color }}>
      <path d="M7 3v18M3 7l4-4 4 4M17 21V3M13 17l4 4 4-4" />
    </svg>
  );
}

export function IconMenu({ size, color, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} style={{ color }}>
      <path d="M3 12h18M3 6h18M3 18h18" />
    </svg>
  );
}

export function IconX({ size, color, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} style={{ color }}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export function IconMail({ size, color, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} style={{ color }}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m2 7 10 6 10-6" />
    </svg>
  );
}

export function IconLock({ size, color, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} style={{ color }}>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

export function IconClock({ size, color, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} style={{ color }}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

export function IconAlertTriangle({ size, color, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} style={{ color }}>
      <path d="M12 9v4M12 17h.01M10.29 3.86l-8.18 14.14A1.5 1.5 0 0 0 3.4 20h17.2a1.5 1.5 0 0 0 1.29-2L13.71 3.86a1.5 1.5 0 0 0-2.42 0Z" />
    </svg>
  );
}
