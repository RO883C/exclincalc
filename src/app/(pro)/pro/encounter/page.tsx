"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  ChevronRight, ChevronLeft, AlertTriangle, CheckCircle,
  Plus, X, Save, Search, UserPlus, RefreshCw, Printer,
} from "lucide-react";
import {
  COMPLAINT_TEMPLATES,
  PE_SYSTEMS,
  PRESCRIPTION_TEMPLATES,
  EDUCATION_TEMPLATES,
  REFERRAL_CRITERIA,
  type ComplaintTemplate,
} from "@/lib/pro/clinicalFlow";
import { EXAM_PACKAGES, runTaiwanRules } from "@/lib/pro/taiwanFamilyMedicine";
import { createClient } from "@/lib/supabase";
import { generatePrescriptionHTML, printReport, type PrescriptionItem } from "@/lib/pro/reportExport";

// ── Types ─────────────────────────────────────────────────────

interface PatientRecord { id: string; full_name: string; date_of_birth: string | null; sex: string | null; }

interface PatientInfo {
  id: string | null;      // null = 尚未建立
  name: string;
  sex: "M" | "F" | "";
  age: string;
}

const EMPTY_PATIENT: PatientInfo = { id: null, name: "", sex: "", age: "" };

const STEPS = [
  { id: "complaint", label: "主訴",     short: "1" },
  { id: "history",   label: "問診",     short: "2" },
  { id: "vitals",    label: "生命徵象", short: "3" },
  { id: "pe",        label: "身體檢查", short: "4" },
  { id: "labs",      label: "選擇檢查", short: "5" },
  { id: "diagnosis", label: "診斷",     short: "6" },
  { id: "plan",      label: "計畫",     short: "7" },
] as const;

type StepId = typeof STEPS[number]["id"];

// ── Main Component ────────────────────────────────────────────

