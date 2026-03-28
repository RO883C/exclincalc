"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Plus, X } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

// ── Defined outside component so React doesn't remount on re-render ──
function LabeledField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--pro-text-muted)", marginBottom: 6 }}>
        {label}{required && <span style={{ color: "var(--pro-danger)", marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const COMMON_CONDITIONS = ["高血壓", "糖尿病", "高血脂", "心臟病", "慢性腎病", "氣喘", "甲狀腺疾病", "痛風"];
const COMMON_ALLERGIES = ["青黴素", "磺胺類", "阿斯匹林", "NSAIDs", "碘顯影劑", "乳膠"];

export default function NewPatientPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [conditionInput, setConditionInput] = useState("");
  const [allergyInput, setAllergyInput] = useState("");
  const [form, setForm] = useState({
    full_name: "",
    date_of_birth: "",
    sex: "",
    id_number: "",
    nhi_number: "",
    phone: "",
    email: "",
    blood_type: "",
    chronic_conditions: [] as string[],
    allergies: [] as string[],
    notes: "",
  });

  const set = (k: string, v: unknown) => setForm(prev => ({ ...prev, [k]: v }));

  const addTag = (field: "chronic_conditions" | "allergies", val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    if (!form[field].includes(trimmed)) {
      set(field, [...form[field], trimmed]);
    }
    if (field === "chronic_conditions") setConditionInput("");
    else setAllergyInput("");
  };

  const removeTag = (field: "chronic_conditions" | "allergies", val: string) => {
    set(field, form[field].filter(v => v !== val));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim()) { setError("請填寫姓名"); return; }
    setSaving(true);
    setError("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error: err } = await supabase.from("doctor_patients").insert({
      doctor_id: user.id,
      full_name: form.full_name.trim(),
      date_of_birth: form.date_of_birth || null,
      sex: form.sex || null,
      id_number: form.id_number || null,
      nhi_number: form.nhi_number || null,
      phone: form.phone || null,
      email: form.email || null,
      blood_type: form.blood_type || null,
      chronic_conditions: form.chronic_conditions,
      allergies: form.allergies,
      notes: form.notes || null,
    }).select("id").single();
    if (err) { setError(err.message); setSaving(false); return; }
    router.push(`/pro/patients/${data.id}`);
  };

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <Link href="/pro/patients" className="pro-btn-ghost" style={{ padding: "7px 10px" }}>
          <ArrowLeft size={15} />
        </Link>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--pro-text)" }}>新增病患</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="pro-card" style={{ padding: 24, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--pro-text)", marginBottom: 18, paddingBottom: 12, borderBottom: "1px solid var(--pro-border)" }}>
            基本資料
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ gridColumn: "span 2" }}>
              <LabeledField label="姓名" required>
                <input className="pro-input" value={form.full_name} onChange={e => set("full_name", e.target.value)} placeholder="病患全名" />
              </LabeledField>
            </div>
            <LabeledField label="出生日期">
              <input className="pro-input" type="date" value={form.date_of_birth} onChange={e => set("date_of_birth", e.target.value)} />
            </LabeledField>
            <LabeledField label="性別">
              <select className="pro-input" value={form.sex} onChange={e => set("sex", e.target.value)}>
                <option value="">請選擇</option>
                <option value="M">男</option>
                <option value="F">女</option>
                <option value="Other">其他</option>
              </select>
            </LabeledField>
            <LabeledField label="身分證字號">
              <input className="pro-input" value={form.id_number} onChange={e => set("id_number", e.target.value)} placeholder="A123456789" />
            </LabeledField>
            <LabeledField label="健保卡號">
              <input className="pro-input" value={form.nhi_number} onChange={e => set("nhi_number", e.target.value)} placeholder="健保卡號（如與身分證不同時填寫）" />
            </LabeledField>
            <LabeledField label="血型">
              <select className="pro-input" value={form.blood_type} onChange={e => set("blood_type", e.target.value)}>
                <option value="">不明</option>
                {BLOOD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </LabeledField>
            <LabeledField label="電話">
              <input className="pro-input" value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="0912-345-678" />
            </LabeledField>
            <LabeledField label="電子郵件">
              <input className="pro-input" type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="patient@email.com" />
            </LabeledField>
          </div>
        </div>

        <div className="pro-card" style={{ padding: 24, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--pro-text)", marginBottom: 18, paddingBottom: 12, borderBottom: "1px solid var(--pro-border)" }}>
            病史與過敏
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <LabeledField label="慢性疾病">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                {form.chronic_conditions.map(c => (
                  <span key={c} className="pro-badge pro-badge-yellow" style={{ gap: 5 }}>
                    {c}
                    <button type="button" onClick={() => removeTag("chronic_conditions", c)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", padding: 0 }}><X size={10} /></button>
                  </span>
                ))}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
                {COMMON_CONDITIONS.filter(c => !form.chronic_conditions.includes(c)).map(c => (
                  <button key={c} type="button" onClick={() => addTag("chronic_conditions", c)}
                    style={{ padding: "3px 10px", borderRadius: 5, fontSize: 12, background: "var(--pro-card-hover)", color: "var(--pro-text-muted)", border: "1px solid var(--pro-border)", cursor: "pointer" }}>
                    + {c}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input className="pro-input" value={conditionInput} onChange={e => setConditionInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag("chronic_conditions", conditionInput); } }}
                  placeholder="自訂疾病名稱，按 Enter 新增" />
                <button type="button" onClick={() => addTag("chronic_conditions", conditionInput)} className="pro-btn-ghost"><Plus size={14} /></button>
              </div>
            </LabeledField>

            <LabeledField label="藥物/食物過敏">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                {form.allergies.map(a => (
                  <span key={a} className="pro-badge pro-badge-red" style={{ gap: 5 }}>
                    {a}
                    <button type="button" onClick={() => removeTag("allergies", a)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", padding: 0 }}><X size={10} /></button>
                  </span>
                ))}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
                {COMMON_ALLERGIES.filter(a => !form.allergies.includes(a)).map(a => (
                  <button key={a} type="button" onClick={() => addTag("allergies", a)}
                    style={{ padding: "3px 10px", borderRadius: 5, fontSize: 12, background: "var(--pro-card-hover)", color: "var(--pro-text-muted)", border: "1px solid var(--pro-border)", cursor: "pointer" }}>
                    + {a}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input className="pro-input" value={allergyInput} onChange={e => setAllergyInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag("allergies", allergyInput); } }}
                  placeholder="自訂過敏原，按 Enter 新增" />
                <button type="button" onClick={() => addTag("allergies", allergyInput)} className="pro-btn-ghost"><Plus size={14} /></button>
              </div>
            </LabeledField>

            <LabeledField label="備註">
              <textarea className="pro-input" value={form.notes} onChange={e => set("notes", e.target.value)} rows={3} placeholder="其他補充說明..." />
            </LabeledField>
          </div>
        </div>

        {error && (
          <div style={{ padding: "10px 14px", background: "var(--pro-danger-dim)", color: "var(--pro-danger)", borderRadius: 8, marginBottom: 14, fontSize: 13 }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Link href="/pro/patients" className="pro-btn-ghost">取消</Link>
          <button type="submit" className="pro-btn-primary" disabled={saving}>
            <Save size={14} />
            {saving ? "儲存中..." : "建立病患"}
          </button>
        </div>
      </form>
    </div>
  );
}
