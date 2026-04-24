"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, Stethoscope, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
    });
    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      setDone(true);
    }
  };

  const cardStyle = {
    background: "#0f1e35",
    border: "1px solid #1e3a5f",
    borderRadius: 14,
    padding: "32px 28px",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#07111f", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, margin: "0 auto 14px", background: "linear-gradient(135deg, #3b82f6, #1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Stethoscope size={24} color="#fff" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#e2e8f0", marginBottom: 4 }}>重設密碼</h1>
          <p style={{ fontSize: 13, color: "#94a3b8" }}>輸入帳號電子郵件，我們將寄送重設連結</p>
        </div>

        <div style={cardStyle}>
          {done ? (
            <div style={{ textAlign: "center" }}>
              <CheckCircle2 size={48} color="#22c55e" style={{ margin: "0 auto 16px", display: "block" }} />
              <p style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", marginBottom: 8 }}>重設信已寄出</p>
              <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7, marginBottom: 20 }}>
                請至 <strong style={{ color: "#e2e8f0" }}>{email}</strong> 收件匣點擊重設連結。
              </p>
              <Link href="/auth/login" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 13, color: "#3b82f6", textDecoration: "none" }}>
                <ArrowLeft size={13} /> 返回登入
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: 6 }}>電子郵件</label>
                <div style={{ position: "relative" }}>
                  <Mail size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                  <input
                    type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="doctor@hospital.com"
                    style={{ width: "100%", background: "#07111f", border: "1px solid #1e3a5f", borderRadius: 8, padding: "10px 12px 10px 36px", color: "#e2e8f0", fontSize: 14, outline: "none" }}
                    onFocus={e => (e.target as HTMLInputElement).style.borderColor = "#3b82f6"}
                    onBlur={e => (e.target as HTMLInputElement).style.borderColor = "#1e3a5f"}
                  />
                </div>
              </div>

              {error && (
                <div style={{ padding: "10px 12px", borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", fontSize: 13 }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} style={{ background: loading ? "#1d4ed8" : "linear-gradient(135deg, #3b82f6, #1d4ed8)", color: "#fff", fontWeight: 700, padding: 11, borderRadius: 8, border: "none", cursor: loading ? "default" : "pointer", fontSize: 14, opacity: loading ? 0.8 : 1 }}>
                {loading ? "寄送中..." : "寄送重設連結"}
              </button>

              <Link href="/auth/login" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 13, color: "#94a3b8", textDecoration: "none", marginTop: 4 }}>
                <ArrowLeft size={13} /> 返回登入
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
