"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, FileText, Printer, Trash2, ChevronDown, ChevronUp, Edit3, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { calculateAge } from "@/lib/pro/patientUtils";
import { generateClinicalReportHTML, printReport } from "@/lib/pro/reportExport";
import { REFERENCE_RANGES } from "@/lib/referenceRanges";

interface Patient {
  id: string; doctor_id: string; full_name: string;
  date_of_birth: string | null; sex: "M" | "F" | "Other" | null;
  id_number: string | null; nhi_number: string | null;
  phone: string | null; email: string | null;
  blood_type: string | null; allergies: string[]; chronic_conditions: string[];
  notes: string | null; created_at: string; updated_at: string;
}

interface ClinicalRecord {
  id: string; visit_date: string; chief_complaint: string | null;
  subjective: string | null; objective: Record<string, unknown>;
  assessment: string | null; plan: string | null;
  icd10_codes: string[]; ai_analysis: string | null; created_at: string;
  diagnosis_accuracy: "correct" | "partial" | "incorrect" | null;
}

interface SOAPNote {
  id: string; title: string | null; draft: boolean; created_at: string; updated_at: string;
}

interface TrendPoint { date: string; value: number; }

function TrendChart({ metricKey, points, sex }: { metricKey: string; points: TrendPoint[]; sex: "M" | "F" | "Other" | null }) {
  const ref = REFERENCE_RANGES.find(r => r.key === metricKey);
  const normalRange = ref?.normal?.general
    ?? (sex === "M" ? ref?.normal?.male : sex === "F" ? ref?.normal?.female : undefined)
    ?? ref?.normal?.general;

  const W = 360, H = 110, PAD = { t: 18, r: 16, b: 28, l: 38 };
  const values = points.map(p => p.value);
  const extValues = [...values];
  if (normalRange?.min != null) extValues.push(normalRange.min * 0.95);
  if (normalRange?.max != null) extValues.push(normalRange.max * 1.05);
  const yMin = Math.min(...extValues);
  const yMax = Math.max(...extValues);
  const yRange = yMax - yMin || 1;

  const toX = (i: number) => PAD.l + (points.length === 1 ? (W - PAD.l - PAD.r) / 2 : (i / (points.length - 1)) * (W - PAD.l - PAD.r));
  const toY = (v: number) => PAD.t + (1 - (v - yMin) / yRange) * (H - PAD.t - PAD.b);

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${toX(i).toFixed(1)} ${toY(p.value).toFixed(1)}`).join(" ");
  const last = points[points.length - 1];
  const first = points[0];
  const pctChange = points.length >= 2 ? ((last.value - first.value) / (first.value || 1)) * 100 : null;

  return (
    <div style={{ padding: "12px 14px", borderRadius: 8, border: "1px solid var(--pro-border)", background: "var(--pro-card)" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--pro-text)" }}>{ref?.label_zh ?? metricKey}</span>
        <span style={{ fontSize: 10, color: "var(--pro-text-muted)" }}>{ref?.unit}</span>
      </div>
      {normalRange?.min != null && normalRange?.max != null && (
        <div style={{ fontSize: 9, color: "#22c55e", marginBottom: 2 }}>
          正常：{normalRange.min}–{normalRange.max}
        </div>
      )}
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible", display: "block" }}>
        {/* Reference range band */}
        {normalRange?.min != null && normalRange?.max != null && (
          <rect
            x={PAD.l} y={toY(normalRange.max)}
            width={W - PAD.l - PAD.r}
            height={Math.max(0, toY(normalRange.min) - toY(normalRange.max))}
            fill="rgba(34,197,94,0.1)" rx={2}
          />
        )}
        {/* Y axis labels */}
        <text x={PAD.l - 4} y={PAD.t + 4} style={{ fontSize: 8 }} fill="var(--pro-text-muted)" textAnchor="end">{yMax.toFixed(1)}</text>
        <text x={PAD.l - 4} y={H - PAD.b} style={{ fontSize: 8 }} fill="var(--pro-text-muted)" textAnchor="end">{yMin.toFixed(1)}</text>
        {/* Line */}
        {points.length >= 2 && (
          <path d={pathD} stroke="var(--pro-accent)" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        )}
        {/* Dots */}
        {points.map((p, i) => {
          const lo = normalRange?.min; const hi = normalRange?.max;
          const abnormal = (lo != null && p.value < lo) || (hi != null && p.value > hi);
          return (
            <g key={i}>
              <circle cx={toX(i)} cy={toY(p.value)} r={4}
                fill={abnormal ? "#ef4444" : "var(--pro-accent)"}
                stroke="var(--pro-card)" strokeWidth={1.5}
              />
              {/* Value label above last dot */}
              {i === points.length - 1 && (
                <text x={toX(i)} y={toY(p.value) - 7} textAnchor="middle"
                  style={{ fontSize: 10, fontWeight: 700 }} fill={abnormal ? "#ef4444" : "var(--pro-text)"}>
                  {p.value}
                </text>
              )}
            </g>
          );
        })}
        {/* X-axis date labels */}
        {points.map((p, i) => (
          <text key={i} x={toX(i)} y={H - PAD.b + 12} textAnchor="middle" style={{ fontSize: 8 }} fill="var(--pro-text-muted)">
            {p.date.slice(5)}
          </text>
        ))}
      </svg>
      {pctChange !== null && (
        <div style={{ fontSize: 10, marginTop: 2, color: pctChange > 0 ? "#f59e0b" : "#22c55e" }}>
          {pctChange > 0 ? "↑" : "↓"} {Math.abs(pctChange).toFixed(1)}% vs 初次記錄
        </div>
      )}
    </div>
  );
}

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [records, setRecords] = useState<ClinicalRecord[]>([]);
  const [notes, setNotes] = useState<SOAPNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);
  const [doctorName, setDoctorName] = useState("");
  const [institution, setInstitution] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [
        { data: p },
        { data: r },
        { data: n },
        { data: prof },
      ] = await Promise.all([
        supabase.from("doctor_patients").select("*").eq("id", id).single(),
        supabase.from("clinical_records").select("*").eq("patient_id", id).order("visit_date", { ascending: false }),
        supabase.from("soap_notes").select("id, title, draft, created_at, updated_at").eq("patient_id", id).order("updated_at", { ascending: false }),
        supabase.from("profiles").select("name, institution").eq("id", user.id).single(),
      ]);

      setPatient(p);
      setRecords(r || []);
      setNotes(n || []);
      setDoctorName(prof?.name || "");
      setInstitution(prof?.institution || "");
      setLoading(false);
    };
    load();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm(`確定要刪除病患「${patient?.full_name}」的所有記錄？此操作無法復原。`)) return;
    setDeleting(true);
    const supabase = createClient();
    await supabase.from("doctor_patients").delete().eq("id", id);
    router.push("/pro/patients");
  };

  const updateAccuracy = async (recordId: string, accuracy: "correct" | "partial" | "incorrect" | null) => {
    const supabase = createClient();
    await supabase.from("clinical_records")
      .update({ diagnosis_accuracy: accuracy })
      .eq("id", recordId);
    setRecords(prev => prev.map(r => r.id === recordId ? { ...r, diagnosis_accuracy: accuracy } : r));
  };

  const printLatest = () => {
    if (!patient || records.length === 0) return;
    const r = records[0];
    const html = generateClinicalReportHTML({
      patient,
      visitDate: r.visit_date,
      chiefComplaint: r.chief_complaint || "",
      subjective: r.subjective || "",
      objective: r.objective as Record<string, number | string>,
      assessment: r.assessment || "",
      plan: r.plan || "",
      icd10Codes: r.icd10_codes,
      aiAnalysis: r.ai_analysis || "",
      doctorName, institution,
    });
    printReport(html);
  };

  if (loading) return <div style={{ color: "var(--pro-text-muted)", padding: 40 }}>載入中...</div>;
  if (!patient) return <div style={{ color: "var(--pro-text-muted)", padding: 40 }}>病患不存在</div>;

  const age = calculateAge(patient.date_of_birth);
  const sex = patient.sex === "M" ? "男" : patient.sex === "F" ? "女" : "—";

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 24 }}>
        <Link href="/pro/patients" className="pro-btn-ghost" style={{ padding: "7px 10px", flexShrink: 0 }}>
          <ArrowLeft size={15} />
        </Link>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 52, height: 52, borderRadius: "50%",
              background: "var(--pro-accent-dim)", border: "2px solid rgba(59,130,246,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, fontWeight: 800, color: "var(--pro-accent)", flexShrink: 0,
            }}>
              {patient.full_name.charAt(0)}
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--pro-text)" }}>{patient.full_name}</h1>
              <p style={{ fontSize: 13, color: "var(--pro-text-muted)", marginTop: 2 }}>
                {sex}{age !== null ? ` · ${age}歲` : ""}
                {patient.blood_type ? ` · ${patient.blood_type}型` : ""}
                {patient.date_of_birth ? ` · ${new Date(patient.date_of_birth).toLocaleDateString("zh-TW")}` : ""}
              </p>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button className="pro-btn-ghost" onClick={printLatest} title="列印最近記錄">
            <Printer size={14} /> 列印
          </button>
          <Link href={`/pro/patients/${id}/records/new`} className="pro-btn-primary">
            <Plus size={14} /> 新增記錄
          </Link>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16 }}>
        {/* Left: patient info */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="pro-card" style={{ padding: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--pro-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>
              基本資料
            </div>
            {[
              { l: "電話", v: patient.phone },
              { l: "Email", v: patient.email },
              { l: "身分證", v: patient.id_number ? `${patient.id_number.slice(0, 3)}****${patient.id_number.slice(-3)}` : null },
              { l: "健保卡號", v: patient.nhi_number },
            ].map(({ l, v }) => v ? (
              <div key={l} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: "var(--pro-text-muted)", marginBottom: 2 }}>{l}</div>
                <div style={{ fontSize: 13, color: "var(--pro-text)" }}>{v}</div>
              </div>
            ) : null)}
            {patient.notes && (
              <div style={{ marginTop: 10, padding: "10px 12px", background: "var(--pro-bg)", borderRadius: 6, fontSize: 12, color: "var(--pro-text-muted)", lineHeight: 1.6 }}>
                {patient.notes}
              </div>
            )}
          </div>

          {patient.allergies?.length > 0 && (
            <div className="pro-card" style={{ padding: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--pro-danger)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                ⚠ 過敏史
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {patient.allergies.map(a => <span key={a} className="pro-badge pro-badge-red">{a}</span>)}
              </div>
            </div>
          )}

          {patient.chronic_conditions?.length > 0 && (
            <div className="pro-card" style={{ padding: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--pro-warning)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                慢性疾病
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {patient.chronic_conditions.map(c => <span key={c} className="pro-badge pro-badge-yellow">{c}</span>)}
              </div>
            </div>
          )}

          <button className="pro-btn-danger" onClick={handleDelete} disabled={deleting} style={{ width: "100%", justifyContent: "center" }}>
            <Trash2 size={13} />
            {deleting ? "刪除中..." : "刪除病患"}
          </button>
        </div>

        {/* Right: records & notes */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Clinical records */}
          <div className="pro-card" style={{ padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--pro-text)" }}>
                臨床記錄 ({records.length})
              </div>
              <Link href={`/pro/patients/${id}/records/new`} className="pro-btn-primary" style={{ fontSize: 12, padding: "6px 12px" }}>
                <Plus size={12} /> 新增
              </Link>
            </div>
            {records.length === 0 ? (
              <p style={{ color: "var(--pro-text-muted)", fontSize: 13 }}>尚無臨床記錄</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {records.map(r => (
                  <div key={r.id} style={{ border: "1px solid var(--pro-border)", borderRadius: 8, overflow: "hidden" }}>
                    <div
                      onClick={() => setExpandedRecord(expandedRecord === r.id ? null : r.id)}
                      style={{ padding: "10px 16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--pro-card)", gap: 8 }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--pro-text)", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span>{r.visit_date}</span>
                          {r.chief_complaint && <span style={{ color: "var(--pro-text-muted)", fontWeight: 400 }}>— {r.chief_complaint}</span>}
                          {/* 準確率快速標記（摺疊時也看得到）*/}
                          {r.diagnosis_accuracy && (
                            <span style={{
                              fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 10,
                              background: r.diagnosis_accuracy === "correct" ? "rgba(34,197,94,0.12)" : r.diagnosis_accuracy === "partial" ? "rgba(245,158,11,0.12)" : "rgba(239,68,68,0.12)",
                              color: r.diagnosis_accuracy === "correct" ? "#22c55e" : r.diagnosis_accuracy === "partial" ? "#f59e0b" : "#ef4444",
                              border: `1px solid ${r.diagnosis_accuracy === "correct" ? "rgba(34,197,94,0.3)" : r.diagnosis_accuracy === "partial" ? "rgba(245,158,11,0.3)" : "rgba(239,68,68,0.3)"}`,
                            }}>
                              {r.diagnosis_accuracy === "correct" ? "✓ 正確" : r.diagnosis_accuracy === "partial" ? "△ 部分" : "✗ 有誤"}
                            </span>
                          )}
                        </div>
                        {r.icd10_codes?.length > 0 && (
                          <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
                            {r.icd10_codes.map(c => (
                              <code key={c} style={{ fontSize: 10, background: "var(--pro-accent-dim)", color: "var(--pro-accent)", padding: "1px 5px", borderRadius: 3 }}>{c}</code>
                            ))}
                          </div>
                        )}
                      </div>
                      {expandedRecord === r.id ? <ChevronUp size={14} color="var(--pro-text-muted)" style={{ flexShrink: 0 }} /> : <ChevronDown size={14} color="var(--pro-text-muted)" style={{ flexShrink: 0 }} />}
                    </div>
                    {expandedRecord === r.id && (
                      <div style={{ padding: "14px 16px", background: "var(--pro-bg)", borderTop: "1px solid var(--pro-border)" }}>
                        {[
                          { label: "主訴 (CC)", value: r.chief_complaint },
                          { label: "主觀 (S)", value: r.subjective },
                          { label: "評估 (A)", value: r.assessment },
                          { label: "計畫 (P)", value: r.plan },
                        ].map(({ label, value }) => value ? (
                          <div key={label} style={{ marginBottom: 10 }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--pro-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>{label}</div>
                            <div style={{ fontSize: 13, color: "var(--pro-text)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{value}</div>
                          </div>
                        ) : null)}
                        {r.ai_analysis && (
                          <div style={{ marginTop: 12, padding: 12, background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.15)", borderRadius: 7 }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--pro-accent)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>AI 臨床輔助分析</div>
                            <div style={{ fontSize: 12, color: "var(--pro-text-muted)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{r.ai_analysis}</div>
                          </div>
                        )}

                        {/* 診斷準確率回饋 */}
                        <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--pro-border)" }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--pro-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                            診斷回饋（用於準確率統計）
                          </div>
                          <div style={{ display: "flex", gap: 6 }}>
                            {([
                              { val: "correct",   label: "✓ 診斷正確", bg: "rgba(34,197,94,0.12)",   color: "#22c55e",  border: "rgba(34,197,94,0.4)"  },
                              { val: "partial",   label: "△ 部分正確", bg: "rgba(245,158,11,0.12)", color: "#f59e0b",  border: "rgba(245,158,11,0.4)" },
                              { val: "incorrect", label: "✗ 診斷有誤", bg: "rgba(239,68,68,0.12)",  color: "#ef4444",  border: "rgba(239,68,68,0.4)"  },
                            ] as const).map(({ val, label, bg, color, border }) => {
                              const isActive = r.diagnosis_accuracy === val;
                              return (
                                <button
                                  key={val}
                                  onClick={() => updateAccuracy(r.id, isActive ? null : val)}
                                  style={{
                                    padding: "5px 12px", borderRadius: 6, fontSize: 12, cursor: "pointer",
                                    border: `1.5px solid ${isActive ? border : "var(--pro-border)"}`,
                                    background: isActive ? bg : "transparent",
                                    color: isActive ? color : "var(--pro-text-muted)",
                                    fontWeight: isActive ? 700 : 400,
                                    transition: "all 0.1s",
                                  }}
                                >
                                  {label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Health Trend Charts */}
          {(() => {
            const sorted = [...records].reverse();
            const allKeys = Array.from(new Set(sorted.flatMap(r => Object.keys(r.objective as Record<string, unknown>))));
            const trendKeys = allKeys.filter(k =>
              sorted.filter(r => typeof (r.objective as Record<string, unknown>)[k] === "number").length >= 2
            );
            if (trendKeys.length === 0) return null;
            return (
              <div className="pro-card" style={{ padding: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--pro-text)", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                  <TrendingUp size={15} color="var(--pro-accent)" /> 健康趨勢
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {trendKeys.map(k => {
                    const points: TrendPoint[] = sorted
                      .filter(r => typeof (r.objective as Record<string, unknown>)[k] === "number")
                      .map(r => ({ date: r.visit_date, value: (r.objective as Record<string, number>)[k] }));
                    return <TrendChart key={k} metricKey={k} points={points} sex={patient.sex} />;
                  })}
                </div>
              </div>
            );
          })()}

          {/* SOAP Notes */}
          {notes.length > 0 && (
            <div className="pro-card" style={{ padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--pro-text)", marginBottom: 12 }}>SOAP 筆記 ({notes.length})</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {notes.map(n => (
                  <Link key={n.id} href={`/pro/notes/${n.id}`} style={{ textDecoration: "none" }}>
                    <div style={{ padding: "10px 14px", borderRadius: 7, display: "flex", alignItems: "center", gap: 10, background: "var(--pro-card-hover)", transition: "background 0.15s" }}>
                      <FileText size={13} color="var(--pro-text-muted)" />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: "var(--pro-text)" }}>{n.title || "未命名筆記"}</div>
                        <div style={{ fontSize: 11, color: "var(--pro-text-muted)" }}>{new Date(n.updated_at).toLocaleDateString("zh-TW")}</div>
                      </div>
                      {n.draft && <span className="pro-badge pro-badge-yellow" style={{ fontSize: 10 }}>草稿</span>}
                      <Edit3 size={12} color="var(--pro-text-muted)" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
