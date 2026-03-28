import type { LucideIcon } from "lucide-react";
import Link from "next/link";

interface ProStatCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  sublabel?: string;
  color?: "blue" | "green" | "yellow" | "red";
  delta?: { value: string; positive: boolean };
  href?: string;
}

const COLOR_MAP = {
  blue:   { icon: "var(--pro-accent)",   bg: "var(--pro-accent-dim)",   border: "rgba(59,130,246,0.2)" },
  green:  { icon: "var(--pro-success)",  bg: "var(--pro-success-dim)",  border: "rgba(16,185,129,0.2)" },
  yellow: { icon: "var(--pro-warning)",  bg: "var(--pro-warning-dim)",  border: "rgba(245,158,11,0.2)" },
  red:    { icon: "var(--pro-danger)",   bg: "var(--pro-danger-dim)",   border: "rgba(239,68,68,0.2)" },
};

export default function ProStatCard({
  icon: Icon, value, label, sublabel, color = "blue", delta, href,
}: ProStatCardProps) {
  const c = COLOR_MAP[color];
  const inner = (
    <>
      <div style={{
        width: 44, height: 44, borderRadius: 10,
        background: c.bg, border: `1px solid ${c.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <Icon size={20} color={c.icon} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 26, fontWeight: 700, color: "var(--pro-text)", lineHeight: 1.1 }}>
          {value}
        </div>
        <div style={{ fontSize: 13, color: "var(--pro-text-muted)", marginTop: 4 }}>{label}</div>
        {sublabel && (
          <div style={{ fontSize: 11, color: "var(--pro-text-muted)", marginTop: 2, opacity: 0.7 }}>{sublabel}</div>
        )}
        {delta && (
          <div style={{ fontSize: 11, marginTop: 6, color: delta.positive ? "var(--pro-success)" : "var(--pro-danger)" }}>
            {delta.positive ? "↑" : "↓"} {delta.value}
          </div>
        )}
        {href && <div style={{ fontSize: 10, color: c.icon, marginTop: 6, opacity: 0.7 }}>點擊前往 →</div>}
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: "none" }}>
        <div className="pro-card" style={{
          padding: "20px 24px", display: "flex", alignItems: "flex-start", gap: 16,
          cursor: "pointer", transition: "transform 0.1s, box-shadow 0.1s",
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; }}
        >
          {inner}
        </div>
      </Link>
    );
  }

  return (
    <div className="pro-card" style={{ padding: "20px 24px", display: "flex", alignItems: "flex-start", gap: 16 }}>
      {inner}
    </div>
  );
}
