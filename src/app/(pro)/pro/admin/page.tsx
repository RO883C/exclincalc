"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Database, BookOpen, ClipboardList, BarChart3, ShieldCheck, Users } from "lucide-react";
import { createClient } from "@/lib/supabase";

const ADMIN_MODULES = [
  { href: "/pro/admin/users",        icon: Users,         label: "帳號管理",    desc: "授予 Pro 權限、重設密碼、刪除帳號", color: "#ef4444" },
  { href: "/pro/admin/medications",  icon: Database,      label: "藥物資料庫",  desc: "新增、編輯、刪除藥物資料",          color: "#3b82f6" },
  { href: "/pro/admin/references",   icon: BookOpen,      label: "參考值資料庫", desc: "管理醫療檢驗參考範圍",             color: "#10b981" },
  { href: "/pro/admin/records",      icon: ClipboardList, label: "健康記錄總覽", desc: "查看所有用戶健康記錄",             color: "#f59e0b" },
  { href: "/pro/analytics",          icon: BarChart3,     label: "數據分析",    desc: "平台使用統計與分析",               color: "#8b5cf6" },
];

export default function AdminPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.replace("/auth/login"); return; }
      const { data: p } = await supabase.from("profiles").select("pro_role").eq("id", data.user.id).single();
      if (p?.pro_role !== "admin") { router.replace("/pro"); return; }
      setChecking(false);
    });
  }, [router]);

  if (checking) return <div style={{ color: "var(--pro-text-muted)", padding: 40 }}>驗證權限中...</div>;

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <ShieldCheck size={20} color="var(--pro-accent)" />
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--pro-text)" }}>管理後台</h1>
        </div>
        <p style={{ fontSize: 13, color: "var(--pro-text-muted)" }}>僅管理員可見。修改資料庫數據前請務必確認。</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
        {ADMIN_MODULES.map(({ href, icon: Icon, label, desc, color }) => (
          <Link key={href} href={href} style={{ textDecoration: "none" }}>
            <div className="pro-card" style={{ padding: 24 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10, marginBottom: 14,
                background: `${color}20`, border: `1px solid ${color}30`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon size={20} color={color} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--pro-text)", marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 13, color: "var(--pro-text-muted)" }}>{desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
