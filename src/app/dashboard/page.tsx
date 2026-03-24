"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { Activity, ScanLine, ClipboardList, User, LogOut, ChevronRight } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace("/auth/login"); return; }
      supabase.from("profiles").select("name").eq("id", user.id).single()
        .then(({ data }) => {
          setUserName(data?.name || user.email?.split("@")[0] || "用戶");
          setLoading(false);
        });
    });
  }, [router]);

  const signOut = async () => {
    await createClient().auth.signOut();
    router.push("/");
    router.refresh();
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-sm" style={{ color: "var(--text-secondary)" }}>載入中...</div>
    </div>
  );

  const cards = [
    { href: "/check",   icon: Activity,     label: "健康自查",   sub: "AI 分析您的健康數值",     color: "#6366f1" },
    { href: "/scan",    icon: ScanLine,     label: "掃描報告",   sub: "上傳或拍攝體檢報告",       color: "#00d4aa" },
    { href: "/records", icon: ClipboardList, label: "健康記錄",   sub: "查看歷史查詢紀錄",         color: "#f59e0b" },
    { href: "/profile", icon: User,         label: "個人設定",   sub: "管理帳號與偏好設定",       color: "#8b5cf6" },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-sm mb-1" style={{ color: "var(--text-secondary)" }}>歡迎回來</p>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{userName}</h1>
        </div>
        <button onClick={signOut} className="btn-ghost text-sm gap-1.5"
          style={{ color: "var(--text-secondary)" }}>
          <LogOut size={14} /> 登出
        </button>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-2 gap-3">
        {cards.map(({ href, icon: Icon, label, sub, color }) => (
          <Link key={href} href={href}
            className="card p-5 flex flex-col gap-3 hover:scale-[1.02] transition-transform">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `${color}18` }}>
              <Icon size={20} style={{ color }} />
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{label}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{sub}</p>
            </div>
            <ChevronRight size={14} className="self-end" style={{ color: "var(--text-secondary)" }} />
          </Link>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="mt-6 p-3 rounded-lg text-xs text-center"
        style={{ background: "rgba(245,158,11,0.06)", color: "var(--warning)", border: "1px solid rgba(245,158,11,0.12)" }}>
        ⚠️ 本平台僅供健康參考，不構成醫療診斷。如有不適請就醫。
      </div>
    </div>
  );
}
