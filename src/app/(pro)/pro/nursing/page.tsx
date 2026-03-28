"use client";

import { useEffect, useState } from "react";
import { HeartPulse, Users, Thermometer, Activity, AlertTriangle, ChevronDown, ChevronUp, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";

interface Patient {
  id: string;
  full_name: string;
  date_of_birth: string | null;
  sex: string | null;
  blood_type: string | null;
  allergies: string[];
  chronic_conditions: string[];
}

interface VitalsForm {
  bp_sys: string; bp_dia: string;
  hr: string; rr: string; temp: string; spo2: string;
  note: string;
}

const EMPTY_VITALS: VitalsForm = { bp_sys: "", bp_dia: "", hr: "", rr: "", temp: "", spo2: "", note: "" };

function calcAge(dob: string | null): string {
  if (!dob) return "—";
  const diff = Date.now() - new Date(dob).getTime();
  return `${Math.floor(diff / (365.25 * 24 * 3600 * 1000))} 歲`;
}

function vitalsAlert(v: VitalsForm): { level: "normal" | "warning" | "danger"; msg: string } {
  const sys = Number(v.bp_sys), dia = Number(v.bp_dia);
  const hr = Number(v.hr), temp = Number(v.temp), spo2 = Number(v.spo2);
  const dangers: string[] = [];
  const warnings: string[] = [];
  if (sys && sys >= 180) dangers.push("收縮壓 ≥180 mmHg");
  if (sys && sys < 90) dangers.push("收縮壓 <90 mmHg（低血壓）");
  if (dia && dia >= 120) dangers.push("舒張壓 ≥120 mmHg");
  if (hr && hr >= 150) dangers.push("心跳 ≥150 bpm");
  if (hr && hr < 40) dangers.push("心跳 <40 bpm（心搏過緩）");
  if (temp && temp >= 39.5) dangers.push(`高燒 ${temp}°C`);
  if (spo2 && spo2 < 90) dangers.push(`SpO₂ ${spo2}%（嚴重低氧）`);
  if (sys && sys >= 140) warnings.push("收縮壓偏高");
  if (temp && temp >= 38) warnings.push(`發燒 ${temp}°C`);
  if (spo2 && spo2 < 95 && spo2 >= 90) warnings.push("SpO₂ 偏低");
  if (dangers.length) return { level: "danger", msg: "⚠️ " + dangers.join("；") };
  if (warnings.length) return { level: "warning", msg: "△ " + warnings.join("；") };
  return { level: "normal", msg: "生命徵象正常" };
}

export default function NursingPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [vitals, setVitals] = useState<Record<string, VitalsForm>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const supabase = createClient();
    supabase.from("doctor_patients").select("id, full_name, date_of_birth, sex, blood_type, allergies, chronic_conditions")
      .order("full_name")
      .then(({ data }) => { setPatients((data as Patient[]) || []); setLoading(false); });
  }, []);

  const filtered = patients.filter(p =>
    !search || p.full_name.toLowerCase().includes(search.toLowerCase())
  );

  const getVitals = (id: string) => vitals[id] ?? EMPTY_VITALS;
  const setV = (id: string, key: keyof VitalsForm, val: string) =>
    setVitals(prev => ({ ...prev, [id]: { ...(prev[id] ?? EMPTY_VITALS), [key]: val } }));

  const handleSave = (id: string) => {
    // Vitals are recorded locally for this session; to persist, integrate with clinical_records
    setSaved(prev => ({ ...prev, [id]: true }));
    setTimeout(() => setSaved(prev => ({ ...prev, [id]: false })), 2000);
  };

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--pro-text)", display: "flex", alignItems: "center", gap: 8 }}>
          <HeartPulse size={20} color="#ec4899" /> 護理師工作台
        </h1>
        <p style={{ fontSize: 13, color: "var(--pro-text-muted)", marginTop: 4 }}>
          病患生命徵象快速記錄、過敏與慢性病警示
        </p>
      </div>

      {/* Quick stats */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { label: "病患總數", value: patients.length, color: "#ec4899", icon: <Users size={16} /> },
          { label: "有過敏記錄", value: patients.filter(p => p.allergies?.length > 0).length, color: "#ef4444", icon: <AlertTriangle size={16} /> },
          { label: "慢性病患者", value: patients.filter(p => p.chronic_conditions?.length > 0).length, color: "#f59e0b", icon: <Activity size={16} /> },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="pro-card" style={{ padding: "12px 18px", display: "flex", alignItems: "center", gap: 12, flex: "1 1 150px" }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", color }}>
              {icon}
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "var(--pro-text)" }}>{value}</div>
              <div style={{ fontSize: 11, color: "var(--pro-text-muted)" }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 14 }}>
        <Users size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--pro-text-muted)", pointerEvents: "none" }} />
        <input
          className="pro-input"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="搜尋病患姓名..."
          style={{ paddingLeft: 32, width: "100%" }}
        />
      </div>

      {/* Patient list with vitals entry */}
      {loading && <div style={{ padding: 32, textAlign: "center", color: "var(--pro-text-muted)" }}>載入中...</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.map(p => {
          const v = getVitals(p.id);
          const alert = vitalsAlert(v);
          const isOpen = expanded === p.id;
          return (
            <div key={p.id} className="pro-card" style={{ padding: 0, overflow: "hidden" }}>
              {/* Row header */}
              <div
                onClick={() => setExpanded(isOpen ? null : p.id)}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", cursor: "pointer" }}
              >
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(236,72,153,0.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ec4899", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                  {p.full_name[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--pro-text)" }}>{p.full_name}</div>
                  <div style={{ fontSize: 11, color: "var(--pro-text-muted)", marginTop: 1 }}>
                    {calcAge(p.date_of_birth)} · {p.sex === "M" ? "男" : p.sex === "F" ? "女" : "其他"}
                    {p.blood_type ? ` · ${p.blood_type}` : ""}
                  </div>
                </div>
                {p.allergies?.length > 0 && (
                  <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 8, background: "rgba(239,68,68,0.1)", color: "#ef4444", fontWeight: 700, flexShrink: 0 }}>
                    過敏 {p.allergies.length}
                  </span>
                )}
                {p.chronic_conditions?.length > 0 && (
                  <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 8, background: "rgba(245,158,11,0.1)", color: "#f59e0b", fontWeight: 700, flexShrink: 0 }}>
                    慢性病 {p.chronic_conditions.length}
                  </span>
                )}
                <span style={{ color: "var(--pro-text-muted)", flexShrink: 0 }}>
                  {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </span>
              </div>

              {/* Expanded: vitals form */}
              {isOpen && (
                <div style={{ borderTop: "1px solid var(--pro-border)", padding: "14px 16px", background: "var(--pro-bg)" }}>
                  {/* Alerts */}
                  {(p.allergies?.length > 0 || p.chronic_conditions?.length > 0) && (
                    <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                      {p.allergies?.length > 0 && (
                        <div style={{ padding: "6px 12px", borderRadius: 7, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: 12, color: "#ef4444" }}>
                          <strong>過敏：</strong>{p.allergies.join("、")}
                        </div>
                      )}
                      {p.chronic_conditions?.length > 0 && (
                        <div style={{ padding: "6px 12px", borderRadius: 7, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", fontSize: 12, color: "#f59e0b" }}>
                          <strong>慢性病：</strong>{p.chronic_conditions.join("、")}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Vitals input grid */}
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--pro-text-muted)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                    <Thermometer size={13} /> 生命徵象記錄
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10, marginBottom: 10 }}>
                    {[
                      { key: "bp_sys" as const, label: "收縮壓 (mmHg)", placeholder: "120" },
                      { key: "bp_dia" as const, label: "舒張壓 (mmHg)", placeholder: "80" },
                      { key: "hr" as const, label: "心跳 (bpm)", placeholder: "72" },
                      { key: "rr" as const, label: "呼吸 (次/分)", placeholder: "16" },
                      { key: "temp" as const, label: "體溫 (°C)", placeholder: "36.8" },
                      { key: "spo2" as const, label: "SpO₂ (%)", placeholder: "98" },
                    ].map(({ key, label, placeholder }) => (
                      <div key={key}>
                        <label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "var(--pro-text-muted)", marginBottom: 3 }}>{label}</label>
                        <input
                          className="pro-input"
                          type="number"
                          value={v[key]}
                          onChange={e => setV(p.id, key, e.target.value)}
                          placeholder={placeholder}
                          style={{ width: "100%", padding: "5px 8px", fontSize: 13 }}
                        />
                      </div>
                    ))}
                  </div>
                  <input
                    className="pro-input"
                    value={v.note}
                    onChange={e => setV(p.id, "note", e.target.value)}
                    placeholder="備注（如：病患主訴、意識狀態）"
                    style={{ width: "100%", marginBottom: 10, fontSize: 13 }}
                  />

                  {/* Alert banner */}
                  {(v.bp_sys || v.hr || v.temp || v.spo2) && (
                    <div style={{
                      padding: "7px 12px", borderRadius: 7, marginBottom: 10, fontSize: 12, fontWeight: 600,
                      background: alert.level === "danger" ? "rgba(239,68,68,0.1)" : alert.level === "warning" ? "rgba(245,158,11,0.1)" : "rgba(34,197,94,0.1)",
                      color: alert.level === "danger" ? "#ef4444" : alert.level === "warning" ? "#f59e0b" : "#22c55e",
                      border: `1px solid ${alert.level === "danger" ? "rgba(239,68,68,0.25)" : alert.level === "warning" ? "rgba(245,158,11,0.25)" : "rgba(34,197,94,0.25)"}`,
                    }}>
                      {alert.msg}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => handleSave(p.id)}
                      className="pro-btn-primary"
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      {saved[p.id] ? <><CheckCircle size={13} /> 已記錄</> : <><HeartPulse size={13} /> 記錄徵象</>}
                    </button>
                    <Link
                      href={`/pro/patients/${p.id}`}
                      style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 7, border: "1px solid var(--pro-border)", background: "transparent", color: "var(--pro-text-muted)", textDecoration: "none", fontSize: 13 }}
                    >
                      查看病歷
                    </Link>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
