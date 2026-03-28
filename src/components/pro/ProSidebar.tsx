"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Users, Pill, FileText,
  Database, BookOpen, ClipboardList, BarChart3, LogOut,
  Stethoscope, ChevronRight, UserCog, Microscope, Activity, BookMarked, Settings,
  FlaskConical, HeartPulse,
} from "lucide-react";
import { createClient } from "@/lib/supabase";

const MAIN_NAV = [
  { href: "/pro/encounter",   icon: Activity,        label: "診療流程",   labelEn: "Encounter" },
  { href: "/pro/exam",        icon: Microscope,      label: "檢驗工作台", labelEn: "Exam Workbench" },
  { href: "/pro/dashboard",   icon: LayoutDashboard, label: "總覽",       labelEn: "Dashboard" },
  { href: "/pro/patients",    icon: Users,           label: "病患管理",   labelEn: "Patients" },
  { href: "/pro/references",  icon: BookMarked,      label: "參考資料",   labelEn: "References" },
  { href: "/pro/drugs",       icon: Pill,            label: "藥物交互",   labelEn: "Drug Check" },
  { href: "/pro/notes",       icon: FileText,        label: "SOAP 筆記",  labelEn: "SOAP Notes" },
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
    });
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const isActive = (href: string) => pathname.startsWith(href);

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
                醫師臨床決策系統
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Main nav */}
      <nav style={{ flex: 1, padding: "12px 0" }}>
        <div style={{ padding: "0 8px 4px 16px", fontSize: 10, color: "var(--pro-text-muted)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          主要功能
        </div>
        {MAIN_NAV.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href} className={`pro-nav-item${isActive(href) ? " active" : ""}`}>
            <Icon size={15} />
            <span>{label}</span>
            {isActive(href) && <ChevronRight size={12} style={{ marginLeft: "auto", opacity: 0.6 }} />}
          </Link>
        ))}

        {isPharmacist && (
          <>
            <div style={{ padding: "16px 8px 4px 16px", fontSize: 10, color: "#f59e0b", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              藥師功能
            </div>
            <Link href="/pro/pharmacy" className={`pro-nav-item${isActive("/pro/pharmacy") ? " active" : ""}`}>
              <FlaskConical size={15} />
              <span>藥師工作台</span>
              {isActive("/pro/pharmacy") && <ChevronRight size={12} style={{ marginLeft: "auto", opacity: 0.6 }} />}
            </Link>
            <Link href="/pro/drugs" className={`pro-nav-item${isActive("/pro/drugs") ? " active" : ""}`}>
              <Pill size={15} />
              <span>交互作用檢查</span>
              {isActive("/pro/drugs") && <ChevronRight size={12} style={{ marginLeft: "auto", opacity: 0.6 }} />}
            </Link>
          </>
        )}

        {isNurse && (
          <>
            <div style={{ padding: "16px 8px 4px 16px", fontSize: 10, color: "#ec4899", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              護理功能
            </div>
            <Link href="/pro/nursing" className={`pro-nav-item${isActive("/pro/nursing") ? " active" : ""}`}>
              <HeartPulse size={15} />
              <span>護理師工作台</span>
              {isActive("/pro/nursing") && <ChevronRight size={12} style={{ marginLeft: "auto", opacity: 0.6 }} />}
            </Link>
            <Link href="/pro/patients" className={`pro-nav-item${isActive("/pro/patients") ? " active" : ""}`}>
              <Users size={15} />
              <span>病患列表</span>
              {isActive("/pro/patients") && <ChevronRight size={12} style={{ marginLeft: "auto", opacity: 0.6 }} />}
            </Link>
          </>
        )}

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
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--pro-text)" }}>
                  {profile.name || "醫師"}
                </div>
                {profile.institution && (
                  <div style={{ fontSize: 11, color: "var(--pro-text-muted)" }}>
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
