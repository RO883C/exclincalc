"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Users, Pill, FileText,
  Database, BookOpen, ClipboardList, BarChart3, LogOut,
  Stethoscope, ChevronRight, UserCog, Microscope, Activity, BookMarked, Settings,
  FlaskConical, HeartPulse, CalendarDays, ShieldCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase";

// Items shown based on role (doctor = default; nurse/pharmacist get role-specific subsets)
const DOCTOR_NAV = [
  { href: "/pro/dashboard",   icon: LayoutDashboard, label: "總覽" },
  { href: "/pro/encounter",   icon: Activity,        label: "診療流程" },
  { href: "/pro/patients",    icon: Users,           label: "病患管理" },
  { href: "/pro/exam",        icon: Microscope,      label: "檢驗工作台" },
  { href: "/pro/notes",       icon: FileText,        label: "SOAP 筆記" },
  { href: "/pro/drugs",       icon: Pill,            label: "藥物交互" },
  { href: "/pro/references",  icon: BookMarked,      label: "參考資料" },
];
const NURSE_NAV = [
  { href: "/pro/dashboard",   icon: LayoutDashboard, label: "總覽" },
  { href: "/pro/nursing",     icon: HeartPulse,      label: "護理工作台" },
  { href: "/pro/patients",    icon: Users,           label: "病患列表" },
  { href: "/pro/references",  icon: BookMarked,      label: "參考資料" },
];
const PHARMACIST_NAV = [
  { href: "/pro/dashboard",   icon: LayoutDashboard, label: "總覽" },
  { href: "/pro/pharmacy",    icon: FlaskConical,    label: "藥師工作台" },
  { href: "/pro/drugs",       icon: Pill,            label: "交互作用檢查" },
  { href: "/pro/references",  icon: BookMarked,      label: "參考資料" },
];

const ADMIN_NAV = [
  { href: "/pro/admin/users",       icon: Users,         label: "帳號管理",    labelEn: "User Management" },
  { href: "/pro/admin/medications", icon: Database,      label: "藥物資料庫",  labelEn: "Medications DB" },
  { href: "/pro/admin/references",  icon: BookOpen,      label: "參考值資料庫", labelEn: "References DB" },
  { href: "/pro/admin/records",     icon: ClipboardList, label: "健康記錄總覽", labelEn: "Health Records" },
  { href: "/pro/analytics",         icon: BarChart3,     label: "數據分析",    labelEn: "Analytics" },
];

interface Profile {
  name: string;
  institution: string | null;
  pro_role: string;
}

