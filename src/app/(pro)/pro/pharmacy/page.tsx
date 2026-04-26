"use client";

import { useEffect, useState } from "react";
import {
  FlaskConical, Search, AlertTriangle, BookOpen, Pill,
  ShieldAlert, CheckCircle, Package, RefreshCw, Clock,
  Edit2, X as XIcon, Plus, Save,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";

interface Medication {
  id: string; name_zh: string; name_en: string; generic_name: string | null;
  category: string; uses_zh: string; side_effects_zh: string | null;
  common_dosage: string | null; warnings_zh: string | null;
  interactions: string[] | null; prescription_required: boolean; source: string | null;
}

interface PrescriptionRecord {
  id: string;
  visit_date: string;
  chief_complaint: string | null;
  assessment: string | null;
  prescriptions: PrescriptionItem[];
  dispensed_at: string | null;
  patient: { full_name: string } | null;
  doctor: { full_name: string } | null;
}

interface PrescriptionItem {
  drug: string; generic: string; dose: string;
  frequency: string; route: string; note?: string; nhiCode?: string;
  days?: number;          // 預計使用天數（藥師可調整）
  dispensed?: boolean;
}

export default function PharmacyPage() {
  const [tab, setTab] = useState<"dispense" | "reference">("dispense");
  const [meds, setMeds] = useState<Medication[]>([]);
  const [medsLoading, setMedsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Medication | null>(null);
  const [filterRx, setFilterRx] = useState<"all" | "rx" | "otc">("all");

  // Dispensing state
  const [pendingRx, setPendingRx] = useState<PrescriptionRecord[]>([]);
  const [dispensedRx, setDispensedRx] = useState<PrescriptionRecord[]>([]);
  const [rxLoading, setRxLoading] = useState(true);
  const [dispensing, setDispensing] = useState<string | null>(null);
  const [showDispensed, setShowDispensed] = useState(false);

  // 編輯模式 state（藥師可調整處方）
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedRx, setEditedRx] = useState<PrescriptionItem[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);

  const supabase = createClient();

  const loadMeds = async () => {
    setMedsLoading(true);
    const { data } = await supabase.from("medications").select("*").order("name_zh");
    setMeds((data as Medication[]) || []);
    setMedsLoading(false);
  };

  const loadPrescriptions = async () => {
    setRxLoading(true);
    // 用 local date 格式（與畫面顯示一致），避免 UTC 時差導致跨日漏資料
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    // Query today's clinical records with non-empty prescriptions
    const { data } = await supabase
      .from("clinical_records")
      .select("id, visit_date, chief_complaint, assessment, prescriptions, dispensed_at, patient:patient_id(full_name)")
      .eq("visit_date", today)
      .not("prescriptions", "eq", "[]")
      .not("prescriptions", "is", null)
      .order("created_at", { ascending: false });

    if (data) {
      const records = data as unknown as PrescriptionRecord[];
      setPendingRx(records.filter(r => !r.dispensed_at));
      setDispensedRx(records.filter(r => !!r.dispensed_at));
    }
    setRxLoading(false);
  };

  useEffect(() => {
    loadPrescriptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tab === "reference" && meds.length === 0) loadMeds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const dispense = async (recordId: string) => {
    setDispensing(recordId);
    await supabase.from("clinical_records").update({
      dispensed_at: new Date().toISOString(),
    }).eq("id", recordId);
    await loadPrescriptions();
    setDispensing(null);
  };

  // 進入編輯模式：載入該筆處方供調整
  const startEdit = (record: PrescriptionRecord) => {
    setEditingId(record.id);
    setEditedRx(JSON.parse(JSON.stringify(record.prescriptions)));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditedRx([]);
  };

  const updateField = (idx: number, field: keyof PrescriptionItem, value: string | number) => {
    setEditedRx(prev => prev.map((rx, i) => i === idx ? { ...rx, [field]: value } : rx));
  };

  const removeItem = (idx: number) => {
    setEditedRx(prev => prev.filter((_, i) => i !== idx));
  };

  const addItem = () => {
    setEditedRx(prev => [...prev, {
      drug: "", generic: "", dose: "", frequency: "QD", route: "PO",
      days: 7, note: "",
    }]);
  };

  const saveEdit = async (recordId: string) => {
    setSavingEdit(true);
    await supabase.from("clinical_records").update({
      prescriptions: editedRx,
    }).eq("id", recordId);
    setEditingId(null);
    setEditedRx([]);
    await loadPrescriptions();
    setSavingEdit(false);
  };

  const filtered = meds.filter(m => {
    const matchRx = filterRx === "all" || (filterRx === "rx" ? m.prescription_required : !m.prescription_required);
    const q = search.toLowerCase();
    return matchRx && (!q ||
      m.name_zh.toLowerCase().includes(q) || m.name_en.toLowerCase().includes(q) ||
      (m.generic_name?.toLowerCase().includes(q) ?? false) || m.category.toLowerCase().includes(q));
  });

  return (
    <div style={{ maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--pro-text)", display: "flex", alignItems: "center", gap: 8 }}>
          <FlaskConical size={20} color="#f59e0b" /> 藥師工作台
        </h1>
        <p style={{ fontSize: 12, color: "var(--pro-text-muted)", marginTop: 3 }}>
          處方調配 · 藥物查詢 · 交互作用核對
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "2px solid var(--pro-border)", marginBottom: 20, gap: 0 }}>
        {[
          { key: "dispense", label: "待調配", badge: pendingRx.length },
          { key: "reference", label: "藥物查詢" },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as typeof tab)} style={{
            padding: "10px 20px", background: "none", border: "none", cursor: "pointer",
            fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6,
            borderBottom: tab === t.key ? "2px solid var(--pro-accent)" : "2px solid transparent",
            color: tab === t.key ? "var(--pro-accent)" : "var(--pro-text-muted)",
            marginBottom: -2,
          }}>
            {t.label}
            {t.badge != null && t.badge > 0 && (
              <span style={{
                fontSize: 10, padding: "1px 7px", borderRadius: 20,
                background: "var(--pro-accent)", color: "#fff",
              }}>{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ─── TAB: Dispensing ─── */}
      {tab === "dispense" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: "var(--pro-text-muted)" }}>
              今日需調配處方 — {new Date().toLocaleDateString("zh-TW")}
            </p>
            <button onClick={loadPrescriptions} style={{
              display: "flex", alignItems: "center", gap: 5, padding: "6px 12px",
              borderRadius: 7, border: "1px solid var(--pro-border)",
              background: "var(--pro-surface)", color: "var(--pro-text-muted)",
              cursor: "pointer", fontSize: 12,
            }}>
              <RefreshCw size={12} /> 刷新
            </button>
          </div>

          {rxLoading ? (
            <p style={{ color: "var(--pro-text-muted)", fontSize: 13, padding: "20px 0" }}>載入中…</p>
          ) : pendingRx.length === 0 ? (
            <div style={{
              textAlign: "center", padding: "50px 0",
              border: "1px dashed var(--pro-border)", borderRadius: 10,
              color: "var(--pro-text-muted)",
            }}>
              <Package size={36} style={{ opacity: 0.3, marginBottom: 10 }} />
              <p style={{ fontSize: 14, fontWeight: 600 }}>今日無待調配處方</p>
              <p style={{ fontSize: 12, marginTop: 4 }}>醫師開立的處方會自動出現在此</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {pendingRx.map(record => (
                <div key={record.id} style={{
                  background: "var(--pro-surface)", border: "2px solid rgba(245,158,11,0.3)",
                  borderRadius: 10, padding: 16,
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: "var(--pro-text)" }}>
                          {record.patient?.full_name ?? "未知病患"}
                        </span>
                        <span style={{
                          fontSize: 10, padding: "2px 8px", borderRadius: 10,
                          background: "rgba(245,158,11,0.15)", color: "#f59e0b", fontWeight: 600,
                        }}>
                          待調配
                        </span>
                      </div>
                      {record.chief_complaint && (
                        <p style={{ fontSize: 12, color: "var(--pro-text-muted)", marginTop: 3 }}>
                          主訴：{record.chief_complaint}
                        </p>
                      )}
                      {record.assessment && (
                        <p style={{ fontSize: 11, color: "var(--pro-text-muted)", marginTop: 2 }}>
                          診斷：{record.assessment}
                        </p>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      {editingId === record.id ? (
                        <>
                          <button
                            onClick={() => saveEdit(record.id)}
                            disabled={savingEdit}
                            style={{
                              display: "flex", alignItems: "center", gap: 6,
                              padding: "8px 14px", borderRadius: 8, border: "none",
                              background: savingEdit ? "#4b5563" : "#3b82f6",
                              color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer",
                            }}>
                            <Save size={13} /> {savingEdit ? "儲存中…" : "儲存修改"}
                          </button>
                          <button onClick={cancelEdit}
                            style={{
                              padding: "8px 14px", borderRadius: 8, border: "1px solid var(--pro-border)",
                              background: "transparent", color: "var(--pro-text-muted)",
                              fontSize: 13, cursor: "pointer",
                            }}>取消</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(record)}
                            style={{
                              display: "flex", alignItems: "center", gap: 6,
                              padding: "8px 14px", borderRadius: 8,
                              border: "1px solid var(--pro-border)",
                              background: "transparent", color: "var(--pro-text)",
                              fontSize: 13, cursor: "pointer",
                            }}>
                            <Edit2 size={13} /> 修改處方
                          </button>
                          <button
                            onClick={() => dispense(record.id)}
                            disabled={dispensing === record.id}
                            style={{
                              display: "flex", alignItems: "center", gap: 6,
                              padding: "8px 16px", borderRadius: 8, border: "none",
                              background: dispensing === record.id ? "#4b5563" : "#22c55e",
                              color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer",
                            }}>
                            <CheckCircle size={14} />
                            {dispensing === record.id ? "確認中…" : "完成調配"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Prescription items */}
                  <div style={{ background: "var(--pro-bg)", borderRadius: 7, overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--pro-border)" }}>
                          {["藥物", "學名", "劑量", "頻次", "途徑", "天數", "備註", ...(editingId === record.id ? [""] : [])].map((h, idx) => (
                            <th key={idx} style={{
                              padding: "7px 10px", textAlign: "left", fontWeight: 600,
                              color: "var(--pro-text-muted)", fontSize: 11,
                            }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(editingId === record.id ? editedRx : record.prescriptions as PrescriptionItem[]).map((rx, i) => {
                          const isEdit = editingId === record.id;
                          const inputStyle: React.CSSProperties = {
                            width: "100%", padding: "4px 6px",
                            background: "var(--pro-surface)", border: "1px solid var(--pro-border)",
                            borderRadius: 4, color: "var(--pro-text)", fontSize: 12,
                          };
                          return (
                            <tr key={i} style={{ borderBottom: "1px solid var(--pro-border)" }}>
                              <td style={{ padding: "8px 10px", fontWeight: 600, color: "var(--pro-text)" }}>
                                {isEdit ? <input style={inputStyle} value={rx.drug} onChange={e => updateField(i, "drug", e.target.value)} /> : rx.drug}
                              </td>
                              <td style={{ padding: "8px 10px", color: "var(--pro-text-muted)" }}>
                                {isEdit ? <input style={inputStyle} value={rx.generic} onChange={e => updateField(i, "generic", e.target.value)} /> : rx.generic}
                              </td>
                              <td style={{ padding: "8px 10px", color: "var(--pro-text)" }}>
                                {isEdit ? <input style={{ ...inputStyle, width: 80 }} value={rx.dose} onChange={e => updateField(i, "dose", e.target.value)} /> : rx.dose}
                              </td>
                              <td style={{ padding: "8px 10px", color: "var(--pro-text)" }}>
                                {isEdit ? (
                                  <select style={{ ...inputStyle, width: 76 }} value={rx.frequency} onChange={e => updateField(i, "frequency", e.target.value)}>
                                    {["QD", "BID", "TID", "QID", "Q4H", "Q6H", "Q8H", "PRN", "HS", "AC", "PC"].map(f => <option key={f} value={f}>{f}</option>)}
                                  </select>
                                ) : rx.frequency}
                              </td>
                              <td style={{ padding: "8px 10px", color: "var(--pro-text-muted)" }}>
                                {isEdit ? (
                                  <select style={{ ...inputStyle, width: 64 }} value={rx.route} onChange={e => updateField(i, "route", e.target.value)}>
                                    {["PO", "IV", "IM", "SC", "SL", "PR", "INH", "TOP"].map(r => <option key={r} value={r}>{r}</option>)}
                                  </select>
                                ) : rx.route}
                              </td>
                              <td style={{ padding: "8px 10px", color: "var(--pro-accent)", fontWeight: 600 }}>
                                {isEdit ? (
                                  <input type="number" min={1} max={90} style={{ ...inputStyle, width: 60 }} value={rx.days ?? 7} onChange={e => updateField(i, "days", Number(e.target.value))} />
                                ) : `${rx.days ?? 7} 天`}
                              </td>
                              <td style={{ padding: "8px 10px", color: "#f59e0b", fontSize: 11 }}>
                                {isEdit ? <input style={inputStyle} value={rx.note ?? ""} onChange={e => updateField(i, "note", e.target.value)} placeholder="備註" /> : (rx.note ?? "—")}
                              </td>
                              {isEdit && (
                                <td style={{ padding: "8px 6px", width: 30 }}>
                                  <button onClick={() => removeItem(i)} title="移除此項"
                                    style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: 4 }}>
                                    <XIcon size={14} />
                                  </button>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {editingId === record.id && (
                      <div style={{ padding: "8px 10px", borderTop: "1px solid var(--pro-border)" }}>
                        <button onClick={addItem}
                          style={{
                            display: "flex", alignItems: "center", gap: 5,
                            padding: "5px 10px", borderRadius: 6,
                            border: "1px dashed var(--pro-border)",
                            background: "transparent", color: "var(--pro-accent)",
                            fontSize: 12, cursor: "pointer",
                          }}>
                          <Plus size={12} /> 新增藥物
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Already dispensed section */}
          {dispensedRx.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <button
                onClick={() => setShowDispensed(!showDispensed)}
                style={{
                  display: "flex", alignItems: "center", gap: 6, background: "none", border: "none",
                  cursor: "pointer", fontSize: 12, color: "var(--pro-text-muted)", padding: 0, marginBottom: 10,
                }}>
                <Clock size={13} /> 今日已調配 ({dispensedRx.length}) {showDispensed ? "▲" : "▼"}
              </button>
              {showDispensed && dispensedRx.map(record => (
                <div key={record.id} style={{
                  background: "var(--pro-surface)", border: "1px solid var(--pro-border)",
                  borderRadius: 10, padding: 14, marginBottom: 8, opacity: 0.8,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <CheckCircle size={14} color="#22c55e" />
                    <span style={{ fontWeight: 600, fontSize: 13, color: "var(--pro-text)" }}>
                      {record.patient?.full_name ?? "—"}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--pro-text-muted)" }}>
                      已於 {record.dispensed_at ? new Date(record.dispensed_at).toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" }) : "—"} 調配
                    </span>
                    <span style={{ fontSize: 11, color: "var(--pro-text-muted)" }}>
                      共 {record.prescriptions.length} 項藥品
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB: Drug Reference ─── */}
      {tab === "reference" && (
        <div>
          {/* Stats */}
          <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
            {[
              { label: "藥物總數", value: meds.length, color: "#6366f1", icon: <Pill size={15} /> },
              { label: "處方藥（Rx）", value: meds.filter(m => m.prescription_required).length, color: "#ef4444", icon: <ShieldAlert size={15} /> },
              { label: "成藥（OTC）", value: meds.filter(m => !m.prescription_required).length, color: "#22c55e", icon: <CheckCircle size={15} /> },
            ].map(({ label, value, color, icon }) => (
              <div key={label} className="pro-card" style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, flex: "1 1 140px" }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", color }}>{icon}</div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "var(--pro-text)" }}>{value}</div>
                  <div style={{ fontSize: 11, color: "var(--pro-text-muted)" }}>{label}</div>
                </div>
              </div>
            ))}
            <Link href="/pro/drugs" className="pro-card" style={{
              padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, flex: "1 1 140px",
              textDecoration: "none", border: "1px dashed var(--pro-border)",
            }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(245,158,11,0.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "#f59e0b" }}>
                <AlertTriangle size={15} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--pro-text)" }}>交互作用</div>
                <div style={{ fontSize: 11, color: "var(--pro-accent)" }}>前往檢查 →</div>
              </div>
            </Link>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 360px" : "1fr", gap: 16 }}>
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
                  <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--pro-text-muted)", pointerEvents: "none" }} />
                  <input className="pro-input" value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="搜尋藥名（中文 / 英文 / 學名 / 分類）..."
                    style={{ paddingLeft: 32, width: "100%" }} />
                </div>
                <div style={{ display: "flex", gap: 4, background: "var(--pro-bg)", border: "1px solid var(--pro-border)", borderRadius: 8, padding: 3 }}>
                  {(["all", "rx", "otc"] as const).map(f => (
                    <button key={f} onClick={() => setFilterRx(f)} style={{
                      padding: "4px 12px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
                      background: filterRx === f ? "var(--pro-accent)" : "transparent",
                      color: filterRx === f ? "#fff" : "var(--pro-text-muted)",
                    }}>
                      {f === "all" ? "全部" : f === "rx" ? "Rx" : "OTC"}
                    </button>
                  ))}
                </div>
                <span style={{ fontSize: 12, color: "var(--pro-text-muted)", alignSelf: "center" }}>{filtered.length} 筆</span>
              </div>

              <div style={{ borderRadius: 10, border: "1px solid var(--pro-border)", overflow: "hidden" }}>
                {medsLoading && <div style={{ padding: 32, textAlign: "center", color: "var(--pro-text-muted)" }}>載入中...</div>}
                {!medsLoading && filtered.length === 0 && <div style={{ padding: 32, textAlign: "center", color: "var(--pro-text-muted)" }}>無符合藥物</div>}
                {filtered.map((m, i) => (
                  <div key={m.id} onClick={() => setSelected(prev => prev?.id === m.id ? null : m)} style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                    borderBottom: i < filtered.length - 1 ? "1px solid var(--pro-border)" : "none",
                    background: selected?.id === m.id ? "var(--pro-accent-dim)" : "var(--pro-sidebar)",
                    cursor: "pointer",
                  }}>
                    <span style={{ padding: "2px 7px", borderRadius: 4, fontSize: 10, fontWeight: 700, flexShrink: 0,
                      background: m.prescription_required ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.12)",
                      color: m.prescription_required ? "#ef4444" : "#22c55e" }}>
                      {m.prescription_required ? "Rx" : "OTC"}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--pro-text)" }}>{m.name_zh}</div>
                      <div style={{ fontSize: 11, color: "var(--pro-text-muted)", marginTop: 1 }}>
                        {m.name_en}{m.generic_name ? ` · ${m.generic_name}` : ""}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--pro-text-muted)", flexShrink: 0 }}>{m.category}</div>
                    {m.interactions && m.interactions.length > 0 && <AlertTriangle size={12} color="#f59e0b" />}
                  </div>
                ))}
              </div>
            </div>

            {selected && (
              <div className="pro-card" style={{ padding: 20, height: "fit-content", position: "sticky", top: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "var(--pro-text)" }}>{selected.name_zh}</div>
                    <div style={{ fontSize: 12, color: "var(--pro-text-muted)", marginTop: 2 }}>{selected.name_en}{selected.generic_name ? ` (${selected.generic_name})` : ""}</div>
                  </div>
                  <span style={{ padding: "3px 9px", borderRadius: 6, fontSize: 11, fontWeight: 700, height: "fit-content",
                    background: selected.prescription_required ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.12)",
                    color: selected.prescription_required ? "#ef4444" : "#22c55e" }}>
                    {selected.prescription_required ? "Rx" : "OTC"}
                  </span>
                </div>
                {[
                  { label: "適應症", value: selected.uses_zh },
                  { label: "常見劑量", value: selected.common_dosage },
                  { label: "副作用", value: selected.side_effects_zh },
                  { label: "警告", value: selected.warnings_zh, danger: true },
                ].map(({ label, value, danger }) => value ? (
                  <div key={label} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: danger ? "var(--pro-danger)" : "var(--pro-text-muted)", marginBottom: 3 }}>{label}</div>
                    <div style={{ fontSize: 13, color: "var(--pro-text)", lineHeight: 1.6 }}>{value}</div>
                  </div>
                ) : null)}
                {selected.interactions && selected.interactions.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b", marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
                      <AlertTriangle size={11} /> 交互作用（{selected.interactions.length}）
                    </div>
                    {selected.interactions.map(i => (
                      <div key={i} style={{ fontSize: 12, padding: "4px 8px", borderRadius: 5, marginBottom: 3, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", color: "var(--pro-text)" }}>{i}</div>
                    ))}
                  </div>
                )}
                <Link href={`/pro/drugs?q=${encodeURIComponent(selected.name_en)}`} style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px",
                  borderRadius: 7, background: "rgba(245,158,11,0.1)", color: "#f59e0b",
                  textDecoration: "none", fontSize: 13, fontWeight: 600, marginTop: 10,
                  border: "1px solid rgba(245,158,11,0.2)",
                }}>
                  <AlertTriangle size={13} /> 開啟交互作用檢查
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
