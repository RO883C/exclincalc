"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays, UserPlus, Clock, CheckCircle, XCircle,
  PlayCircle, Hash, RefreshCw, Stethoscope, RotateCcw
} from "lucide-react";
import { createClient } from "@/lib/supabase";

interface Appointment {
  id: string;
  patient_id: string;
  queue_number: number;
  visit_date: string;
  nhi_number: string | null;
  chief_complaint: string | null;
  notes: string | null;
  status: "waiting" | "in_progress" | "completed" | "cancelled";
  checked_in_at: string;
  completed_at: string | null;
  patient: { full_name: string; date_of_birth: string | null; sex: string | null } | null;
}

interface NewApptForm {
  patientSearch: string;
  patientId: string | null;
  nhi_number: string;
  chief_complaint: string;
}

const STATUS_CONFIG = {
  waiting:     { label: "等候中", color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  in_progress: { label: "診療中", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  completed:   { label: "已完成", color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
  cancelled:   { label: "已取消", color: "#6b7280", bg: "rgba(107,114,128,0.12)" },
};

function calcAge(dob: string | null): string {
  if (!dob) return "—";
  return `${Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000))}歲`;
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewApptForm>({ patientSearch: "", patientId: null, nhi_number: "", chief_complaint: "" });
  const [patients, setPatients] = useState<{ id: string; full_name: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | "waiting" | "in_progress" | "cancelled">("waiting");

  const supabase = createClient();
  const router = useRouter();

  const load = async () => {
    setLoading(true);
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("appointments")
      .select("*, patient:patient_id(full_name, date_of_birth, sex)")
      .eq("visit_date", today)
      .order("queue_number", { ascending: true });
    setAppointments((data as Appointment[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: pts } = await supabase
        .from("doctor_patients")
        .select("id, full_name")
        .eq("doctor_id", data.user.id)
        .order("full_name");
      if (pts) setPatients(pts);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = appointments.filter((a) =>
    filterStatus === "all" ? true : a.status === filterStatus
  );

  const updateStatus = async (id: string, status: Appointment["status"]) => {
    await supabase.from("appointments").update({
      status,
      ...(status === "completed" ? { completed_at: new Date().toISOString() } : {}),
      ...(status === "waiting" ? { completed_at: null } : {}),
    }).eq("id", id);
    load();
  };

  const callPatient = async (appt: Appointment) => {
    await supabase.from("appointments").update({ status: "in_progress" }).eq("id", appt.id);
    const params = new URLSearchParams({ pid: appt.patient_id });
    if (appt.chief_complaint) params.set("complaint", encodeURIComponent(appt.chief_complaint));
    router.push(`/pro/encounter?${params.toString()}`);
  };

  const addAppointment = async () => {
    if (!form.patientId) return;
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSubmitting(false); return; }
    const today = new Date().toISOString().split("T")[0];
    // Get next queue number via RPC
    const { data: qnum } = await supabase.rpc("next_queue_number", {
      p_doctor_id: user.id, p_date: today,
    });
    await supabase.from("appointments").insert({
      doctor_id: user.id,
      patient_id: form.patientId,
      queue_number: qnum || 1,
      visit_date: today,
      nhi_number: form.nhi_number || null,
      chief_complaint: form.chief_complaint || null,
    });
    setForm({ patientSearch: "", patientId: null, nhi_number: "", chief_complaint: "" });
    setShowForm(false);
    setSubmitting(false);
    load();
  };

  const suggestions = form.patientSearch.length >= 1
    ? patients.filter(p => p.full_name.includes(form.patientSearch)).slice(0, 6)
    : [];

  const stats = {
    waiting: appointments.filter(a => a.status === "waiting").length,
    in_progress: appointments.filter(a => a.status === "in_progress").length,
    completed: appointments.filter(a => a.status === "completed").length,
  };

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--pro-text)", display: "flex", alignItems: "center", gap: 8 }}>
            <CalendarDays size={20} color="var(--pro-accent)" /> 掛號管理
          </h1>
          <p style={{ fontSize: 12, color: "var(--pro-text-muted)", marginTop: 3 }}>
            {new Date().toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={load} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
            borderRadius: 8, border: "1px solid var(--pro-border)",
            background: "var(--pro-surface)", color: "var(--pro-text-muted)",
            cursor: "pointer", fontSize: 13,
          }}>
            <RefreshCw size={13} /> 刷新
          </button>
          <button onClick={() => setShowForm(!showForm)} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
            borderRadius: 8, border: "none",
            background: "var(--pro-accent)", color: "#fff",
            cursor: "pointer", fontSize: 13, fontWeight: 600,
          }}>
            <UserPlus size={13} /> 新增掛號
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "等候中", count: stats.waiting, color: "#3b82f6" },
          { label: "診療中", count: stats.in_progress, color: "#f59e0b" },
          { label: "已完成", count: stats.completed, color: "#22c55e" },
        ].map(s => (
          <div key={s.label} style={{
            background: "var(--pro-surface)", border: "1px solid var(--pro-border)",
            borderRadius: 10, padding: "12px 16px",
          }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.count}</div>
            <div style={{ fontSize: 12, color: "var(--pro-text-muted)", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* New appointment form */}
      {showForm && (
        <div style={{
          background: "var(--pro-surface)", border: "1px solid var(--pro-accent)",
          borderRadius: 10, padding: 20, marginBottom: 20,
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--pro-text)", marginBottom: 14 }}>
            新增今日掛號
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            {/* Patient autocomplete */}
            <div style={{ position: "relative" }}>
              <label style={{ fontSize: 11, color: "var(--pro-text-muted)", display: "block", marginBottom: 4 }}>
                病患姓名 *
              </label>
              <input
                value={form.patientSearch}
                onChange={e => {
                  setForm(f => ({ ...f, patientSearch: e.target.value, patientId: null }));
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="輸入姓名搜尋..."
                style={{
                  width: "100%", padding: "8px 10px", borderRadius: 6, fontSize: 13,
                  border: `1px solid ${form.patientId ? "var(--pro-accent)" : "var(--pro-border)"}`,
                  background: "var(--pro-bg)", color: "var(--pro-text)",
                  boxSizing: "border-box",
                }}
              />
              {showSuggestions && suggestions.length > 0 && (
                <div style={{
                  position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
                  background: "var(--pro-surface)", border: "1px solid var(--pro-border)",
                  borderRadius: 6, marginTop: 2, boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                }}>
                  {suggestions.map(p => (
                    <button key={p.id} onClick={() => {
                      setForm(f => ({ ...f, patientSearch: p.full_name, patientId: p.id }));
                      setShowSuggestions(false);
                    }} style={{
                      display: "block", width: "100%", textAlign: "left",
                      padding: "8px 12px", background: "none", border: "none",
                      cursor: "pointer", fontSize: 13, color: "var(--pro-text)",
                    }}>
                      {p.full_name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* NHI Number */}
            <div>
              <label style={{ fontSize: 11, color: "var(--pro-text-muted)", display: "block", marginBottom: 4 }}>
                健保卡號（選填）
              </label>
              <input
                value={form.nhi_number}
                onChange={e => setForm(f => ({ ...f, nhi_number: e.target.value }))}
                placeholder="例：AB00000001"
                style={{
                  width: "100%", padding: "8px 10px", borderRadius: 6, fontSize: 13,
                  border: "1px solid var(--pro-border)", background: "var(--pro-bg)", color: "var(--pro-text)",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, color: "var(--pro-text-muted)", display: "block", marginBottom: 4 }}>
              主訴（選填）
            </label>
            <input
              value={form.chief_complaint}
              onChange={e => setForm(f => ({ ...f, chief_complaint: e.target.value }))}
              placeholder="例：發燒、頭痛"
              style={{
                width: "100%", padding: "8px 10px", borderRadius: 6, fontSize: 13,
                border: "1px solid var(--pro-border)", background: "var(--pro-bg)", color: "var(--pro-text)",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={addAppointment} disabled={!form.patientId || submitting} style={{
              padding: "8px 20px", borderRadius: 7, border: "none",
              background: form.patientId ? "var(--pro-accent)" : "#4b5563",
              color: "#fff", fontWeight: 600, fontSize: 13, cursor: form.patientId ? "pointer" : "not-allowed",
            }}>
              {submitting ? "新增中…" : "確認掛號"}
            </button>
            <button onClick={() => setShowForm(false)} style={{
              padding: "8px 16px", borderRadius: 7,
              border: "1px solid var(--pro-border)", background: "none",
              color: "var(--pro-text-muted)", fontSize: 13, cursor: "pointer",
            }}>
              取消
            </button>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {[
          { key: "waiting", label: "等候中" },
          { key: "in_progress", label: "診療中" },
          { key: "all", label: "全部" },
          { key: "cancelled", label: "已取消" },
        ].map(f => (
          <button key={f.key} onClick={() => setFilterStatus(f.key as typeof filterStatus)} style={{
            padding: "6px 16px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer",
            border: `1px solid ${filterStatus === f.key ? "var(--pro-accent)" : "var(--pro-border)"}`,
            background: filterStatus === f.key ? "var(--pro-accent)" : "var(--pro-surface)",
            color: filterStatus === f.key ? "#fff" : "var(--pro-text-muted)",
          }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Queue list */}
      {loading ? (
        <p style={{ color: "var(--pro-text-muted)", fontSize: 13 }}>載入中…</p>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "40px 0",
          color: "var(--pro-text-muted)", fontSize: 13,
        }}>
          <Clock size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
          <p>今日無候診記錄</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((appt) => {
            const cfg = STATUS_CONFIG[appt.status];
            return (
              <div key={appt.id} style={{
                background: "var(--pro-surface)", border: "1px solid var(--pro-border)",
                borderRadius: 10, padding: "14px 16px",
                display: "flex", alignItems: "center", gap: 16,
              }}>
                {/* Queue number */}
                <div style={{
                  width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: cfg.bg, color: cfg.color, fontWeight: 700, fontSize: 18,
                }}>
                  {appt.queue_number}
                </div>

                {/* Patient info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 14, color: "var(--pro-text)" }}>
                      {appt.patient?.full_name ?? "—"}
                    </span>
                    <span style={{
                      fontSize: 10, padding: "2px 8px", borderRadius: 12,
                      background: cfg.bg, color: cfg.color, fontWeight: 600,
                    }}>
                      {cfg.label}
                    </span>
                    {appt.patient?.date_of_birth && (
                      <span style={{ fontSize: 11, color: "var(--pro-text-muted)" }}>
                        {calcAge(appt.patient.date_of_birth)} · {appt.patient.sex === "M" ? "男" : appt.patient.sex === "F" ? "女" : ""}
                      </span>
                    )}
                  </div>
                  {appt.chief_complaint && (
                    <p style={{ fontSize: 12, color: "var(--pro-text-muted)", marginTop: 3 }}>
                      主訴：{appt.chief_complaint}
                    </p>
                  )}
                  {appt.nhi_number && (
                    <p style={{ fontSize: 11, color: "var(--pro-text-muted)", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                      <Hash size={10} /> 健保：{appt.nhi_number}
                    </p>
                  )}
                </div>

                {/* Time */}
                <div style={{ fontSize: 11, color: "var(--pro-text-muted)", textAlign: "right", flexShrink: 0 }}>
                  <Clock size={10} style={{ display: "inline", marginRight: 3 }} />
                  {new Date(appt.checked_in_at).toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" })}
                  {appt.completed_at && (
                    <div style={{ marginTop: 2 }}>
                      完成 {new Date(appt.completed_at).toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  {appt.status === "waiting" && (
                    <button onClick={() => callPatient(appt)} title="叫號看診" style={{
                      display: "flex", alignItems: "center", gap: 4,
                      padding: "6px 10px", borderRadius: 6, border: "1px solid var(--pro-accent)",
                      background: "rgba(var(--pro-accent-rgb, 59,130,246),0.1)", color: "var(--pro-accent)",
                      cursor: "pointer", fontSize: 12, fontWeight: 600,
                    }}>
                      <Stethoscope size={14} /> 叫號
                    </button>
                  )}
                  {appt.status === "in_progress" && (
                    <>
                      <button onClick={() => callPatient(appt)} title="前往看診頁" style={{
                        display: "flex", alignItems: "center", gap: 4,
                        padding: "6px 10px", borderRadius: 6, border: "1px solid #f59e0b",
                        background: "rgba(245,158,11,0.1)", color: "#f59e0b",
                        cursor: "pointer", fontSize: 12, fontWeight: 600,
                      }}>
                        <PlayCircle size={14} /> 看診
                      </button>
                      <button onClick={() => updateStatus(appt.id, "completed")} title="完成診療" style={{
                        padding: "6px", borderRadius: 6, border: "1px solid #22c55e",
                        background: "rgba(34,197,94,0.1)", color: "#22c55e", cursor: "pointer",
                      }}>
                        <CheckCircle size={16} />
                      </button>
                    </>
                  )}
                  {appt.status === "cancelled" && (
                    <button onClick={() => updateStatus(appt.id, "waiting")} title="回補候診" style={{
                      display: "flex", alignItems: "center", gap: 4,
                      padding: "6px 10px", borderRadius: 6, border: "1px solid #3b82f6",
                      background: "rgba(59,130,246,0.1)", color: "#3b82f6",
                      cursor: "pointer", fontSize: 12, fontWeight: 600,
                    }}>
                      <RotateCcw size={14} /> 回補
                    </button>
                  )}
                  {(appt.status === "waiting" || appt.status === "in_progress") && (
                    <button onClick={() => updateStatus(appt.id, "cancelled")} title="取消" style={{
                      padding: "6px", borderRadius: 6, border: "1px solid var(--pro-border)",
                      background: "none", color: "var(--pro-text-muted)", cursor: "pointer",
                    }}>
                      <XCircle size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
