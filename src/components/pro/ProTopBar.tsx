"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, ChevronRight } from "lucide-react";
import { useState } from "react";

const PAGE_TITLES: Record<string, { zh: string; en: string }> = {
  "/pro/encounter":          { zh: "診療流程",      en: "Encounter Flow" },
  "/pro/exam":               { zh: "檢驗工作台",    en: "Exam Workbench" },
  "/pro/dashboard":          { zh: "總覽",          en: "Dashboard" },
  "/pro/patients":           { zh: "病患管理",      en: "Patient Management" },
  "/pro/patients/new":       { zh: "新增病患",      en: "New Patient" },
  "/pro/analysis":           { zh: "臨床分析",      en: "Clinical Analysis" },
  "/pro/drugs":              { zh: "藥物交互作用",  en: "Drug Interactions" },
  "/pro/notes":              { zh: "SOAP 筆記",     en: "SOAP Notes" },
  "/pro/notes/new":          { zh: "新增筆記",      en: "New Note" },
  "/pro/admin/users":        { zh: "帳號管理",      en: "User Management" },
  "/pro/admin/medications":  { zh: "藥物資料庫管理", en: "Medications DB" },
  "/pro/admin/references":   { zh: "參考值資料庫管理", en: "References DB" },
  "/pro/admin/records":      { zh: "健康記錄總覽",  en: "Health Records" },
  "/pro/analytics":          { zh: "數據分析",      en: "Analytics" },
  "/pro/profile":            { zh: "個人資料",      en: "Profile" },
  "/pro/admin":              { zh: "管理後台",      en: "Admin" },
};

function getPageTitle(pathname: string) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith("/pro/patients/") && pathname.endsWith("/records/new")) {
    return { zh: "新增臨床記錄", en: "New Clinical Record" };
  }
  if (pathname.startsWith("/pro/patients/")) {
    return { zh: "病患詳情", en: "Patient Detail" };
  }
  if (pathname.startsWith("/pro/notes/")) {
    return { zh: "編輯筆記", en: "Edit Note" };
  }
  return { zh: "ClinCalc Pro", en: "ClinCalc Pro" };
}

export default function ProTopBar() {
  const pathname = usePathname();
  const title = getPageTitle(pathname);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="pro-topbar">
      {/* Mobile menu toggle */}
      <button
        className="md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        style={{ color: "var(--pro-text-muted)", background: "none", border: "none", cursor: "pointer" }}
      >
        <Menu size={20} />
      </button>

      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
        <Link href="/pro/dashboard" style={{ color: "var(--pro-text-muted)", fontSize: 13, textDecoration: "none" }}>
          Pro
        </Link>
        <ChevronRight size={12} color="var(--pro-text-muted)" />
        <span style={{ color: "var(--pro-text)", fontSize: 13, fontWeight: 600 }}>
          {title.zh}
        </span>
      </div>

      {/* Right slot */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{
          fontSize: 11, padding: "2px 8px", borderRadius: 4,
          background: "var(--pro-accent-dim)", color: "var(--pro-accent)",
          border: "1px solid rgba(59,130,246,0.2)", fontWeight: 600,
        }}>
          PRO
        </span>
      </div>
    </div>
  );
}