export default function EncounterPage() {
  const [step, setStep] = useState<StepId>("complaint");
  const [knownPatients, setKnownPatients] = useState<PatientRecord[]>([]);
  const [patient, setPatient] = useState<PatientInfo>(EMPTY_PATIENT);
  const [nameQuery, setNameQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  // Step 1 — Chief Complaint (multi-select, first = primary)
  const [complaints, setComplaints] = useState<string[]>([]);
  const [customComplaint, setCustomComplaint] = useState("");
  const complaint = complaints[0] ?? "";   // primary complaint drives template
  const [template, setTemplate] = useState<ComplaintTemplate | null>(null);

  // Step 2 — HPI + ROS findings
  const [hpiAnswers, setHpiAnswers] = useState<Record<string, string | string[]>>({});
  const [rosPresent, setRosPresent] = useState<string[]>([]);   // positives
  const [rosAbsent, setRosAbsent] = useState<string[]>([]);     // negatives

  // Step 3 — Vitals
  const [vitals, setVitals] = useState({
    sbp: "", dbp: "", hr: "", rr: "", temp: "", spo2: "", weight: "", height: "",
  });

  // Step 4 — PE
  const [peFindings, setPeFindings] = useState<Record<string, string[]>>({});
  const [peNotes, setPeNotes] = useState<Record<string, string>>({});

  // Step 5 — Labs
  const [activePackages, setActivePackages] = useState<string[]>([]);
  const [labValues, setLabValues] = useState<Record<string, string>>({});

  // Step 6 — Diagnosis
  const [diagnoses, setDiagnoses] = useState<Array<{ name_zh: string; icd10: string; primary: boolean }>>([]);
  const [dxInput, setDxInput] = useState({ name_zh: "", icd10: "" });

  // Step 7 — Plan
  const [selectedRx, setSelectedRx] = useState<string[]>([]);
  const [selectedEducation, setSelectedEducation] = useState<string[]>([]);
  const [selectedReferrals, setSelectedReferrals] = useState<string[]>([]);
  const [planNotes, setPlanNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);
  const [showRxModal, setShowRxModal] = useState(false);

  // Read complaint from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlComplaint = params.get("complaint");
    if (urlComplaint) setComplaints([decodeURIComponent(urlComplaint)]);
  }, []);

  // Warn user before leaving with unsaved data
  useEffect(() => {
    const isDirty = complaints.length > 0 && !saved;
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [complaints, saved]);

  // Load known patients for autocomplete; auto-select if pid was in URL
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: list } = await supabase
        .from("doctor_patients")
        .select("id, full_name, date_of_birth, sex")
        .eq("doctor_id", data.user.id)
        .order("full_name");
      if (!list) return;
      setKnownPatients(list as PatientRecord[]);
      const pid = new URLSearchParams(window.location.search).get("pid");
      if (pid) {
        const found = (list as PatientRecord[]).find((p) => p.id === pid);
        if (found) selectKnownPatient(found);
      }
    });
  // selectKnownPatient is stable (defined below), safe to omit from deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Template sync — driven by primary complaint
  useEffect(() => {
    const t = COMPLAINT_TEMPLATES.find((c) => c.complaint === complaint);
    setTemplate(t ?? null);
    if (t) {
      // Merge lab packages from all selected complaints
      const allPkgs = [...new Set(
        complaints.flatMap((cc) => COMPLAINT_TEMPLATES.find((c) => c.complaint === cc)?.labPackages ?? [])
      )];
      setActivePackages(allPkgs.length ? allPkgs : t.labPackages);
      setDiagnoses(t.commonDx.map((d, i) => ({ ...d, primary: i === 0 })));
    }
  }, [complaints]);

  // Patient name autocomplete filter
  const suggestions = nameQuery.length >= 1
    ? knownPatients.filter((p) => p.full_name.includes(nameQuery)).slice(0, 6)
    : [];

  const selectKnownPatient = async (p: PatientRecord) => {
    const age = p.date_of_birth
      ? String(new Date().getFullYear() - new Date(p.date_of_birth).getFullYear())
      : "";
    // 嘗試載入今日分診生命徵象
    const today = new Date().toISOString().split("T")[0];
    const supabase2 = createClient();
    const { data: tvData } = await supabase2
      .from("triage_vitals")
      .select("*")
      .eq("patient_id", p.id)
      .gte("created_at", today)
      .is("used_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (tvData) {
      setVitals({
        sbp: tvData.bp_sys ? String(tvData.bp_sys) : "",
        dbp: tvData.bp_dia ? String(tvData.bp_dia) : "",
        hr: tvData.hr ? String(tvData.hr) : "",
        rr: tvData.rr ? String(tvData.rr) : "",
        temp: tvData.temp ? String(tvData.temp) : "",
        spo2: tvData.spo2 ? String(tvData.spo2) : "",
        weight: tvData.weight ? String(tvData.weight) : "",
        height: tvData.height ? String(tvData.height) : "",
      });
      // 標記已被調用（fire-and-forget 可接受，失敗不影響流程）
      void supabase2.from("triage_vitals").update({ used_at: new Date().toISOString() }).eq("id", tvData.id);
    }
    setPatient({ id: p.id, name: p.full_name, sex: (p.sex as "M" | "F") || "", age });
    setNameQuery(p.full_name);
    setShowSuggestions(false);
  };

  const clearPatient = () => {
    setPatient(EMPTY_PATIENT);
    setNameQuery("");
    nameRef.current?.focus();
  };

  const stepIndex = STEPS.findIndex((s) => s.id === step);
  const canPrev = stepIndex > 0;
  const canNext = stepIndex < STEPS.length - 1;
  const goNext = () => canNext && setStep(STEPS[stepIndex + 1].id);
  const goPrev = () => canPrev && setStep(STEPS[stepIndex - 1].id);

  const taiwanRules = runTaiwanRules(labValues);
  const redFlags = template?.redFlags ?? [];

  const bmi =
    vitals.weight && vitals.height
      ? (parseFloat(vitals.weight) / (parseFloat(vitals.height) / 100) ** 2).toFixed(1)
      : null;

  // Save
  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    const supabase = createClient();
    try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    let patientId = patient.id;

    // Create new patient record in doctor_patients if name given but no id yet
    if (!patientId && patient.name.trim()) {
      const { data: newPt, error: ptErr } = await supabase
        .from("doctor_patients")
        .insert({
          doctor_id: user.id,
          full_name: patient.name.trim(),
          sex: patient.sex || null,
        })
        .select("id")
        .single();
      if (ptErr) { setSaveError(`建立病患失敗：${ptErr.message}`); setSaving(false); return; }
      if (newPt) {
        patientId = newPt.id;
        setPatient((p) => ({ ...p, id: newPt.id }));
        setKnownPatients((prev) => [...prev, { id: newPt.id, full_name: patient.name.trim(), date_of_birth: null, sex: patient.sex || null }]);
      }
    }

    if (!patientId) { setSaving(false); return; } // anonymous — skip save

    // S — Subjective: HPI answers + ROS
    const subjectiveParts: string[] = [];
    if (template) {
      template.hpiQuestions.forEach((q) => {
        const a = hpiAnswers[q.id];
        if (!a) return;
        const val = Array.isArray(a) ? (a as string[]).join("、") : String(a);
        if (val) subjectiveParts.push(`${q.question} ${val}`);
      });
    }
    if (rosPresent.length) subjectiveParts.push(`系統回顧陽性：${rosPresent.join("、")}`);
    if (rosAbsent.length) subjectiveParts.push(`系統回顧陰性：${rosAbsent.join("、")}`);

    // O — Objective: vitals + PE + labs
    const objectiveData: Record<string, unknown> = {};
    const vitalsFilled = Object.entries(vitals).filter(([, v]) => v !== "");
    if (vitalsFilled.length) objectiveData.vitals = vitals;
    if (bmi) objectiveData.bmi = bmi;
    if (Object.keys(peFindings).length) objectiveData.pe = peFindings;
    const labObj: Record<string, string> = {};
    activePackages.forEach((pkgId) => {
      const pkg = EXAM_PACKAGES.find((p) => p.id === pkgId);
      pkg?.keys.forEach((k) => { if (labValues[k]) labObj[k] = labValues[k]; });
    });
    if (Object.keys(labObj).length) objectiveData.labs = labObj;

    // A — Assessment
    const assessment = diagnoses.length
      ? diagnoses.map((d) => `${d.name_zh}${d.icd10 ? ` (${d.icd10})` : ""}${d.primary ? " [主診斷]" : ""}`).join("；")
      : null;
    const icd10_codes = diagnoses.map((d) => d.icd10).filter(Boolean);

    // P — Plan
    const planParts: string[] = [];
    if (selectedRx.length) planParts.push(`處方：${selectedRx.join("、")}`);
    if (selectedEducation.length) planParts.push(`衛教：${selectedEducation.join("、")}`);
    if (selectedReferrals.length) planParts.push(`轉介：${selectedReferrals.join("、")}`);
    if (planNotes) planParts.push(planNotes);

    // 結構化處方資料（供藥師調配用）
    const structuredRx = selectedRx.flatMap(label => {
      for (const [, items] of Object.entries(PRESCRIPTION_TEMPLATES)) {
        const found = items.find(rx => `${rx.drug} ${rx.dose} ${rx.frequency}` === label);
        if (found) return [found];
      }
      return [{ drug: label, generic: "", dose: "", frequency: "", route: "PO" }];
    });

    const { error: saveErr } = await supabase.from("clinical_records").insert({
      patient_id: patientId,
      doctor_id: user.id,
      chief_complaint: complaints.join("、") || null,
      subjective: subjectiveParts.join("\n") || null,
      objective: objectiveData,
      assessment,
      plan: planParts.join("\n") || null,
      icd10_codes: icd10_codes.length ? icd10_codes : [],
      prescriptions: structuredRx.length ? structuredRx : [],
    });

    if (saveErr) { setSaveError(`儲存失敗：${saveErr.message}`); setSaving(false); return; }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setSaveError(`未知錯誤：${err instanceof Error ? err.message : String(err)}`);
      setSaving(false);
    }
  };

  const handleNewEncounter = () => {
    setStep("complaint");
    setPatient(EMPTY_PATIENT);
    setNameQuery("");
    setComplaints([]);
    setCustomComplaint("");
    setTemplate(null);
    setHpiAnswers({});
    setRosPresent([]);
    setRosAbsent([]);
    setVitals({ sbp: "", dbp: "", hr: "", rr: "", temp: "", spo2: "", weight: "", height: "" });
    setPeFindings({});
    setPeNotes({});
    setActivePackages([]);
    setLabValues({});
    setDiagnoses([]);
    setDxInput({ name_zh: "", icd10: "" });
    setSelectedRx([]);
    setSelectedEducation([]);
    setSelectedReferrals([]);
    setPlanNotes("");
    setSaved(false);
  };

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* Main flow */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* ── Patient + Steps bar ── */}
        <div style={{
          borderBottom: "1px solid var(--pro-border)",
          background: "var(--pro-surface)",
        }}>
          {/* Patient row */}
          <div style={{
            padding: "10px 20px",
            borderBottom: "1px solid var(--pro-border)",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{ fontSize: 12, color: "var(--pro-text-muted)", fontWeight: 600, whiteSpace: "nowrap" }}>
              病患
            </span>

            {/* Name with autocomplete */}
            <div style={{ position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Search size={13} color="var(--pro-text-muted)" style={{ position: "absolute", left: 8, pointerEvents: "none" }} />
                <input
                  ref={nameRef}
                  type="text"
                  value={nameQuery}
                  onChange={(e) => {
                    setNameQuery(e.target.value);
                    setPatient((p) => ({ ...p, name: e.target.value, id: null }));
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  placeholder="輸入姓名搜尋或新增..."
                  style={{
                    paddingLeft: 28, paddingRight: patient.id ? 28 : 10,
                    paddingTop: 5, paddingBottom: 5,
                    width: 160, borderRadius: 6, fontSize: 13,
                    border: `1px solid ${patient.id ? "var(--pro-accent)" : "var(--pro-border)"}`,
                    background: patient.id ? "var(--pro-accent-dim)" : "var(--pro-bg)",
                    color: "var(--pro-text)",
                  }}
                />
                {nameQuery && (
                  <button
                    onClick={clearPatient}
                    style={{
                      position: "absolute", right: 6, background: "none", border: "none",
                      cursor: "pointer", color: "var(--pro-text-muted)", padding: 0,
                    }}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
              {/* Autocomplete dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div style={{
                  position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 100,
                  background: "var(--pro-surface)", border: "1px solid var(--pro-border)",
                  borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                  minWidth: 180,
                }}>
                  {suggestions.map((p) => (
                    <button
                      key={p.id}
                      onMouseDown={() => selectKnownPatient(p)}
                      style={{
                        display: "block", width: "100%", textAlign: "left",
                        padding: "8px 12px", background: "none", border: "none",
                        cursor: "pointer", fontSize: 13, color: "var(--pro-text)",
                        borderBottom: "1px solid var(--pro-border)",
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>{p.full_name}</span>
                      {p.sex && <span style={{ marginLeft: 6, fontSize: 11, color: "var(--pro-text-muted)" }}>{p.sex === "M" ? "男" : "女"}</span>}
                    </button>
                  ))}
                  {nameQuery && !suggestions.some((p) => p.full_name === nameQuery) && (
                    <button
                      onMouseDown={() => {
                        setPatient((p) => ({ ...p, name: nameQuery, id: null }));
                        setShowSuggestions(false);
                      }}
                      style={{
                        display: "flex", alignItems: "center", gap: 6, width: "100%",
                        padding: "8px 12px", background: "none", border: "none",
                        cursor: "pointer", fontSize: 12, color: "var(--pro-accent)",
                      }}
                    >
                      <UserPlus size={13} /> 新增「{nameQuery}」為新病患
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Sex toggle */}
            <div style={{ display: "flex", borderRadius: 6, overflow: "hidden", border: "1px solid var(--pro-border)" }}>
              {(["M", "F"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setPatient((p) => ({ ...p, sex: p.sex === s ? "" : s }))}
                  style={{
                    padding: "5px 10px", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
                    background: patient.sex === s
                      ? (s === "M" ? "rgba(59,130,246,0.2)" : "rgba(236,72,153,0.2)")
                      : "transparent",
                    color: patient.sex === s
                      ? (s === "M" ? "#3b82f6" : "#ec4899")
                      : "var(--pro-text-muted)",
                  }}
                >
                  {s === "M" ? "男" : "女"}
                </button>
              ))}
            </div>

            {/* Age */}
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <input
                type="number"
                value={patient.age}
                onChange={(e) => setPatient((p) => ({ ...p, age: e.target.value }))}
                placeholder="年齡"
                style={{
                  width: 60, padding: "5px 8px", borderRadius: 6, fontSize: 13, fontWeight: 600,
                  border: "1px solid var(--pro-border)", background: "var(--pro-bg)", color: "var(--pro-text)",
                }}
              />
              <span style={{ fontSize: 12, color: "var(--pro-text-muted)" }}>歲</span>
            </div>

            {/* Status badge */}
            {patient.id && (
              <span style={{
                padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 600,
                background: "rgba(34,197,94,0.15)", color: "#22c55e",
                border: "1px solid rgba(34,197,94,0.3)",
              }}>
                已建檔
              </span>
            )}
            {!patient.id && patient.name && (
              <span style={{
                padding: "2px 8px", borderRadius: 12, fontSize: 11,
                background: "rgba(245,158,11,0.15)", color: "#f59e0b",
                border: "1px solid rgba(245,158,11,0.3)",
              }}>
                新病患（存檔時建立）
              </span>
            )}
            {!patient.name && (
              <span style={{ fontSize: 11, color: "var(--pro-text-muted)" }}>
                不填姓名可直接開始診療
              </span>
            )}

            {/* New encounter button */}
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <button
                onClick={handleNewEncounter}
                style={{
                  display: "flex", alignItems: "center", gap: 5, padding: "5px 12px",
                  borderRadius: 6, border: "1px solid var(--pro-border)", cursor: "pointer",
                  background: "transparent", color: "var(--pro-text-muted)", fontSize: 12,
                }}
              >
                <RefreshCw size={12} /> 新診療
              </button>
              <button
                onClick={handleSave}
                disabled={saving || complaints.length === 0}
                style={{
                  display: "flex", alignItems: "center", gap: 5, padding: "5px 14px",
                  borderRadius: 6, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
                  background: saved ? "#22c55e" : saveError ? "#ef4444" : "var(--pro-accent)", color: "#fff",
                  opacity: !complaint || saving ? 0.5 : 1,
                }}
              >
                <Save size={13} />
                {saved ? "已儲存" : saving ? "儲存中..." : saveError ? "儲存失敗" : "儲存"}
              </button>
            </div>
            {saveError && (
              <div style={{ padding: "4px 20px", fontSize: 11, color: "#ef4444", background: "rgba(239,68,68,0.08)" }}>
                {saveError}
              </div>
            )}
          </div>

          {/* Steps row */}
          <div style={{ padding: "8px 20px", display: "flex", alignItems: "center", gap: 4, overflowX: "auto" }}>
            {STEPS.map((s, i) => {
              const isActive = s.id === step;
              const isDone = i < stepIndex;
              return (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <button
                    onClick={() => setStep(s.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 5, padding: "5px 12px",
                      borderRadius: 20, border: "none", cursor: "pointer", fontSize: 12,
                      fontWeight: isActive ? 700 : 500, whiteSpace: "nowrap",
                      background: isActive ? "var(--pro-accent)" : isDone ? "rgba(34,197,94,0.15)" : "var(--pro-bg)",
                      color: isActive ? "#fff" : isDone ? "#22c55e" : "var(--pro-text-muted)",
                      transition: "all 0.15s",
                    }}
                  >
                    {isDone ? <CheckCircle size={11} /> : <span style={{ fontSize: 10, opacity: 0.7 }}>{s.short}</span>}
                    {s.label}
                  </button>
                  {i < STEPS.length - 1 && <ChevronRight size={11} color="var(--pro-border)" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step content */}
        <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
          {step === "complaint" && (
            <StepComplaint
              complaints={complaints}
              setComplaints={setComplaints}
              customComplaint={customComplaint}
              setCustomComplaint={setCustomComplaint}
            />
          )}
          {step === "history" && template && (
            <StepHistory
              template={template}
              answers={hpiAnswers}
              setAnswers={setHpiAnswers}
              rosPresent={rosPresent}
              setRosPresent={setRosPresent}
              rosAbsent={rosAbsent}
              setRosAbsent={setRosAbsent}
            />
          )}
          {step === "history" && !template && (
            <div style={{ color: "var(--pro-text-muted)", fontSize: 14, padding: 20 }}>
              請先在「主訴」步驟選擇或輸入主訴以載入問診模板。
            </div>
          )}
          {step === "vitals" && (
            <StepVitals vitals={vitals} setVitals={setVitals} bmi={bmi} />
          )}
          {step === "pe" && (
            <StepPE
              template={template}
              findings={peFindings}
              setFindings={setPeFindings}
              notes={peNotes}
              setNotes={setPeNotes}
            />
          )}
          {step === "labs" && (
            <StepLabs
              activePackages={activePackages}
              setActivePackages={setActivePackages}
              labValues={labValues}
              setLabValues={setLabValues}
              suggestedPackages={[...new Set(
                complaints.flatMap((cc) => COMPLAINT_TEMPLATES.find((t) => t.complaint === cc)?.labPackages ?? [])
              )]}
              complaints={complaints}
            />
          )}
          {step === "diagnosis" && (
            <StepDiagnosis
              diagnoses={diagnoses}
              setDiagnoses={setDiagnoses}
              dxInput={dxInput}
              setDxInput={setDxInput}
              template={template}
            />
          )}
          {step === "plan" && (
            <StepPlan
              diagnoses={diagnoses}
              selectedRx={selectedRx}
              setSelectedRx={setSelectedRx}
              selectedEducation={selectedEducation}
              setSelectedEducation={setSelectedEducation}
              selectedReferrals={selectedReferrals}
              setSelectedReferrals={setSelectedReferrals}
              planNotes={planNotes}
              setPlanNotes={setPlanNotes}
            />
          )}
        </div>

        {/* Bottom nav */}
        <div style={{
          padding: "10px 20px",
          borderTop: "1px solid var(--pro-border)",
          display: "flex", justifyContent: "space-between",
          background: "var(--pro-surface)",
        }}>
          <button
            onClick={goPrev}
            disabled={!canPrev}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "7px 16px",
              borderRadius: 6, border: "1px solid var(--pro-border)", cursor: "pointer",
              background: "transparent", color: "var(--pro-text)", fontSize: 13,
              opacity: canPrev ? 1 : 0.3,
            }}
          >
            <ChevronLeft size={14} /> 上一步
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            {step === "plan" && selectedRx.length > 0 && (
              <button
                onClick={() => setShowRxModal(true)}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "7px 16px",
                  borderRadius: 6, border: "1px solid var(--pro-border)", cursor: "pointer",
                  background: "transparent", color: "var(--pro-text)", fontSize: 13,
                }}
              >
                <Printer size={14} /> 預覽藥單
              </button>
            )}
            {canNext ? (
              <button
                onClick={goNext}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "7px 16px",
                  borderRadius: 6, border: "none", cursor: "pointer",
                  background: "var(--pro-accent)", color: "#fff", fontSize: 13, fontWeight: 600,
                }}
              >
                下一步 <ChevronRight size={14} />
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving || complaints.length === 0}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "7px 16px",
                  borderRadius: 6, border: "none", cursor: "pointer",
                  background: "#22c55e", color: "#fff", fontSize: 13, fontWeight: 600,
                  opacity: !complaint || saving ? 0.5 : 1,
                }}
              >
                <Save size={14} /> 完成並儲存
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <RightPanel
        redFlags={redFlags}
        taiwanRules={taiwanRules}
        diagnoses={diagnoses}
        vitals={vitals}
        bmi={bmi}
        patient={patient}
      />

      {/* Prescription modal */}
      {showRxModal && (
        <PrescriptionModal
          selectedRx={selectedRx}
          patientName={patient.name || "（未指定病患）"}
          visitDate={new Date().toISOString().slice(0, 10)}
          onClose={() => setShowRxModal(false)}
        />
      )}
    </div>
  );
}

// ── Step 1: Chief Complaint (multi-select) ────────────────────

function StepComplaint({
  complaints, setComplaints, customComplaint, setCustomComplaint,
}: {
  complaints: string[];
  setComplaints: (v: string[]) => void;
  customComplaint: string;
  setCustomComplaint: (v: string) => void;
}) {
  const toggle = (c: string) => {
    if (complaints.includes(c)) {
      setComplaints(complaints.filter((x) => x !== c));
    } else {
      setComplaints([...complaints, c]);
    }
  };

  const addCustom = () => {
    const v = customComplaint.trim();
    if (!v || complaints.includes(v)) return;
    setComplaints([...complaints, v]);
    setCustomComplaint("");
  };

  const primaryComplaint = complaints[0];
  const primaryTemplate = COMPLAINT_TEMPLATES.find((t) => t.complaint === primaryComplaint);

  return (
    <div style={{ maxWidth: 720 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--pro-text)", marginBottom: 4 }}>主訴</h2>
      <p style={{ fontSize: 13, color: "var(--pro-text-muted)", marginBottom: 8 }}>
        可多選。第一個選擇的主訴為「主訴」，其餘為「附加主訴」。
      </p>

      {/* Selected pills */}
      {complaints.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
          {complaints.map((c, i) => (
            <span key={c} style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "5px 10px", borderRadius: 16, fontSize: 13, fontWeight: 600,
              background: i === 0 ? "var(--pro-accent)" : "var(--pro-accent-dim)",
              color: i === 0 ? "#fff" : "var(--pro-accent)",
              border: i === 0 ? "none" : "1px solid rgba(59,130,246,0.3)",
            }}>
              {i === 0 && <span style={{ fontSize: 10, opacity: 0.8 }}>主訴</span>}
              {COMPLAINT_TEMPLATES.find((t) => t.complaint === c)?.icon ?? ""} {c}
              <button onClick={() => toggle(c)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", padding: 0, lineHeight: 1 }}>
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Template buttons */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 16 }}>
        {COMPLAINT_TEMPLATES.map((t) => {
          const selected = complaints.includes(t.complaint);
          const idx = complaints.indexOf(t.complaint);
          return (
            <button
              key={t.complaint}
              onClick={() => toggle(t.complaint)}
              style={{
                padding: "7px 13px", borderRadius: 20, fontSize: 12, cursor: "pointer",
                border: `1.5px solid ${selected ? "var(--pro-accent)" : "var(--pro-border)"}`,
                background: selected ? (idx === 0 ? "var(--pro-accent)" : "var(--pro-accent-dim)") : "transparent",
                color: selected ? (idx === 0 ? "#fff" : "var(--pro-accent)") : "var(--pro-text)",
                fontWeight: selected ? 700 : 400,
                transition: "all 0.1s",
              }}
            >
              {t.icon} {t.complaint}
            </button>
          );
        })}
      </div>

      {/* Custom input */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          type="text"
          value={customComplaint}
          onChange={(e) => setCustomComplaint(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addCustom()}
          placeholder="其他主訴（按 Enter 新增）"
          style={{
            flex: 1, padding: "8px 12px", borderRadius: 8,
            border: "1px solid var(--pro-border)", background: "var(--pro-bg)",
            color: "var(--pro-text)", fontSize: 13,
          }}
        />
        <button onClick={addCustom} style={{
          padding: "8px 14px", borderRadius: 8, border: "none", cursor: "pointer",
          background: "var(--pro-accent)", color: "#fff", fontSize: 13,
        }}>
          <Plus size={14} />
        </button>
      </div>

      {/* Summary for primary complaint */}
      {primaryTemplate && (
        <div style={{ padding: 14, borderRadius: 8, background: "var(--pro-accent-dim)", border: "1px solid rgba(59,130,246,0.2)" }}>
          <div style={{ fontSize: 12, color: "var(--pro-accent)", fontWeight: 700, marginBottom: 8 }}>
            {primaryTemplate.icon} {primaryTemplate.complaint} — 建議套組
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
            {[...new Set(complaints.flatMap((cc) => COMPLAINT_TEMPLATES.find((t) => t.complaint === cc)?.labPackages ?? []))].map((pkgId) => {
              const pkg = EXAM_PACKAGES.find((p) => p.id === pkgId);
              return pkg ? (
                <span key={pkgId} style={{ padding: "2px 8px", borderRadius: 12, fontSize: 11, background: pkg.color + "20", color: pkg.color, border: `1px solid ${pkg.color}40` }}>
                  {pkg.icon} {pkg.label}
                </span>
              ) : null;
            })}
          </div>
          {primaryTemplate.redFlags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              <span style={{ fontSize: 11, color: "#ef4444", fontWeight: 700 }}>⚠</span>
              {primaryTemplate.redFlags.map((f) => (
                <span key={f} style={{ fontSize: 11, padding: "2px 7px", borderRadius: 10, background: "rgba(239,68,68,0.08)", color: "#ef4444" }}>{f}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Step 2: History (OPQRST) ───────────────────────────────────

function StepHistory({ template, answers, setAnswers, rosPresent, setRosPresent, rosAbsent, setRosAbsent }: {
  template: ComplaintTemplate;
  answers: Record<string, string | string[]>;
  setAnswers: (v: Record<string, string | string[]>) => void;
  rosPresent: string[];
  setRosPresent: (v: string[]) => void;
  rosAbsent: string[];
  setRosAbsent: (v: string[]) => void;
}) {
  const setAnswer = (id: string, value: string | string[]) => setAnswers({ ...answers, [id]: value });
  const toggleMulti = (id: string, option: string) => {
    const current = (answers[id] as string[]) ?? [];
    setAnswer(id, current.includes(option) ? current.filter((v) => v !== option) : [...current, option]);
  };

  // ROS three-state cycle: unasked → present → absent → unasked
  const cycleRos = (item: string) => {
    if (rosPresent.includes(item)) {
      setRosPresent(rosPresent.filter((x) => x !== item));
      setRosAbsent([...rosAbsent, item]);
    } else if (rosAbsent.includes(item)) {
      setRosAbsent(rosAbsent.filter((x) => x !== item));
    } else {
      setRosPresent([...rosPresent, item]);
    }
  };

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 20 }}>{template.icon}</span>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--pro-text)" }}>
          問診 — {template.complaint}
        </h2>
      </div>
      <p style={{ fontSize: 13, color: "var(--pro-text-muted)", marginBottom: 20 }}>OPQRST 系統性問診</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {template.hpiQuestions.map((q) => (
          <div key={q.id}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--pro-text)", display: "block", marginBottom: 8 }}>
              {q.question}
            </label>
            {q.type === "scale" ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 12, color: "var(--pro-text-muted)" }}>0 無痛</span>
                <input
                  type="range" min={0} max={10} step={1}
                  value={parseInt((answers[q.id] as string) || "0")}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                  style={{ flex: 1 }}
                />
                <span style={{ fontSize: 12, color: "var(--pro-text-muted)" }}>10 極痛</span>
                <span style={{ minWidth: 28, textAlign: "center", fontWeight: 700, fontSize: 18, color: "var(--pro-accent)" }}>
                  {(answers[q.id] as string) || "0"}
                </span>
              </div>
            ) : q.type === "text" ? (
              <input
                type="text"
                value={(answers[q.id] as string) ?? ""}
                onChange={(e) => setAnswer(q.id, e.target.value)}
                placeholder={q.placeholder ?? ""}
                style={{
                  width: "100%", padding: "8px 12px", borderRadius: 6,
                  border: "1px solid var(--pro-border)", background: "var(--pro-bg)",
                  color: "var(--pro-text)", fontSize: 13,
                }}
              />
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {q.options?.map((opt) => {
                  const selected = q.type === "multiselect"
                    ? ((answers[q.id] as string[]) ?? []).includes(opt)
                    : answers[q.id] === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() =>
                        q.type === "multiselect"
                          ? toggleMulti(q.id, opt)
                          : setAnswer(q.id, opt)
                      }
                      style={{
                        padding: "5px 12px", borderRadius: 16, fontSize: 12, cursor: "pointer",
                        border: `1.5px solid ${selected ? "var(--pro-accent)" : "var(--pro-border)"}`,
                        background: selected ? "var(--pro-accent-dim)" : "transparent",
                        color: selected ? "var(--pro-accent)" : "var(--pro-text)",
                        fontWeight: selected ? 600 : 400,
                      }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {template.rosPositives.length > 0 && (
        <div style={{ marginTop: 24, padding: 14, borderRadius: 8, background: "var(--pro-bg)", border: "1px solid var(--pro-border)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#f59e0b", marginBottom: 4 }}>💬 系統回顧</div>
          <div style={{ fontSize: 11, color: "var(--pro-text-muted)", marginBottom: 10 }}>
            點擊切換：<span style={{ color: "var(--pro-text-muted)" }}>未詢問</span>　→　<span style={{ color: "#22c55e", fontWeight: 600 }}>有（+）</span>　→　<span style={{ color: "#94a3b8", textDecoration: "line-through" }}>無（−）</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {template.rosPositives.map((r) => {
              const isPresent = rosPresent.includes(r);
              const isAbsent = rosAbsent.includes(r);
              return (
                <button
                  key={r}
                  onClick={() => cycleRos(r)}
                  style={{
                    padding: "4px 12px", borderRadius: 12, fontSize: 12, cursor: "pointer",
                    border: `1.5px solid ${isPresent ? "#22c55e" : isAbsent ? "var(--pro-border)" : "rgba(245,158,11,0.4)"}`,
                    background: isPresent ? "rgba(34,197,94,0.12)" : isAbsent ? "transparent" : "rgba(245,158,11,0.08)",
                    color: isPresent ? "#22c55e" : isAbsent ? "var(--pro-text-muted)" : "#f59e0b",
                    fontWeight: isPresent || isAbsent ? 600 : 400,
                    textDecoration: isAbsent ? "line-through" : "none",
                    transition: "all 0.1s",
                  }}
                >
                  {isPresent ? "✓ " : isAbsent ? "✗ " : ""}{r}
                </button>
              );
            })}
          </div>
          {(rosPresent.length > 0 || rosAbsent.length > 0) && (
            <div style={{ marginTop: 10, fontSize: 11, color: "var(--pro-text-muted)", display: "flex", gap: 12, flexWrap: "wrap" }}>
              {rosPresent.length > 0 && <span>陽性：<span style={{ color: "#22c55e", fontWeight: 600 }}>{rosPresent.join("、")}</span></span>}
              {rosAbsent.length > 0 && <span>陰性：<span style={{ color: "var(--pro-text-muted)" }}>{rosAbsent.join("、")}</span></span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Step 3: Vitals ────────────────────────────────────────────

function StepVitals({ vitals, setVitals, bmi }: {
  vitals: { sbp: string; dbp: string; hr: string; rr: string; temp: string; spo2: string; weight: string; height: string };
  setVitals: (v: { sbp: string; dbp: string; hr: string; rr: string; temp: string; spo2: string; weight: string; height: string }) => void;
  bmi: string | null;
}) {
  const set = (k: string, v: string) => setVitals({ ...vitals, [k]: v });
  const vr = vitals as Record<string, string>;

  const VitalField = ({ label, id, unit, normal }: { label: string; id: string; unit: string; normal: string }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 12, color: "var(--pro-text-muted)", fontWeight: 600 }}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <input
          type="number"
          value={vr[id] ?? ""}
          onChange={(e) => set(id, e.target.value)}
          style={{
            width: 90, padding: "8px 10px", borderRadius: 6,
            border: "1px solid var(--pro-border)", background: "var(--pro-bg)",
            color: "var(--pro-text)", fontSize: 14, fontWeight: 600,
          }}
        />
        <span style={{ fontSize: 12, color: "var(--pro-text-muted)" }}>{unit}</span>
      </div>
      {normal && <div style={{ fontSize: 11, color: "var(--pro-text-muted)" }}>正常：{normal}</div>}
    </div>
  );

  const sbp = parseFloat(vitals.sbp || "0");
  const dbp = parseFloat(vitals.dbp || "0");
  const bpColor = sbp >= 180 || dbp >= 120 ? "#ef4444" : sbp >= 140 || dbp >= 90 ? "#f59e0b" : sbp >= 130 ? "#f97316" : "#22c55e";
  const bpLabel = sbp >= 180 ? "高血壓危機" : sbp >= 140 ? "高血壓2期" : sbp >= 130 ? "高血壓1期" : sbp > 0 ? "正常" : "";

  return (
    <div style={{ maxWidth: 700 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--pro-text)", marginBottom: 4 }}>生命徵象</h2>
      <p style={{ fontSize: 13, color: "var(--pro-text-muted)", marginBottom: 24 }}>記錄基本生命體徵，未填欄位不計入</p>

      {/* BP */}
      <div style={{ padding: 16, borderRadius: 10, marginBottom: 20, border: "1px solid var(--pro-border)", background: "var(--pro-bg)" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--pro-text-muted)", marginBottom: 12 }}>🩸 血壓</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <input
            type="number" value={vitals.sbp} onChange={(e) => set("sbp", e.target.value)} placeholder="收縮壓"
            style={{
              width: 100, padding: "10px 12px", borderRadius: 6, fontSize: 16, fontWeight: 700,
              border: `2px solid ${sbp ? bpColor : "var(--pro-border)"}`,
              background: "var(--pro-surface)", color: "var(--pro-text)",
            }}
          />
          <span style={{ fontSize: 20, color: "var(--pro-text-muted)" }}>/</span>
          <input
            type="number" value={vitals.dbp} onChange={(e) => set("dbp", e.target.value)} placeholder="舒張壓"
            style={{
              width: 100, padding: "10px 12px", borderRadius: 6, fontSize: 16, fontWeight: 700,
              border: `2px solid ${dbp ? bpColor : "var(--pro-border)"}`,
              background: "var(--pro-surface)", color: "var(--pro-text)",
            }}
          />
          <span style={{ fontSize: 13, color: "var(--pro-text-muted)" }}>mmHg</span>
          {bpLabel && (
            <span style={{ padding: "3px 10px", borderRadius: 12, fontSize: 12, fontWeight: 700, background: bpColor + "20", color: bpColor }}>
              {bpLabel}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))", gap: 16, marginBottom: 20 }}>
        <VitalField label="心跳" id="hr" unit="bpm" normal="60-100" />
        <VitalField label="呼吸速率" id="rr" unit="次/分" normal="12-20" />
        <VitalField label="體溫" id="temp" unit="°C" normal="36.5-37.5" />
        <VitalField label="血氧 SpO₂" id="spo2" unit="%" normal="≥96%" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))", gap: 16 }}>
        <VitalField label="體重" id="weight" unit="kg" normal="" />
        <VitalField label="身高" id="height" unit="cm" normal="" />
        {bmi && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 12, color: "var(--pro-text-muted)", fontWeight: 600 }}>BMI（自動計算）</label>
            <div style={{
              padding: "8px 12px", borderRadius: 6, fontSize: 18, fontWeight: 700,
              border: "1px solid var(--pro-border)", background: "var(--pro-bg)",
              color: parseFloat(bmi) >= 27 ? "#f59e0b" : "var(--pro-text)",
            }}>{bmi}</div>
            <div style={{ fontSize: 11, color: "var(--pro-text-muted)" }}>
              {parseFloat(bmi) >= 27 ? "肥胖（台灣≥27）" : parseFloat(bmi) >= 24 ? "過重" : parseFloat(bmi) >= 18.5 ? "正常" : "過輕"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Step 4: Physical Exam ─────────────────────────────────────

function StepPE({ template, findings, setFindings, notes, setNotes }: {
  template: ComplaintTemplate | null;
  findings: Record<string, string[]>;
  setFindings: (v: Record<string, string[]>) => void;
  notes: Record<string, string>;
  setNotes: (v: Record<string, string>) => void;
}) {
  const toggle = (sysId: string, finding: string) => {
    const current = findings[sysId] ?? [];
    setFindings({
      ...findings,
      [sysId]: current.includes(finding) ? current.filter((f) => f !== finding) : [...current, finding],
    });
  };

  return (
    <div style={{ maxWidth: 820 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--pro-text)", marginBottom: 4 }}>身體檢查</h2>
      <p style={{ fontSize: 13, color: "var(--pro-text-muted)", marginBottom: 12 }}>
        勾選異常發現（未勾選 = 正常）
        {template && <span style={{ color: "var(--pro-accent)" }}> · ★ 標記為此主訴重點</span>}
      </p>

      {template?.pePoints && template.pePoints.length > 0 && (
        <div style={{
          padding: 10, borderRadius: 8, marginBottom: 14,
          background: "var(--pro-accent-dim)", border: "1px solid rgba(59,130,246,0.2)",
          display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center",
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--pro-accent)", marginRight: 4 }}>★ 重點：</span>
          {template.pePoints.map((pt) => (
            <span key={pt} style={{
              padding: "2px 8px", borderRadius: 10, fontSize: 11,
              background: "rgba(59,130,246,0.1)", color: "var(--pro-accent)",
            }}>{pt}</span>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 12 }}>
        {PE_SYSTEMS.map((sys) => {
          const sysFindings = findings[sys.id] ?? [];
          const hasAbnormal = sysFindings.length > 0;
          return (
            <div key={sys.id} style={{
              borderRadius: 8,
              border: `1px solid ${hasAbnormal ? "#f59e0b40" : "var(--pro-border)"}`,
              background: hasAbnormal ? "rgba(245,158,11,0.04)" : "var(--pro-bg)",
              overflow: "hidden",
            }}>
              <div style={{
                padding: "8px 12px", borderBottom: "1px solid var(--pro-border)",
                display: "flex", alignItems: "center", gap: 7,
                background: "var(--pro-surface)",
              }}>
                <span>{sys.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--pro-text)" }}>{sys.label}</span>
                {hasAbnormal && (
                  <span style={{
                    marginLeft: "auto", padding: "1px 6px", borderRadius: 10,
                    fontSize: 10, background: "rgba(245,158,11,0.2)", color: "#f59e0b",
                  }}>
                    {sysFindings.length} 項異常
                  </span>
                )}
              </div>
              <div style={{ padding: "10px 12px" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {sys.abnormals.map((ab) => {
                    const sel = sysFindings.includes(ab);
                    return (
                      <button
                        key={ab}
                        onClick={() => toggle(sys.id, ab)}
                        style={{
                          padding: "3px 8px", borderRadius: 12, fontSize: 11, cursor: "pointer",
                          border: `1px solid ${sel ? "#f59e0b" : "var(--pro-border)"}`,
                          background: sel ? "rgba(245,158,11,0.15)" : "transparent",
                          color: sel ? "#f59e0b" : "var(--pro-text-muted)",
                          fontWeight: sel ? 700 : 400,
                        }}
                      >
                        {ab}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  value={notes[sys.id] ?? ""}
                  onChange={(e) => setNotes({ ...notes, [sys.id]: e.target.value })}
                  placeholder="補充描述..."
                  style={{
                    marginTop: 7, width: "100%", padding: "4px 8px", borderRadius: 5,
                    border: "1px solid var(--pro-border)", background: "transparent",
                    color: "var(--pro-text)", fontSize: 12,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Step 5: Labs ──────────────────────────────────────────────

function StepLabs({ activePackages, setActivePackages, labValues, setLabValues, suggestedPackages, complaints }: {
  activePackages: string[];
  setActivePackages: (v: string[]) => void;
  labValues: Record<string, string>;
  setLabValues: (v: Record<string, string>) => void;
  suggestedPackages: string[];
  complaints: string[];
}) {
  const STAGE_LABELS: Record<number, string> = { 1: "基礎", 2: "代謝", 3: "器官功能", 4: "特殊" };
  const toggle = (id: string) =>
    setActivePackages(activePackages.includes(id) ? activePackages.filter((p) => p !== id) : [...activePackages, id]);

  const unselectedSuggestions = suggestedPackages.filter((id) => !activePackages.includes(id));
  const applyAll = () =>
    setActivePackages([...new Set([...activePackages, ...suggestedPackages])]);

  return (
    <div>
      {/* Suggestion banner */}
      {suggestedPackages.length > 0 && (
        <div style={{
          marginBottom: 16, padding: "10px 14px", borderRadius: 8,
          background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)",
          display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
        }}>
          <span style={{ fontSize: 13, color: "#f59e0b", fontWeight: 600, flexShrink: 0 }}>
            ★ 主訴建議
          </span>
          <div style={{ flex: 1, display: "flex", gap: 6, flexWrap: "wrap" }}>
            {suggestedPackages.map((id) => {
              const pkg = EXAM_PACKAGES.find((p) => p.id === id);
              if (!pkg) return null;
              const active = activePackages.includes(id);
              return (
                <span key={id} onClick={() => toggle(id)} style={{
                  padding: "3px 10px", borderRadius: 20, fontSize: 11, cursor: "pointer",
                  fontWeight: 600, userSelect: "none",
                  border: `1px solid ${active ? pkg.color : "rgba(245,158,11,0.4)"}`,
                  background: active ? pkg.color + "20" : "transparent",
                  color: active ? pkg.color : "#d97706",
                  textDecoration: active ? "none" : "none",
                }}>
                  {pkg.icon} {pkg.label} {active ? "✓" : "+"}
                </span>
              );
            })}
          </div>
          {unselectedSuggestions.length > 0 && (
            <button onClick={applyAll} style={{
              padding: "4px 12px", borderRadius: 6, border: "1px solid #f59e0b",
              background: "#f59e0b", color: "#fff", fontSize: 11, fontWeight: 700,
              cursor: "pointer", flexShrink: 0,
            }}>
              一鍵套用
            </button>
          )}
          {unselectedSuggestions.length === 0 && (
            <span style={{ fontSize: 11, color: "#22c55e", fontWeight: 600 }}>✓ 已全部套用</span>
          )}
        </div>
      )}
      {complaints.length === 0 && (
        <div style={{
          marginBottom: 16, padding: "10px 14px", borderRadius: 8,
          background: "rgba(107,114,128,0.08)", border: "1px solid var(--pro-border)",
          fontSize: 12, color: "var(--pro-text-muted)",
        }}>
          尚未選擇主訴，請先至步驟 1 選擇主訴以獲得建議套組
        </div>
      )}
    <div style={{ display: "flex", gap: 20 }}>
      {/* Package picker */}
      <div style={{ width: 250, flexShrink: 0 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--pro-text)", marginBottom: 4 }}>選擇套組</h3>
        <p style={{ fontSize: 11, color: "var(--pro-text-muted)", marginBottom: 12 }}>★ 為主訴建議套組</p>
        {([1, 2, 3, 4] as const).map((stage) => {
          const pkgs = EXAM_PACKAGES.filter((p) => p.stage === stage);
          return (
            <div key={stage} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--pro-text-muted)", marginBottom: 5, letterSpacing: "0.06em" }}>
                階段{stage} {STAGE_LABELS[stage]}
              </div>
              {pkgs.map((pkg) => {
                const active = activePackages.includes(pkg.id);
                const suggested = suggestedPackages.includes(pkg.id);
                return (
                  <button
                    key={pkg.id}
                    onClick={() => toggle(pkg.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8, width: "100%",
                      padding: "6px 10px", borderRadius: 6, cursor: "pointer", textAlign: "left",
                      marginBottom: 3,
                      border: `1.5px solid ${active ? pkg.color : "var(--pro-border)"}`,
                      background: active ? pkg.color + "15" : "transparent",
                      color: active ? pkg.color : "var(--pro-text)",
                      fontWeight: active ? 600 : 400, fontSize: 12,
                    }}
                  >
                    <span>{pkg.icon}</span>
                    <span style={{ flex: 1 }}>{pkg.label}</span>
                    {suggested && !active && <span style={{ fontSize: 10, color: "#f59e0b" }}>★</span>}
                    {active && <CheckCircle size={11} />}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Lab value input */}
      <div style={{ flex: 1 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--pro-text)", marginBottom: 4 }}>輸入數值</h3>
        <p style={{ fontSize: 12, color: "var(--pro-text-muted)", marginBottom: 14 }}>
          {activePackages.length === 0 ? "請先選擇左側套組" : `${activePackages.length} 個套組已選擇`}
        </p>
        {activePackages.map((pkgId) => {
          const pkg = EXAM_PACKAGES.find((p) => p.id === pkgId);
          if (!pkg) return null;
          return (
            <div key={pkgId} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: pkg.color }}>
                {pkg.icon} {pkg.label}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 }}>
                {pkg.keys.map((key) => (
                  <div key={key}>
                    <label style={{ fontSize: 11, color: "var(--pro-text-muted)", display: "block", marginBottom: 3 }}>{key}</label>
                    <input
                      type="number"
                      value={labValues[key] ?? ""}
                      onChange={(e) => setLabValues({ ...labValues, [key]: e.target.value })}
                      style={{
                        width: "100%", padding: "5px 8px", borderRadius: 5, fontSize: 13, fontWeight: 600,
                        border: "1px solid var(--pro-border)", background: "var(--pro-bg)", color: "var(--pro-text)",
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
    </div>
  );
}

// ── Step 6: Diagnosis ─────────────────────────────────────────

function StepDiagnosis({ diagnoses, setDiagnoses, dxInput, setDxInput, template }: {
  diagnoses: Array<{ name_zh: string; icd10: string; primary: boolean }>;
  setDiagnoses: (v: Array<{ name_zh: string; icd10: string; primary: boolean }>) => void;
  dxInput: { name_zh: string; icd10: string };
  setDxInput: (v: { name_zh: string; icd10: string }) => void;
  template: ComplaintTemplate | null;
}) {
  const addDx = (name_zh: string, icd10: string) => {
    if (diagnoses.some((d) => d.icd10 === icd10)) return;
    setDiagnoses([...diagnoses, { name_zh, icd10, primary: diagnoses.length === 0 }]);
  };

  return (
    <div style={{ maxWidth: 700 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--pro-text)", marginBottom: 4 }}>診斷</h2>
      <p style={{ fontSize: 13, color: "var(--pro-text-muted)", marginBottom: 20 }}>點選加入，或手動輸入 ICD-10</p>

      {diagnoses.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--pro-text-muted)", marginBottom: 8 }}>已加入</div>
          {diagnoses.map((d) => (
            <div key={d.icd10} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", marginBottom: 5,
              borderRadius: 8,
              border: `1.5px solid ${d.primary ? "var(--pro-accent)" : "var(--pro-border)"}`,
              background: d.primary ? "var(--pro-accent-dim)" : "var(--pro-bg)",
            }}>
              <button
                onClick={() => setDiagnoses(diagnoses.map((dx) => ({ ...dx, primary: dx.icd10 === d.icd10 })))}
                title="設為主診斷"
                style={{
                  width: 16, height: 16, borderRadius: "50%",
                  border: `2px solid var(--pro-accent)`,
                  background: d.primary ? "var(--pro-accent)" : "transparent",
                  cursor: "pointer", flexShrink: 0,
                }}
              />
              <span style={{ flex: 1, fontSize: 13, fontWeight: d.primary ? 700 : 500, color: "var(--pro-text)" }}>
                {d.name_zh}
              </span>
              <span style={{ fontSize: 11, color: "var(--pro-text-muted)" }}>{d.icd10}</span>
              {d.primary && <span style={{ fontSize: 11, color: "var(--pro-accent)", fontWeight: 700 }}>主診斷</span>}
              <button onClick={() => setDiagnoses(diagnoses.filter((dx) => dx.icd10 !== d.icd10))}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--pro-text-muted)" }}>
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {template && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--pro-text-muted)", marginBottom: 8 }}>
            建議診斷（{template.complaint}）
          </div>
          {template.commonDx.map((d) => {
            const added = diagnoses.some((dx) => dx.icd10 === d.icd10);
            return (
              <button
                key={d.icd10}
                onClick={() => addDx(d.name_zh, d.icd10)}
                disabled={added}
                style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%",
                  padding: "8px 14px", borderRadius: 6, cursor: added ? "default" : "pointer",
                  textAlign: "left", marginBottom: 4,
                  border: "1px solid var(--pro-border)",
                  background: added ? "var(--pro-bg)" : "var(--pro-surface)",
                  opacity: added ? 0.5 : 1,
                }}
              >
                <span style={{ flex: 1, fontSize: 13, color: "var(--pro-text)" }}>{d.name_zh}</span>
                <span style={{ fontSize: 11, color: "var(--pro-text-muted)" }}>{d.icd10}</span>
                {added ? <CheckCircle size={13} color="#22c55e" /> : <Plus size={13} color="var(--pro-accent)" />}
              </button>
            );
          })}
        </div>
      )}

      {/* Manual */}
      <div style={{ padding: 14, borderRadius: 8, border: "1px solid var(--pro-border)", background: "var(--pro-bg)" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--pro-text-muted)", marginBottom: 10 }}>手動輸入</div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text" value={dxInput.name_zh}
            onChange={(e) => setDxInput({ ...dxInput, name_zh: e.target.value })}
            placeholder="診斷名稱"
            style={{ flex: 2, padding: "7px 10px", borderRadius: 6, fontSize: 13, border: "1px solid var(--pro-border)", background: "var(--pro-surface)", color: "var(--pro-text)" }}
          />
          <input
            type="text" value={dxInput.icd10}
            onChange={(e) => setDxInput({ ...dxInput, icd10: e.target.value })}
            placeholder="ICD-10"
            style={{ flex: 1, padding: "7px 10px", borderRadius: 6, fontSize: 13, border: "1px solid var(--pro-border)", background: "var(--pro-surface)", color: "var(--pro-text)" }}
          />
          <button
            onClick={() => { if (dxInput.name_zh && dxInput.icd10) { addDx(dxInput.name_zh, dxInput.icd10); setDxInput({ name_zh: "", icd10: "" }); } }}
            style={{ padding: "7px 14px", borderRadius: 6, border: "none", cursor: "pointer", background: "var(--pro-accent)", color: "#fff", fontSize: 13, fontWeight: 600 }}
          >
            加入
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Step 7: Plan ──────────────────────────────────────────────

function StepPlan({ diagnoses, selectedRx, setSelectedRx, selectedEducation, setSelectedEducation,
  selectedReferrals, setSelectedReferrals, planNotes, setPlanNotes }: {
  diagnoses: Array<{ name_zh: string; icd10: string; primary: boolean }>;
  selectedRx: string[];
  setSelectedRx: (v: string[]) => void;
  selectedEducation: string[];
  setSelectedEducation: (v: string[]) => void;
  selectedReferrals: string[];
  setSelectedReferrals: (v: string[]) => void;
  planNotes: string;
  setPlanNotes: (v: string) => void;
}) {
  const [expandedRxCats, setExpandedRxCats] = useState<string[]>([]);
  const dxNames = diagnoses.map((d) => d.name_zh);
  const allRxKeys = Object.keys(PRESCRIPTION_TEMPLATES);
  const allEduKeys = Object.keys(EDUCATION_TEMPLATES);

  // Match prescription categories to current diagnoses
  const matchedRxKeys = allRxKeys.filter((key) =>
    dxNames.some((n) =>
      n.includes(key.split("/")[0]) ||
      key.includes(n.split("/")[0]) ||
      key.split("急性")[0] === n.split("急性")[0]
    )
  );
  const otherRxKeys = allRxKeys.filter((k) => !matchedRxKeys.includes(k));

  const recommendedEdu = allEduKeys.filter((key) => dxNames.some((n) => n.includes(key)));

  const toggleRx = (label: string) =>
    setSelectedRx(selectedRx.includes(label) ? selectedRx.filter((r) => r !== label) : [...selectedRx, label]);
  const toggleEdu = (key: string) =>
    setSelectedEducation(selectedEducation.includes(key) ? selectedEducation.filter((e) => e !== key) : [...selectedEducation, key]);
  const toggleRef = (key: string) =>
    setSelectedReferrals(selectedReferrals.includes(key) ? selectedReferrals.filter((r) => r !== key) : [...selectedReferrals, key]);
  const toggleCat = (cat: string) =>
    setExpandedRxCats((prev) => prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]);

  const RxCategory = ({ cat, highlighted }: { cat: string; highlighted: boolean }) => {
    const isExpanded = highlighted || expandedRxCats.includes(cat);
    const rxItems = PRESCRIPTION_TEMPLATES[cat];
    const selectedCount = rxItems.filter((rx) => selectedRx.includes(`${rx.drug} ${rx.dose} ${rx.frequency}`)).length;
    return (
      <div style={{ marginBottom: 8 }}>
        <button
          onClick={() => highlighted ? null : toggleCat(cat)}
          style={{
            display: "flex", alignItems: "center", gap: 6, width: "100%",
            padding: "6px 10px", borderRadius: 6, cursor: highlighted ? "default" : "pointer",
            border: `1px solid ${highlighted ? "rgba(59,130,246,0.3)" : "var(--pro-border)"}`,
            background: highlighted ? "var(--pro-accent-dim)" : "var(--pro-surface)",
            textAlign: "left",
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 700, color: highlighted ? "var(--pro-accent)" : "var(--pro-text)", flex: 1 }}>
            {highlighted && "★ "}{cat}
          </span>
          {selectedCount > 0 && (
            <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 10, background: "var(--pro-accent)", color: "#fff" }}>
              {selectedCount}
            </span>
          )}
          {!highlighted && (
            <span style={{ fontSize: 11, color: "var(--pro-text-muted)" }}>{isExpanded ? "▲" : "▼"}</span>
          )}
        </button>
        {isExpanded && (
          <div style={{ marginTop: 4, paddingLeft: 4 }}>
            {rxItems.map((rx) => {
              const label = `${rx.drug} ${rx.dose} ${rx.frequency}`;
              const sel = selectedRx.includes(label);
              return (
                <button key={label} onClick={() => toggleRx(label)} style={{
                  display: "flex", alignItems: "flex-start", gap: 8, width: "100%",
                  padding: "6px 10px", borderRadius: 5, cursor: "pointer", textAlign: "left", marginBottom: 3,
                  border: `1px solid ${sel ? "var(--pro-accent)" : "var(--pro-border)"}`,
                  background: sel ? "var(--pro-accent-dim)" : "var(--pro-bg)",
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: sel ? 700 : 500, color: "var(--pro-text)" }}>
                      {rx.drug}
                      {rx.generic && <span style={{ color: "var(--pro-text-muted)", fontWeight: 400 }}> {rx.generic}</span>}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--pro-accent)" }}>
                      {rx.indication} · {rx.dose} {rx.frequency} {rx.route}
                    </div>
                    {rx.note && <div style={{ fontSize: 11, color: "#f59e0b" }}>⚠ {rx.note}</div>}
                  </div>
                  {sel && <CheckCircle size={13} color="var(--pro-accent)" style={{ flexShrink: 0, marginTop: 2 }} />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, maxWidth: 1000 }}>
      {/* Prescriptions */}
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--pro-text)", marginBottom: 12 }}>💊 處方</h3>
        {matchedRxKeys.length > 0 && (
          <>
            <div style={{ fontSize: 11, color: "var(--pro-text-muted)", marginBottom: 6, fontWeight: 600 }}>★ 本次診斷相關</div>
            {matchedRxKeys.map((cat) => <RxCategory key={cat} cat={cat} highlighted />)}
            {otherRxKeys.length > 0 && (
              <div style={{ fontSize: 11, color: "var(--pro-text-muted)", margin: "12px 0 6px", fontWeight: 600 }}>其他（點選展開）</div>
            )}
          </>
        )}
        {otherRxKeys.map((cat) => <RxCategory key={cat} cat={cat} highlighted={false} />)}
        {matchedRxKeys.length === 0 && allRxKeys.map((cat) => <RxCategory key={cat} cat={cat} highlighted={false} />)}
      </div>

      {/* Education + Referral + Notes */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--pro-text)", marginBottom: 8 }}>📚 衛教</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
            {allEduKeys.map((key) => {
              const sel = selectedEducation.includes(key);
              const rec = recommendedEdu.includes(key);
              return (
                <button key={key} onClick={() => toggleEdu(key)} style={{
                  padding: "5px 12px", borderRadius: 16, fontSize: 12, cursor: "pointer",
                  border: `1.5px solid ${sel ? "#22c55e" : rec ? "#22c55e80" : "var(--pro-border)"}`,
                  background: sel ? "rgba(34,197,94,0.15)" : "transparent",
                  color: sel ? "#22c55e" : "var(--pro-text)", fontWeight: sel ? 700 : 400,
                }}>
                  {rec && !sel ? "★ " : ""}{key}
                </button>
              );
            })}
          </div>
          {selectedEducation.map((key) => (
            <div key={key} style={{ marginBottom: 8, padding: "10px 12px", borderRadius: 8, background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.2)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#22c55e", marginBottom: 5 }}>{key}</div>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {(EDUCATION_TEMPLATES[key] ?? []).map((pt, i) => (
                  <li key={i} style={{ fontSize: 12, color: "var(--pro-text)", marginBottom: 2 }}>{pt}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--pro-text)", marginBottom: 8 }}>🏥 轉介</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
            {Object.keys(REFERRAL_CRITERIA).map((key) => {
              const sel = selectedReferrals.includes(key);
              return (
                <button key={key} onClick={() => toggleRef(key)} style={{
                  padding: "5px 12px", borderRadius: 16, fontSize: 12, cursor: "pointer",
                  border: `1.5px solid ${sel ? "#ef4444" : "var(--pro-border)"}`,
                  background: sel ? "rgba(239,68,68,0.1)" : "transparent",
                  color: sel ? "#ef4444" : "var(--pro-text)", fontWeight: sel ? 700 : 400,
                }}>{key}</button>
              );
            })}
          </div>
          {selectedReferrals.map((key) => (
            <div key={key} style={{ marginBottom: 5, padding: "7px 10px", borderRadius: 7, background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#ef4444", marginBottom: 3 }}>轉介 {key}</div>
              <ul style={{ margin: 0, paddingLeft: 14 }}>
                {REFERRAL_CRITERIA[key].criteria.map((c, i) => (
                  <li key={i} style={{ fontSize: 11, color: "var(--pro-text)" }}>{c}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--pro-text)", marginBottom: 6 }}>📝 備注 / 追蹤計畫</h3>
          <textarea
            value={planNotes}
            onChange={(e) => setPlanNotes(e.target.value)}
            placeholder="追蹤計畫、特殊交代事項..."
            rows={4}
            style={{
              width: "100%", padding: "8px 10px", borderRadius: 6, fontSize: 13,
              border: "1px solid var(--pro-border)", background: "var(--pro-bg)",
              color: "var(--pro-text)", resize: "vertical",
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Right Analysis Panel ──────────────────────────────────────

function RightPanel({ redFlags, taiwanRules, diagnoses, vitals, bmi, patient }: {
  redFlags: string[];
  taiwanRules: ReturnType<typeof runTaiwanRules>;
  diagnoses: Array<{ name_zh: string; icd10: string; primary: boolean }>;
  vitals: { sbp: string; dbp: string; hr: string; temp: string; spo2: string; [k: string]: string };
  bmi: string | null;
  patient: PatientInfo;
}) {
  const sbp = parseFloat(vitals.sbp || "0");
  const hasBpAlert = sbp >= 180;
  const hasContent = hasBpAlert || redFlags.length > 0 || taiwanRules.length > 0 || diagnoses.length > 0 || vitals.sbp || bmi;

  return (
    <div style={{
      width: 240, flexShrink: 0,
      borderLeft: "1px solid var(--pro-border)",
      background: "var(--pro-surface)",
      overflow: "auto", padding: 12,
      display: "flex", flexDirection: "column", gap: 12,
    }}>
      {/* Patient summary */}
      {(patient.name || patient.sex || patient.age) && (
        <div style={{
          padding: "8px 10px", borderRadius: 8,
          background: "var(--pro-bg)", border: "1px solid var(--pro-border)",
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--pro-text-muted)", marginBottom: 4 }}>病患</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--pro-text)" }}>{patient.name || "（未填）"}</div>
          <div style={{ fontSize: 12, color: "var(--pro-text-muted)" }}>
            {patient.sex === "M" ? "男" : patient.sex === "F" ? "女" : ""}
            {patient.age ? ` · ${patient.age}歲` : ""}
          </div>
        </div>
      )}

      {/* Red flags */}
      {(hasBpAlert || redFlags.length > 0) && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
            <AlertTriangle size={12} /> 警示
          </div>
          {hasBpAlert && (
            <div style={{ padding: "5px 8px", borderRadius: 6, marginBottom: 3, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", fontSize: 12, color: "#ef4444", fontWeight: 700 }}>
              🚨 BP 危機：{vitals.sbp}/{vitals.dbp}
            </div>
          )}
          {redFlags.map((flag, i) => (
            <div key={i} style={{ padding: "4px 7px", borderRadius: 5, marginBottom: 3, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", fontSize: 11, color: "#ef4444" }}>
              ⚠ {flag}
            </div>
          ))}
        </div>
      )}

      {/* Taiwan disease detection */}
      {taiwanRules.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--pro-text)", marginBottom: 6 }}>🇹🇼 疾病偵測</div>
          {taiwanRules.map((result, i) => (
            <div key={i} style={{ padding: "7px 9px", borderRadius: 6, marginBottom: 5, background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--pro-accent)" }}>{result.rule.name_zh}</div>
              <div style={{ fontSize: 10, color: "var(--pro-accent)", opacity: 0.7 }}>{result.rule.icd10}</div>
            </div>
          ))}
        </div>
      )}

      {/* Diagnoses */}
      {diagnoses.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--pro-text)", marginBottom: 6 }}>📋 本次診斷</div>
          {diagnoses.map((d) => (
            <div key={d.icd10} style={{
              padding: "5px 8px", borderRadius: 5, marginBottom: 4,
              background: d.primary ? "var(--pro-accent-dim)" : "var(--pro-bg)",
              border: `1px solid ${d.primary ? "rgba(59,130,246,0.3)" : "var(--pro-border)"}`,
            }}>
              <div style={{ fontSize: 11, fontWeight: d.primary ? 700 : 500, color: d.primary ? "var(--pro-accent)" : "var(--pro-text)" }}>
                {d.primary ? "★ " : ""}{d.name_zh}
              </div>
              <div style={{ fontSize: 10, color: "var(--pro-text-muted)" }}>{d.icd10}</div>
            </div>
          ))}
        </div>
      )}

      {/* Vitals summary */}
      {(vitals.sbp || vitals.hr || vitals.temp || bmi) && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--pro-text)", marginBottom: 6 }}>📊 生命徵象</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {vitals.sbp && <div style={{ fontSize: 12, color: "var(--pro-text)" }}>BP: <strong>{vitals.sbp}/{vitals.dbp}</strong> mmHg</div>}
            {vitals.hr && <div style={{ fontSize: 12, color: "var(--pro-text)" }}>HR: <strong>{vitals.hr}</strong> bpm</div>}
            {vitals.temp && <div style={{ fontSize: 12, color: "var(--pro-text)" }}>T: <strong>{vitals.temp}</strong> °C</div>}
            {vitals.spo2 && <div style={{ fontSize: 12, color: "var(--pro-text)" }}>SpO₂: <strong>{vitals.spo2}</strong>%</div>}
            {bmi && (
              <div style={{ fontSize: 12, color: "var(--pro-text)" }}>
                BMI: <strong>{bmi}</strong>
                <span style={{ fontSize: 10, marginLeft: 3, color: parseFloat(bmi) >= 27 ? "#f59e0b" : "var(--pro-text-muted)" }}>
                  {parseFloat(bmi) >= 27 ? "肥胖" : parseFloat(bmi) >= 24 ? "過重" : ""}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {!hasContent && (
        <div style={{ color: "var(--pro-text-muted)", fontSize: 12, textAlign: "center", marginTop: 40 }}>
          開始診療後，分析結果會顯示於此
        </div>
      )}
    </div>
  );
}

// ── 處方藥單預覽 Modal ─────────────────────────────────────────

const FREQ_MAP: Record<string, number> = {
  QD: 1, OD: 1, QN: 1, HS: 1,
  BID: 2, Q12H: 2,
  TID: 3, Q8H: 3,
  QID: 4, Q6H: 4,
};

function parseFreqPerDay(freq: string): number | null {
  if (/prn/i.test(freq)) return null;
  const upper = freq.toUpperCase();
  for (const [key, val] of Object.entries(FREQ_MAP)) {
    if (upper.includes(key)) return val;
  }
  return null;
}

function autoQty(days: number, freq: string): string {
  const n = parseFreqPerDay(freq);
  if (!n) return "PRN";
  return `${days * n} 顆`;
}

function PrescriptionModal({ selectedRx, patientName, visitDate, onClose }: {
  selectedRx: string[];
  patientName: string;
  visitDate: string;
  onClose: () => void;
}) {
  const [items, setItems] = useState<PrescriptionItem[]>(() =>
    selectedRx.map(label => {
      const parts = label.split(" ");
      const freq = parts[parts.length - 1] ?? "";
      return { label, days: 7, totalQty: autoQty(7, freq), note: "" };
    })
  );

  const update = (i: number, field: keyof PrescriptionItem, value: string | number) => {
    setItems(prev => {
      const next = [...prev];
      const row = { ...next[i], [field]: value };
      if (field === "days") {
        const parts = row.label.split(" ");
        const freq = parts[parts.length - 1] ?? "";
        row.totalQty = autoQty(Number(value), freq);
      }
      next[i] = row;
      return next;
    });
  };

  const handlePrint = () => {
    const html = generatePrescriptionHTML({ patientName, visitDate, items });
    printReport(html);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "var(--pro-sidebar)", border: "1px solid var(--pro-border)", borderRadius: 14, width: "100%", maxWidth: 680, maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid var(--pro-border)", flexShrink: 0 }}>
          <div>
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--pro-text)" }}>藥單預覽 / 列印</span>
            <span style={{ fontSize: 12, color: "var(--pro-text-muted)", marginLeft: 10 }}>{patientName} · {visitDate}</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--pro-text-muted)" }}><X size={16} /></button>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "16px 20px" }}>
          <div style={{ fontSize: 12, color: "var(--pro-text-muted)", marginBottom: 12 }}>
            確認並修改各藥物的天數、總量與備註後列印
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--pro-border)" }}>
                <th style={{ textAlign: "left", fontSize: 11, color: "var(--pro-text-muted)", padding: "6px 8px", fontWeight: 600 }}>藥物 / 劑量 / 頻率</th>
                <th style={{ textAlign: "center", fontSize: 11, color: "var(--pro-text-muted)", padding: "6px 8px", fontWeight: 600, width: 80 }}>天數</th>
                <th style={{ textAlign: "center", fontSize: 11, color: "var(--pro-text-muted)", padding: "6px 8px", fontWeight: 600, width: 100 }}>總量</th>
                <th style={{ textAlign: "left", fontSize: 11, color: "var(--pro-text-muted)", padding: "6px 8px", fontWeight: 600 }}>備註</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--pro-border)" }}>
                  <td style={{ padding: "10px 8px", fontSize: 13, color: "var(--pro-text)", fontWeight: 500 }}>
                    {item.label}
                  </td>
                  <td style={{ padding: "10px 8px", textAlign: "center" }}>
                    <input
                      type="number" min={1} max={365}
                      value={item.days}
                      onChange={e => update(i, "days", Number(e.target.value))}
                      className="pro-input"
                      style={{ width: 60, textAlign: "center", padding: "4px 6px", fontSize: 13 }}
                    />
                  </td>
                  <td style={{ padding: "10px 8px", textAlign: "center" }}>
                    <input
                      type="text"
                      value={item.totalQty}
                      onChange={e => update(i, "totalQty", e.target.value)}
                      className="pro-input"
                      style={{ width: 80, textAlign: "center", padding: "4px 6px", fontSize: 13, fontWeight: 600 }}
                    />
                  </td>
                  <td style={{ padding: "10px 8px" }}>
                    <input
                      type="text"
                      value={item.note}
                      onChange={e => update(i, "note", e.target.value)}
                      className="pro-input"
                      placeholder="（選填）"
                      style={{ width: "100%", padding: "4px 8px", fontSize: 12 }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--pro-border)", display: "flex", gap: 8, justifyContent: "flex-end", flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: "8px 18px", borderRadius: 7, border: "1px solid var(--pro-border)", background: "transparent", color: "var(--pro-text-muted)", cursor: "pointer", fontSize: 13 }}>
            取消
          </button>
          <button onClick={handlePrint} className="pro-btn-primary" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Printer size={14} /> 列印藥單
          </button>
        </div>
      </div>
    </div>
  );
}
