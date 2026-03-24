"use client";

import { useState } from "react";
import Link from "next/link";
import { UserPlus, Eye, EyeOff, AlertCircle, Mail, Lock, User, AlertTriangle } from "lucide-react";

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) { setError("兩次密碼不一致"); return; }
    if (form.password.length < 8) { setError("密碼至少需要 8 個字元"); return; }
    if (!agreed) { setError("請閱讀並同意免責聲明"); return; }
    setLoading(true);
    setError("");
    // TODO: connect Supabase auth
    await new Promise((r) => setTimeout(r, 800));
    setError("後端尚未連接，敬請期待 (Supabase coming soon)");
    setLoading(false);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg mx-auto mb-3"
            style={{ background: "var(--accent)", color: "#000" }}>
            C+
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            建立帳號
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Create your ClinCalc account
          </p>
        </div>

        <div className="card p-6">
          <form onSubmit={submit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: "var(--text-primary)" }}>
                姓名 / Name
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-secondary)" }} />
                <input type="text" required className="input-field pl-9"
                  placeholder="您的姓名" value={form.name} onChange={(e) => set("name", e.target.value)} />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: "var(--text-primary)" }}>
                電子郵件 / Email
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-secondary)" }} />
                <input type="email" required className="input-field pl-9"
                  placeholder="your@email.com" value={form.email} onChange={(e) => set("email", e.target.value)} />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: "var(--text-primary)" }}>
                密碼 / Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-secondary)" }} />
                <input type={showPw ? "text" : "password"} required className="input-field pl-9 pr-10"
                  placeholder="至少 8 個字元" value={form.password} onChange={(e) => set("password", e.target.value)} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-secondary)" }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Confirm */}
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: "var(--text-primary)" }}>
                確認密碼 / Confirm Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-secondary)" }} />
                <input type={showPw ? "text" : "password"} required className="input-field pl-9"
                  placeholder="再輸入一次密碼" value={form.confirm} onChange={(e) => set("confirm", e.target.value)}
                  style={{ borderColor: form.confirm && form.confirm !== form.password ? "rgba(239,68,68,0.5)" : undefined }} />
              </div>
            </div>

            {/* Disclaimer checkbox */}
            <div className="p-3 rounded-lg" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" style={{ color: "#f59e0b" }} />
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  本平台提供之所有資訊及 AI 分析結果，僅供一般健康參考之用，不得作為醫療診斷或治療依據。緊急狀況請撥打 119。
                </p>
              </div>
              <label className="flex items-center gap-2 mt-3 cursor-pointer">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
                  className="w-4 h-4 rounded" />
                <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                  我已閱讀並同意上述免責聲明
                </span>
              </label>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg text-sm"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--danger)" }}>
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center"
              style={{ opacity: loading ? 0.7 : 1 }}>
              {loading ? (
                <>
                  <span className="loading-dot" />
                  <span className="loading-dot" style={{ animationDelay: "0.2s" }} />
                  <span className="loading-dot" style={{ animationDelay: "0.4s" }} />
                </>
              ) : (
                <>
                  <UserPlus size={15} />
                  建立帳號 / Register
                </>
              )}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>已有帳號？</span>
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          </div>

          <Link href="/auth/login" className="btn-ghost w-full justify-center text-sm">
            返回登入 / Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
