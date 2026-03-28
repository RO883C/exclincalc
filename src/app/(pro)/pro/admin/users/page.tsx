"use client";

import { useEffect, useState } from "react";
import {
  Users, Shield, ShieldOff, Trash2, KeyRound,
  CheckCircle, XCircle, Crown, RefreshCw, ChevronDown,
} from "lucide-react";

// ── Role definitions ──────────────────────────────────────────
const ROLES: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  super_admin: { label: "超級管理員", color: "#a855f7", bg: "rgba(168,85,247,0.12)", icon: "👑" },
  admin:       { label: "管理員",     color: "#3b82f6", bg: "rgba(59,130,246,0.12)", icon: "🛡️" },
  doctor:      { label: "醫師",       color: "#22c55e", bg: "rgba(34,197,94,0.10)",  icon: "🩺" },
  pharmacist:  { label: "藥劑師",     color: "#f59e0b", bg: "rgba(245,158,11,0.10)", icon: "💊" },
  nurse:       { label: "護理師",     color: "#ec4899", bg: "rgba(236,72,153,0.10)", icon: "🏥" },
  admin_staff: { label: "行政人員",   color: "#64748b", bg: "rgba(100,116,139,0.10)", icon: "📋" },
};

type ProRole = keyof typeof ROLES;

interface UserRow {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  is_pro: boolean;
  pro_role: ProRole;
  institution: string | null;
  patients: number;
  records: number;
  notes: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<ProRole>("doctor");

  const [resetModal, setResetModal] = useState<{ userId: string; email: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [roleDropdown, setRoleDropdown] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/pro/admin/users");
    const json = await res.json();
    setUsers(json.users || []);
    setCurrentUserId(json.currentUserId ?? null);
    setCurrentRole(json.currentRole ?? "doctor");
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const patch = async (userId: string, updates: Record<string, unknown>) => {
    setActionLoading(userId);
    const res = await fetch("/api/pro/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, updates }),
    });
    const json = await res.json();
    if (json.error) alert(`操作失敗：${json.error}`);
    await load();
    setActionLoading(null);
  };