export default function ProSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPharmacist, setIsPharmacist] = useState(false);
  const [isNurse, setIsNurse] = useState(false);
  const [showAppointments, setShowAppointments] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: p } = await supabase
        .from("profiles")
        .select("name, institution, pro_role")
        .eq("id", data.user.id)
        .single();
      if (p) {
        setProfile(p);
        setIsAdmin(["admin", "super_admin"].includes(p.pro_role));
        setIsPharmacist(p.pro_role === "pharmacist");
        setIsNurse(p.pro_role === "nurse");
      }
      // Read appointments toggle from settings
      try {
        const raw = localStorage.getItem("pro_app_settings");
        if (raw) {
          const s = JSON.parse(raw);
          if (s.showAppointments === false) setShowAppointments(false);
        }
      } catch { /* use default */ }
    });
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const isActive = (href: string) => pathname.startsWith(href);

  const roleLabel = isNurse ? "護理師工作台" : isPharmacist ? "藥師工作台" : "醫師臨床決策系統";
  const mainNav = isNurse ? NURSE_NAV : isPharmacist ? PHARMACIST_NAV : DOCTOR_NAV;

  return (
    <aside className="pro-sidebar">
      {/* Logo */}
      <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid var(--pro-border)" }}>
        <Link href="/pro/dashboard" style={{ textDecoration: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Stethoscope size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--pro-text)" }}>
                ClinCalc Pro
              </div>
              <div style={{ fontSize: 10, color: "var(--pro-text-muted)" }}>
                {roleLabel}
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Main nav — role-filtered */}
      <nav style={{ flex: 1, padding: "12px 0" }}>
        <div style={{ padding: "0 8px 4px 16px", fontSize: 10, color: "var(--pro-text-muted)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          主要功能
        </div>
        {mainNav.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href} className={`pro-nav-item${isActive(href) ? " active" : ""}`}>
            <Icon size={15} />
            <span>{label}</span>
            {isActive(href) && <ChevronRight size={12} style={{ marginLeft: "auto", opacity: 0.6 }} />}
          </Link>
        ))}

        {/* 掛號管理：醫師與護理師均可見 */}
        {showAppointments && !isPharmacist && (
          <Link href="/pro/appointments" className={`pro-nav-item${isActive("/pro/appointments") ? " active" : ""}`}>
            <CalendarDays size={15} />
            <span>掛號管理</span>
            {isActive("/pro/appointments") && <ChevronRight size={12} style={{ marginLeft: "auto", opacity: 0.6 }} />}
          </Link>
        )}

        {/* Admin always sees admin section */}
        {isAdmin && (
          <>
            <div style={{ padding: "16px 8px 4px 16px", fontSize: 10, color: "var(--pro-text-muted)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              管理功能
            </div>
            {ADMIN_NAV.map(({ href, icon: Icon, label }) => (
              <Link key={href} href={href} className={`pro-nav-item${isActive(href) ? " active" : ""}`}>
                <Icon size={15} />
                <span>{label}</span>
                {isActive(href) && <ChevronRight size={12} style={{ marginLeft: "auto", opacity: 0.6 }} />}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* User footer */}
      <div style={{ borderTop: "1px solid var(--pro-border)", padding: "12px 16px" }}>
        {profile && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "var(--pro-accent-dim)", border: "1px solid var(--pro-accent)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 700, color: "var(--pro-accent)",
              }}>
                {(profile.name || "D").charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--pro-text)" }}>
                    {profile.name || "醫師"}
                  </span>
                  <RoleBadge role={profile.pro_role} />
                </div>
                {profile.institution && (
                  <div style={{ fontSize: 11, color: "var(--pro-text-muted)", marginTop: 2 }}>
                    {profile.institution}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        <div style={{ display: "flex", gap: 6 }}>
          <Link href="/pro/profile" title="個人資料" style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
            gap: 4, padding: "6px", borderRadius: 6, fontSize: 12,
            color: "var(--pro-text-muted)", border: "1px solid var(--pro-border)",
            textDecoration: "none", background: "transparent", transition: "all 0.15s",
          }}>
            <UserCog size={13} />
          </Link>
          <Link href="/pro/security" title="帳號安全" style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
            gap: 4, padding: "6px", borderRadius: 6, fontSize: 12,
            color: "var(--pro-text-muted)", border: "1px solid var(--pro-border)",
            textDecoration: "none", background: "transparent", transition: "all 0.15s",
          }}>
            <ShieldCheck size={13} />
          </Link>
          <Link href="/pro/settings" title="系統設定" style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
            gap: 4, padding: "6px", borderRadius: 6, fontSize: 12,
            color: "var(--pro-text-muted)", border: "1px solid var(--pro-border)",
            textDecoration: "none", background: "transparent", transition: "all 0.15s",
          }}>
            <Settings size={13} />
          </Link>
          <button onClick={handleLogout} style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
            gap: 4, padding: "6px", borderRadius: 6, fontSize: 12,
            color: "var(--pro-danger)", border: "1px solid rgba(239,68,68,0.2)",
            background: "transparent", cursor: "pointer", transition: "all 0.15s",
          }}>
            <LogOut size={13} />
            <span>登出</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

// 角色標籤：依 pro_role 顯示中文名稱與對應顏色
function RoleBadge({ role }: { role: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    doctor:       { label: "醫師",   color: "#3b82f6", bg: "rgba(59,130,246,0.15)" },
    nurse:        { label: "護理師", color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
    pharmacist:   { label: "藥師",   color: "#ec4899", bg: "rgba(236,72,153,0.15)" },
    admin_staff:  { label: "行政",   color: "#8b5cf6", bg: "rgba(139,92,246,0.15)" },
    admin:        { label: "管理員", color: "#10b981", bg: "rgba(16,185,129,0.15)" },
    super_admin:  { label: "超級管理員", color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
  };
  const info = map[role] || { label: role, color: "#94a3b8", bg: "rgba(148,163,184,0.15)" };
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4,
      color: info.color, background: info.bg,
      border: `1px solid ${info.color}40`, lineHeight: 1.4,
    }}>
      {info.label}
    </span>
  );
}
