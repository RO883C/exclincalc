"use client";

import { useState } from "react";
import { Pill, Sparkles, ShieldAlert, UserPlus, X, Search, ClipboardList } from "lucide-react";
import DrugTokenInput from "@/components/pro/DrugTokenInput";
import InteractionMatrix from "@/components/pro/InteractionMatrix";
import { checkInteractions, getWorstSeverity, SEVERITY_LABEL, type InteractionResult } from "@/lib/pro/drugInteractions";
import { createClient } from "@/lib/supabase";

// Parse drug names from clinical record plan text (format: "處方：藥名 劑量 頻率、藥名 劑量 頻率")
function parsePrescriptionDrugs(plan: string): string[] {
  const match = plan.match(/處方[：:]\s*(.+?)(?:\n|$)/);
  if (!match) return [];
  return match[1]
    .split(/[、,，]+/)
    .map(item => item.trim().split(/\s+/)[0])
    .filter(s => s.length > 1);
}

export default function DrugInteractionPage() {
  const [drugs, setDrugs] = useState<string[]>([]);
  const [interactions, setInteractions] = useState<InteractionResult[]>([]);
  const [aiNarrative, setAiNarrative] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Import modal state
  const [showImport, setShowImport] = useState(false);
  const [importTab, setImportTab] = useState<"patient" | "bulk">("patient");
  const [importPatients, setImportPatients] = useState<{ id: string; full_name: string }[]>([]);
  const [importSearch, setImportSearch] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [importPatientId, setImportPatientId] = useState<string | null>(null);
  const [importPatientName, setImportPatientName] = useState("");
  const [parsedDrugs, setParsedDrugs] = useState<string[]>([]);
  const [selectedParsed, setSelectedParsed] = useState<Set<string>>(new Set());
  const [bulkText, setBulkText] = useState("");

  const handleDrugsChange = async (newDrugs: string[]) => {
    setDrugs(newDrugs);
    if (newDrugs.length < 2) { setInteractions([]); return; }

    const supabase = createClient();
    const { data: meds } = await supabase
      .from("medications")
      .select("name_zh, name_en, generic_name, interactions")
      .in("name_zh", newDrugs);

    const results = checkInteractions(newDrugs, meds || []);
    setInteractions(results);
  };

  const openImport = async () => {
    setShowImport(true);
    setImportTab("patient");
    setImportPatientId(null);
    setParsedDrugs([]);
    setSelectedParsed(new Set());
    setBulkText("");
    setImportLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setImportLoading(false); return; }
    const { data } = await supabase
      .from("doctor_patients")
      .select("id, full_name")
      .eq("doctor_id", user.id)
      .order("full_name");
    setImportPatients(data || []);
    setImportLoading(false);
  };

  const handleSelectPatient = async (patientId: string, name: string) => {
    setImportPatientId(patientId);
    setImportPatientName(name);
    const supabase = createClient();
    const { data } = await supabase
      .from("clinical_records")
      .select("plan, visit_date")
      .eq("patient_id", patientId)
      .order("visit_date", { ascending: false })
      .limit(5);

    const allDrugs: string[] = [];
    for (const rec of (data || [])) {
      if (rec.plan) allDrugs.push(...parsePrescriptionDrugs(rec.plan));
    }
    const unique = [...new Set(allDrugs)];
    setParsedDrugs(unique);
    setSelectedParsed(new Set(unique));
  };

  const applyPatientImport = () => {
    const toAdd = parsedDrugs.filter(d => selectedParsed.has(d));
    const merged = [...new Set([...drugs, ...toAdd])];
    handleDrugsChange(merged);
    setShowImport(false);
  };

  const applyBulkImport = () => {
    const lines = bulkText.split(/[\n,，、]+/).map(s => s.trim()).filter(s => s.length > 1);
    const merged = [...new Set([...drugs, ...lines])];
    handleDrugsChange(merged);
    setShowImport(false);
    setBulkText("");
  };

  const filteredImportPatients = importPatients.filter(p =>
    !importSearch || p.full_name.toLowerCase().includes(importSearch.toLowerCase())
  );

  const handleAI = async () => {
    if (drugs.length < 2) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/pro/drug-interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drugs }),
      });
      const json = await res.json();
      setAiNarrative(json.aiNarrative || json.error || "分析失敗");
    } finally {
      setAiLoading(false);
    }
  };

  const worst = getWorstSeverity(interactions);
  const worstStyle = SEVERITY_LABEL[worst];

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--pro-text)", display: "flex", alignItems: "center", gap: 8 }}>
          <Pill size={20} color="var(--pro-accent)" /> 藥物交互作用查詢
        </h1>
        <p style={{ fontSize: 13, color: "var(--pro-text-muted)", marginTop: 4 }}>
          輸入多種藥物名稱，自動偵測潛在交互作用
        </p>
      </div>

      <div className="pro-card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--pro-text-muted)" }}>
            輸入藥物（可輸入中文、英文或學名）
          </label>
          <button
            onClick={openImport}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 6, border: "1px solid var(--pro-border)", background: "transparent", color: "var(--pro-text-muted)", cursor: "pointer", fontSize: 12 }}
          >
            <UserPlus size={12} /> 從病患匯入
          </button>
        </div>
        <DrugTokenInput selected={drugs} onChange={handleDrugsChange} />
        {drugs.length > 0 && (
          <div style={{ marginTop: 8, fontSize: 12, color: "var(--pro-text-muted)" }}>
            已選擇 {drugs.length} 種藥物 · {drugs.length >= 2 ? `${(drugs.length * (drugs.length - 1)) / 2} 個配對` : "至少需要 2 種藥物"}
          </div>
        )}
      </div>

      {/* Import modal */}
      {showImport && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "var(--pro-sidebar)", border: "1px solid var(--pro-border)", borderRadius: 14, width: "100%", maxWidth: 480, maxHeight: "85vh", display: "flex", flexDirection: "column" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid var(--pro-border)", flexShrink: 0 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--pro-text)" }}>匯入藥物清單</span>
              <button onClick={() => setShowImport(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--pro-text-muted)" }}><X size={16} /></button>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--pro-border)", flexShrink: 0 }}>
              {(["patient", "bulk"] as const).map(tab => (
                <button key={tab} onClick={() => setImportTab(tab)} style={{
                  flex: 1, padding: "10px 0", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
                  background: "transparent",
                  color: importTab === tab ? "var(--pro-accent)" : "var(--pro-text-muted)",
                  borderBottom: importTab === tab ? "2px solid var(--pro-accent)" : "2px solid transparent",
                }}>
                  {tab === "patient" ? <><UserPlus size={12} style={{ display: "inline", marginRight: 4 }} />從病患病歷</> : <><ClipboardList size={12} style={{ display: "inline", marginRight: 4 }} />批量輸入</>}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div style={{ flex: 1, overflow: "auto", padding: "14px 18px" }}>
              {importTab === "patient" ? (
                importPatientId === null ? (
                  <>
                    <div style={{ fontSize: 12, color: "var(--pro-text-muted)", marginBottom: 10 }}>
                      選擇病患以從其最近 5 次就診病歷中擷取處方藥物
                    </div>
                    <div style={{ position: "relative", marginBottom: 10 }}>
                      <Search size={12} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "var(--pro-text-muted)" }} />
                      <input className="pro-input" value={importSearch} onChange={e => setImportSearch(e.target.value)} placeholder="搜尋病患姓名..." style={{ paddingLeft: 28, width: "100%" }} />
                    </div>
                    {importLoading ? (
                      <div style={{ color: "var(--pro-text-muted)", fontSize: 13, textAlign: "center", padding: 20 }}>載入中...</div>
                    ) : filteredImportPatients.length === 0 ? (
                      <div style={{ color: "var(--pro-text-muted)", fontSize: 13, textAlign: "center", padding: 20 }}>無病患資料</div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {filteredImportPatients.map(p => (
                          <button key={p.id} onClick={() => handleSelectPatient(p.id, p.full_name)} style={{
                            padding: "10px 12px", borderRadius: 7, border: "1px solid var(--pro-border)",
                            background: "transparent", color: "var(--pro-text)", cursor: "pointer", textAlign: "left", fontSize: 13,
                          }}
                            onMouseEnter={e => (e.currentTarget.style.background = "var(--pro-bg)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                          >
                            {p.full_name}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <button onClick={() => { setImportPatientId(null); setParsedDrugs([]); setSelectedParsed(new Set()); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--pro-text-muted)", fontSize: 11 }}>← 返回</button>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--pro-text)" }}>{importPatientName}</span>
                    </div>
                    {parsedDrugs.length === 0 ? (
                      <div style={{ color: "var(--pro-text-muted)", fontSize: 13, padding: "12px 0" }}>
                        此病患近期病歷中未找到處方記錄（計畫欄位中需包含「處方：...」格式）
                      </div>
                    ) : (
                      <>
                        <div style={{ fontSize: 12, color: "var(--pro-text-muted)", marginBottom: 8 }}>
                          從近 5 次就診病歷中擷取到 {parsedDrugs.length} 種藥物，勾選後匯入：
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {parsedDrugs.map(d => (
                            <label key={d} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "6px 10px", borderRadius: 7, background: selectedParsed.has(d) ? "var(--pro-accent-dim)" : "var(--pro-bg)", border: `1px solid ${selectedParsed.has(d) ? "rgba(59,130,246,0.3)" : "var(--pro-border)"}` }}>
                              <input type="checkbox" checked={selectedParsed.has(d)} onChange={e => {
                                const next = new Set(selectedParsed);
                                e.target.checked ? next.add(d) : next.delete(d);
                                setSelectedParsed(next);
                              }} />
                              <span style={{ fontSize: 13, color: selectedParsed.has(d) ? "var(--pro-accent)" : "var(--pro-text)", fontWeight: selectedParsed.has(d) ? 600 : 400 }}>{d}</span>
                            </label>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )
              ) : (
                <>
                  <div style={{ fontSize: 12, color: "var(--pro-text-muted)", marginBottom: 8 }}>
                    每行或以逗號分隔輸入藥物名稱：
                  </div>
                  <textarea
                    className="pro-input"
                    value={bulkText}
                    onChange={e => setBulkText(e.target.value)}
                    rows={8}
                    placeholder={"甲福明\n諾和靈\nAspirin\n或以逗號、頓號分隔"}
                    style={{ width: "100%", resize: "vertical", fontFamily: "monospace", fontSize: 13 }}
                  />
                </>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: "12px 18px", borderTop: "1px solid var(--pro-border)", display: "flex", gap: 8, flexShrink: 0 }}>
              {importTab === "patient" && importPatientId !== null && parsedDrugs.length > 0 && (
                <button onClick={applyPatientImport} disabled={selectedParsed.size === 0} className="pro-btn-primary" style={{ flex: 1, justifyContent: "center", opacity: selectedParsed.size === 0 ? 0.5 : 1 }}>
                  匯入 {selectedParsed.size} 種藥物
                </button>
              )}
              {importTab === "bulk" && (
                <button onClick={applyBulkImport} disabled={!bulkText.trim()} className="pro-btn-primary" style={{ flex: 1, justifyContent: "center", opacity: !bulkText.trim() ? 0.5 : 1 }}>
                  批量匯入
                </button>
              )}
              <button onClick={() => setShowImport(false)} style={{ padding: "9px 18px", borderRadius: 7, border: "1px solid var(--pro-border)", background: "transparent", color: "var(--pro-text-muted)", cursor: "pointer", fontSize: 13 }}>
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {drugs.length >= 2 && (
        <>
          {/* Overall status */}
          <div style={{
            padding: "14px 18px", borderRadius: 10, marginBottom: 20,
            background: worstStyle.bg, border: `1px solid ${worstStyle.color}30`,
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <ShieldAlert size={18} color={worstStyle.color} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: worstStyle.color }}>
                最高風險等級：{worstStyle.zh}
                {worst === "none" && " — 未發現已知交互作用"}
              </div>
              {interactions.length > 0 && (
                <div style={{ fontSize: 12, color: worstStyle.color, opacity: 0.8, marginTop: 2 }}>
                  共發現 {interactions.length} 個交互作用
                </div>
              )}
            </div>
          </div>

          {/* Matrix */}
          <div className="pro-card" style={{ padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--pro-text)", marginBottom: 14 }}>交互作用矩陣</div>
            <InteractionMatrix drugs={drugs} interactions={interactions} />
          </div>

          {/* AI narrative button */}
          <button className="pro-btn-primary" onClick={handleAI} disabled={aiLoading} style={{ width: "100%", justifyContent: "center", marginBottom: 16 }}>
            <Sparkles size={14} />
            {aiLoading ? "AI 分析中..." : "取得 AI 詳細交互作用分析"}
          </button>

          {aiNarrative && (
            <div style={{ padding: 18, background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.15)", borderRadius: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--pro-accent)", marginBottom: 10, display: "flex", alignItems: "center", gap: 5, textTransform: "uppercase" }}>
                <Sparkles size={12} /> AI 藥物交互作用分析
              </div>
              <div style={{ fontSize: 13, color: "var(--pro-text-muted)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{aiNarrative}</div>
            </div>
          )}
        </>
      )}

      {drugs.length === 0 && (
        <div className="pro-card" style={{ padding: 48, textAlign: "center" }}>
          <Pill size={40} color="var(--pro-text-muted)" style={{ margin: "0 auto 12px" }} />
          <p style={{ color: "var(--pro-text-muted)", fontSize: 14 }}>請輸入至少兩種藥物以檢查交互作用</p>
        </div>
      )}
    </div>
  );
}