  const deleteUser = async (user: UserRow) => {
    if (!confirm(`確定刪除帳號 ${user.email}？\n此操作不可復原。`)) return;
    setActionLoading(user.id);
    await fetch("/api/pro/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    });
    await load();
    setActionLoading(null);
  };

  const resetPassword = async () => {
    if (!resetModal) return;
    if (newPassword.length < 6) { setPwError("密碼至少 6 字元"); return; }
    setPwError("");
    setActionLoading(resetModal.userId);
    const res = await fetch("/api/pro/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset_password", userId: resetModal.userId, newPassword }),
    });
    const json = await res.json();
    if (json.error) { setPwError(json.error); setActionLoading(null); return; }
    setResetModal(null);
    setNewPassword("");
    setActionLoading(null);
    alert("密碼已重設成功");
  };

  const fmt = (iso: string | null) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
  };

  // Can the current user change target user's role?
  const canChangeRole = (target: UserRow) => {
    if (target.id === currentUserId) return false;           // can't change own role
    if (target.pro_role === "super_admin") return false;     // super_admin is immutable
    if (currentRole === "super_admin") return true;          // super_admin can change all
    if (currentRole === "admin") return target.pro_role !== "admin" && target.pro_role !== "super_admin";
    return false;
  };

  const canDelete = (target: UserRow) => {
    if (target.id === currentUserId) return false;
    if (target.pro_role === "super_admin") return false;
    return true;
  };

  const closeDropdown = () => { setRoleDropdown(null); setDropdownPos(null); };

  return (
    <div onClick={closeDropdown}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--pro-text)", display: "flex", alignItems: "center", gap: 8 }}>
            <Users size={18} color="var(--pro-accent)" /> 帳號管理
          </h1>
          <span style={{ fontSize: 12, color: "var(--pro-text-muted)", background: "var(--pro-card)", padding: "2px 8px", borderRadius: 10, border: "1px solid var(--pro-border)" }}>
            共 {users.length} 個帳號
          </span>
        </div>
        <button onClick={load} style={{ background: "none", border: "1px solid var(--pro-border)", borderRadius: 7, padding: "6px 12px", color: "var(--pro-text-muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}>
          <RefreshCw size={12} /> 重新整理
        </button>
      </div>

      {/* Role legend */}
      <div style={{
        display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16,
        padding: "10px 14px", borderRadius: 8,
        background: "var(--pro-bg)", border: "1px solid var(--pro-border)",
      }}>
        <span style={{ fontSize: 11, color: "var(--pro-text-muted)", fontWeight: 600, marginRight: 4 }}>角色說明：</span>
        {Object.entries(ROLES).map(([key, r]) => (
          <span key={key} style={{
            fontSize: 11, padding: "2px 8px", borderRadius: 10,
            background: r.bg, color: r.color, fontWeight: 600,
          }}>
            {r.icon} {r.label}
          </span>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--pro-text-muted)" }}>載入中...</div>
      ) : (
        <div className="pro-card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="pro-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["電子郵件", "Pro 狀態", "角色", "最後登入", "活動量", "操作"].map((h) => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--pro-text-muted)", borderBottom: "1px solid var(--pro-border)", background: "var(--pro-bg)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const roleInfo = ROLES[u.pro_role] ?? ROLES.doctor;
                const isSelf = u.id === currentUserId;
                return (
                  <tr key={u.id} style={{
                    borderBottom: "1px solid var(--pro-border)",
                    background: isSelf ? "rgba(59,130,246,0.04)" : undefined,
                  }}>
                    {/* Email */}
                    <td style={{ padding: "11px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 13, color: "var(--pro-text)", fontWeight: 500 }}>{u.email}</span>
                        {isSelf && <span style={{ fontSize: 10, color: "var(--pro-accent)", background: "var(--pro-accent-dim)", padding: "1px 5px", borderRadius: 8 }}>我</span>}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--pro-text-muted)", marginTop: 2 }}>
                        {fmt(u.created_at)}{u.institution && ` · ${u.institution}`}
                        {!u.email_confirmed_at && <span style={{ color: "#eab308" }}> · ⚠ 未驗證</span>}
                      </div>
                    </td>

                    {/* Pro status */}
                    <td style={{ padding: "11px 14px" }}>
                      <button
                        onClick={() => !isSelf && patch(u.id, { is_pro: !u.is_pro })}
                        disabled={actionLoading === u.id || isSelf}
                        title={u.is_pro ? "點擊撤銷 Pro 權限" : "點擊授予 Pro 權限"}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                          background: u.is_pro ? "rgba(34,197,94,0.1)" : "rgba(100,116,139,0.1)",
                          color: u.is_pro ? "#22c55e" : "var(--pro-text-muted)",
                          border: `1px solid ${u.is_pro ? "rgba(34,197,94,0.3)" : "var(--pro-border)"}`,
                          cursor: isSelf ? "default" : "pointer",
                        }}
                      >
                        {u.is_pro ? <CheckCircle size={10} /> : <XCircle size={10} />}
                        {u.is_pro ? "已授權" : "未授權"}
                      </button>
                    </td>

                    {/* Role — dropdown (position:fixed to avoid table overflow clipping) */}
                    <td style={{ padding: "11px 14px" }}>
                      <div onClick={e => e.stopPropagation()}>
                        <button
                          onClick={(e) => {
                            if (!canChangeRole(u)) return;
                            if (roleDropdown === u.id) { closeDropdown(); return; }
                            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                            setDropdownPos({ top: rect.bottom + 4, left: rect.left });
                            setRoleDropdown(u.id);
                          }}
                          disabled={!canChangeRole(u)}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 5,
                            padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                            background: roleInfo.bg, color: roleInfo.color,
                            border: `1px solid ${roleInfo.color}40`,
                            cursor: canChangeRole(u) ? "pointer" : "default",
                          }}
                        >
                          {roleInfo.icon} {roleInfo.label}
                          {canChangeRole(u) && <ChevronDown size={10} />}
                        </button>
                      </div>
                    </td>

                    {/* Last login */}
                    <td style={{ padding: "11px 14px", fontSize: 12, color: "var(--pro-text-muted)" }}>
                      {fmt(u.last_sign_in_at)}
                    </td>

                    {/* Activity */}
                    <td style={{ padding: "11px 14px" }}>
                      <div style={{ display: "flex", gap: 8, fontSize: 12, color: "var(--pro-text-muted)" }}>
                        <span>👤 {u.patients}</span>
                        <span>📋 {u.records}</span>
                        <span>📝 {u.notes}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "11px 14px" }}>
                      <div style={{ display: "flex", gap: 5 }}>
                        {/* Toggle Pro */}
                        <button
                          onClick={() => !isSelf && patch(u.id, { is_pro: !u.is_pro })}
                          disabled={actionLoading === u.id || isSelf}
                          title={u.is_pro ? "撤銷授權" : "授予授權"}
                          style={{
                            padding: "4px 8px", borderRadius: 5, fontSize: 11, cursor: isSelf ? "default" : "pointer",
                            border: `1px solid ${u.is_pro ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)"}`,
                            background: "transparent",
                            color: u.is_pro ? "var(--pro-danger)" : "#22c55e",
                            opacity: isSelf ? 0.4 : 1,
                          }}
                        >
                          {u.is_pro ? <ShieldOff size={11} /> : <Shield size={11} />}
                        </button>

                        {/* Reset Password */}
                        <button
                          onClick={() => { setResetModal({ userId: u.id, email: u.email }); setNewPassword(""); setPwError(""); }}
                          title="重設密碼"
                          style={{
                            padding: "4px 8px", borderRadius: 5, fontSize: 11, cursor: "pointer",
                            border: "1px solid var(--pro-border)",
                            background: "transparent", color: "var(--pro-text-muted)",
                          }}
                        >
                          <KeyRound size={11} />
                        </button>

                        {/* Delete */}
                        {canDelete(u) && (
                          <button
                            onClick={() => deleteUser(u)}
                            disabled={actionLoading === u.id}
                            title="刪除帳號"
                            style={{
                              padding: "4px 8px", borderRadius: 5, fontSize: 11, cursor: "pointer",
                              border: "1px solid rgba(239,68,68,0.2)",
                              background: "transparent", color: "var(--pro-danger)",
                            }}
                          >
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Role Dropdown — rendered fixed to escape table overflow */}
      {roleDropdown && dropdownPos && (() => {
        const dropUser = users.find((u) => u.id === roleDropdown);
        if (!dropUser) return null;
        return (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "fixed", top: dropdownPos.top, left: dropdownPos.left, zIndex: 9999,
              background: "var(--pro-surface)", border: "1px solid var(--pro-border)",
              borderRadius: 8, boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
              minWidth: 160,
            }}
          >
            {Object.entries(ROLES)
              .filter(([key]) => currentRole === "super_admin" ? true : key !== "super_admin")
              .map(([key, r]) => (
                <button
                  key={key}
                  onClick={() => { patch(dropUser.id, { pro_role: key }); closeDropdown(); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 8, width: "100%",
                    padding: "8px 12px", background: "none", border: "none",
                    cursor: "pointer", fontSize: 12,
                    color: dropUser.pro_role === key ? r.color : "var(--pro-text)",
                    fontWeight: dropUser.pro_role === key ? 700 : 400,
                    borderBottom: "1px solid var(--pro-border)",
                  }}
                >
                  <span>{r.icon}</span>
                  <span>{r.label}</span>
                  {dropUser.pro_role === key && <CheckCircle size={11} color={r.color} style={{ marginLeft: "auto" }} />}
                </button>
              ))}
          </div>
        );
      })()}

      {/* Password Reset Modal */}
      {resetModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "var(--pro-sidebar)", border: "1px solid var(--pro-border)", borderRadius: 12, padding: 24, width: 360 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--pro-text)", marginBottom: 4 }}>重設密碼</h3>
            <p style={{ fontSize: 12, color: "var(--pro-text-muted)", marginBottom: 16 }}>帳號：{resetModal.email}</p>
            <input
              type="password" className="pro-input"
              placeholder="輸入新密碼（至少 6 字元）"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && resetPassword()}
              autoFocus
            />
            {pwError && <p style={{ fontSize: 12, color: "var(--pro-danger)", marginTop: 8 }}>{pwError}</p>}
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button onClick={resetPassword} disabled={actionLoading === resetModal.userId} className="pro-btn-primary" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <KeyRound size={13} /> 確認重設
              </button>
              <button onClick={() => setResetModal(null)} style={{ flex: 1, padding: "8px 12px", borderRadius: 7, border: "1px solid var(--pro-border)", background: "transparent", color: "var(--pro-text-muted)", cursor: "pointer", fontSize: 13 }}>
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
