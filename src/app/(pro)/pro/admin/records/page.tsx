"use client";

import React, { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

interface ClinicalRecord {
  id: string;
  doctor_id: string;
  patient_id: string | null;
  visit_date: string;
  chief_complaint: string | null;
  assessment: string | null;
  plan: string | null;
  icd10_codes: string[] | null;
  diagnosis_accuracy: string | null;
  created_at: string;
  // joined
  doctor_email?: string;
  patient_name?: string;
}

const PAGE_SIZE = 25;

const ACCURACY_LABELS: Record<string, { label: string; color: string }> = {
  correct:   { label: "✓ 正確",   color: "#22c55e" },
  partial:   { label: "△ 部分",   color: "#f59e0b" },
  incorrect: { label: "✗ 有誤",   color: "#ef4444" },
};

export default function AdminRecordsPage() {
  const [records, setRecords] = useState<ClinicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [accuracyFilter, setAccuracyFilter] = useState<"all" | "correct" | "partial" | "incorrect" | "null">("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const supabase = createClient();

    let query = supabase
      .from("clinical_records")
      .select(`
        id, doctor_id, patient_id, visit_date,
        chief_complaint, assessment, plan, icd10_codes,
        diagnosis_accuracy, created_at
      `, { count: "exact" })
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (dateFrom) query = query.gte("visit_date", dateFrom);
    if (dateTo) query = query.lte("visit_date", dateTo);
    if (accuracyFilter === "null") query = query.is("diagnosis_accuracy", null);
    else if (accuracyFilter !== "all") query = query.eq("diagnosis_accuracy", accuracyFilter);

    const { data, count } = await query;
    setRecords((data as ClinicalRecord[]) || []);
    setTotal(count || 0);
    setLoading(false);
  };

  useEffect(() => { load(); }, [page, dateFrom, dateTo, accuracyFilter]);

  const maskId = (uid: string) => `${uid.slice(0, 8)}...${uid.slice(-4)}`;

  return (
    <div style={{ maxWidth: 1200 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--pro-text)" }}>健康記錄總覽</h1>
        <p style={{ fontSize: 13, color: "var(--pro-text-muted)", marginTop: 2 }}>
          Pro 模組門診病歷（SOAP） · 唯讀 · 共 {total} 筆
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        {/* Accuracy filter */}
        <div style={{ display: "flex", gap: 4, borderRadius: 7, padding: 3, background: "var(--pro-bg)", border: "1px solid var(--pro-border)" }}>
          {([
            { key: "all", label: "全部" },
            { key: "correct", label: "✓ 正確" },
            { key: "partial", label: "△ 部分" },
            { key: "incorrect", label: "✗ 有誤" },
            { key: "null", label: "未標記" },
          ] as const).map(({ key, label }) => (
            <button key={key} onClick={() => { setAccuracyFilter(key); setPage(0); }} style={{
              padding: "5px 12px", borderRadius: 5, border: "none", cursor: "pointer", fontSize: 11,
              background: accuracyFilter === key ? "var(--pro-accent)" : "transparent",
              color: accuracyFilter === key ? "#fff" : "var(--pro-text-muted)",
              fontWeight: accuracyFilter === key ? 700 : 400,
            }}>
              {label}
            </button>
          ))}
        </div>
        <input type="date" className="pro-input" value={dateFrom}
          onChange={e => { setDateFrom(e.target.value); setPage(0); }} style={{ width: "auto" }} />
        <span style={{ fontSize: 12, color: "var(--pro-text-muted)" }}>至</span>
        <input type="date" className="pro-input" value={dateTo}
          onChange={e => { setDateTo(e.target.value); setPage(0); }} style={{ width: "auto" }} />
      </div>

      <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid var(--pro-border)" }}>
        <table className="pro-table">
          <thead>
            <tr>
              <th style={{ width: 36 }}></th>
              <th>就診日期</th>
              <th>主訴</th>
              <th>診斷</th>
              <th>ICD-10</th>
              <th style={{ width: 80 }}>準確率</th>
              <th style={{ width: 120 }}>醫師</th>
              <th style={{ width: 100 }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: 32, color: "var(--pro-text-muted)" }}>載入中...</td></tr>
            )}
            {!loading && records.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: 32, color: "var(--pro-text-muted)" }}>無記錄</td></tr>
            )}
            {!loading && records.map(r => {
              const acc = r.diagnosis_accuracy ? ACCURACY_LABELS[r.diagnosis_accuracy] : null;
              return (
                <React.Fragment key={r.id}>
                  <tr>
                    <td>
                      <button onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--pro-text-muted)" }}>
                        {expanded === r.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>
                    </td>
                    <td style={{ fontSize: 12, color: "var(--pro-text)", fontWeight: 500 }}>
                      {r.visit_date}
                    </td>
                    <td style={{ fontSize: 12, color: "var(--pro-text)" }}>
                      {r.chief_complaint || <span style={{ color: "var(--pro-text-muted)" }}>—</span>}
                    </td>
                    <td style={{ fontSize: 12, color: "var(--pro-text-muted)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.assessment ? r.assessment.slice(0, 60) + (r.assessment.length > 60 ? "..." : "") : "—"}
                    </td>
                    <td style={{ fontSize: 11 }}>
                      <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                        {(r.icd10_codes || []).slice(0, 3).map(code => (
                          <span key={code} style={{ padding: "1px 5px", borderRadius: 4, background: "var(--pro-accent-dim)", color: "var(--pro-accent)", fontSize: 10, fontWeight: 600 }}>
                            {code}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      {acc ? (
                        <span style={{ fontSize: 11, fontWeight: 700, color: acc.color }}>{acc.label}</span>
                      ) : (
                        <span style={{ fontSize: 11, color: "var(--pro-text-muted)" }}>未標記</span>
                      )}
                    </td>
                    <td style={{ fontFamily: "monospace", fontSize: 10, color: "var(--pro-text-muted)" }}>
                      {maskId(r.doctor_id)}
                    </td>
                    <td>
                      {r.patient_id && (
                        <Link href={`/pro/patients/${r.patient_id}`}
                          style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--pro-accent)", textDecoration: "none" }}>
                          <ExternalLink size={10} /> 病患
                        </Link>
                      )}
                    </td>
                  </tr>
                  {expanded === r.id && (
                    <tr key={`${r.id}-exp`}>
                      <td colSpan={8} style={{ background: "var(--pro-bg)", padding: "14px 20px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, fontSize: 12 }}>
                          <div>
                            <div style={{ fontWeight: 700, color: "var(--pro-text-muted)", marginBottom: 4, fontSize: 11 }}>Assessment</div>
                            <div style={{ color: "var(--pro-text)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{r.assessment || "—"}</div>
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: "var(--pro-text-muted)", marginBottom: 4, fontSize: 11 }}>Plan</div>
                            <div style={{ color: "var(--pro-text)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{r.plan || "—"}</div>
                          </div>
                        </div>
                        <div style={{ marginTop: 10, fontSize: 11, color: "var(--pro-text-muted)" }}>
                          記錄 ID：<code>{r.id}</code> · 醫師：<code>{r.doctor_id}</code>
                          {r.patient_id && <> · 病患：<code>{r.patient_id}</code></>}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
        <div style={{ fontSize: 12, color: "var(--pro-text-muted)" }}>
          第 {page + 1} 頁，共 {Math.ceil(total / PAGE_SIZE) || 1} 頁
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="pro-btn-ghost" disabled={page === 0} onClick={() => setPage(p => p - 1)} style={{ padding: "6px 12px", fontSize: 12 }}>上一頁</button>
          <button className="pro-btn-ghost" disabled={(page + 1) * PAGE_SIZE >= total} onClick={() => setPage(p => p + 1)} style={{ padding: "6px 12px", fontSize: 12 }}>下一頁</button>
        </div>
      </div>
    </div>
  );
}
