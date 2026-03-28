"use client";

import { useEffect, useState } from "react";
import { FlaskConical, Search, AlertTriangle, BookOpen, ExternalLink, Pill, ShieldAlert, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";

interface Medication {
  id: string;
  name_zh: string;
  name_en: string;
  generic_name: string | null;
  category: string;
  uses_zh: string;
  side_effects_zh: string | null;
  common_dosage: string | null;
  warnings_zh: string | null;
  interactions: string[] | null;
  prescription_required: boolean;
  source: string | null;
}

export default function PharmacyPage() {
  const [meds, setMeds] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Medication | null>(null);
  const [filterRx, setFilterRx] = useState<"all" | "rx" | "otc">("all");

  useEffect(() => {
    const supabase = createClient();
    supabase.from("medications").select("*").order("name_zh")
      .then(({ data }) => { setMeds((data as Medication[]) || []); setLoading(false); });
  }, []);

  const filtered = meds.filter(m => {
    const matchRx = filterRx === "all" || (filterRx === "rx" ? m.prescription_required : !m.prescription_required);
    const q = search.toLowerCase();
    const matchSearch = !q ||
      m.name_zh.toLowerCase().includes(q) ||
      m.name_en.toLowerCase().includes(q) ||
      (m.generic_name?.toLowerCase().includes(q) ?? false) ||
      m.category.toLowerCase().includes(q);
    return matchRx && matchSearch;
  });

  const rxCount = meds.filter(m => m.prescription_required).length;
  const otcCount = meds.filter(m => !m.prescription_required).length;

  return (
    <div style={{ maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--pro-text)", display: "flex", alignItems: "center", gap: 8 }}>
          <FlaskConical size={20} color="#f59e0b" /> 藥師工作台
        </h1>
        <p style={{ fontSize: 13, color: "var(--pro-text-muted)", marginTop: 4 }}>
          藥物查詢、仿單資訊、交互作用快速核對
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { label: "藥物總數", value: meds.length, color: "#6366f1", icon: <Pill size={16} /> },
          { label: "處方藥（Rx）", value: rxCount, color: "#ef4444", icon: <ShieldAlert size={16} /> },
          { label: "成藥（OTC）", value: otcCount, color: "#22c55e", icon: <CheckCircle size={16} /> },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="pro-card" style={{ padding: "12px 18px", display: "flex", alignItems: "center", gap: 12, flex: "1 1 160px" }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", color }}>
              {icon}
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "var(--pro-text)" }}>{value}</div>
              <div style={{ fontSize: 11, color: "var(--pro-text-muted)" }}>{label}</div>
            </div>
          </div>
        ))}
        <Link href="/pro/drugs" className="pro-card" style={{
          padding: "12px 18px", display: "flex", alignItems: "center", gap: 12,
          flex: "1 1 160px", textDecoration: "none", cursor: "pointer",
          border: "1px dashed var(--pro-border)",
        }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(245,158,11,0.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "#f59e0b" }}>
            <AlertTriangle size={16} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--pro-text)" }}>藥物交互作用</div>
            <div style={{ fontSize: 11, color: "var(--pro-accent)" }}>前往交互作用檢查 →</div>
          </div>
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 360px" : "1fr", gap: 16 }}>
        {/* Left: Search + List */}
        <div>
          {/* Toolbar */}
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
              <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--pro-text-muted)", pointerEvents: "none" }} />
              <input
                className="pro-input"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="搜尋藥名（中文 / 英文 / 學名 / 分類）..."
                style={{ paddingLeft: 32, width: "100%" }}
              />
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

          {/* Drug list */}
          <div style={{ borderRadius: 10, border: "1px solid var(--pro-border)", overflow: "hidden" }}>
            {loading && <div style={{ padding: 32, textAlign: "center", color: "var(--pro-text-muted)" }}>載入中...</div>}
            {!loading && filtered.length === 0 && <div style={{ padding: 32, textAlign: "center", color: "var(--pro-text-muted)" }}>無符合藥物</div>}
            {filtered.map((m, i) => (
              <div
                key={m.id}
                onClick={() => setSelected(prev => prev?.id === m.id ? null : m)}
                style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                  borderBottom: i < filtered.length - 1 ? "1px solid var(--pro-border)" : "none",
                  background: selected?.id === m.id ? "var(--pro-accent-dim)" : "var(--pro-sidebar)",
                  cursor: "pointer", transition: "background 0.1s",
                }}
                onMouseEnter={e => { if (selected?.id !== m.id) (e.currentTarget as HTMLElement).style.background = "var(--pro-bg)"; }}
                onMouseLeave={e => { if (selected?.id !== m.id) (e.currentTarget as HTMLElement).style.background = "var(--pro-sidebar)"; }}
              >
                <span style={{
                  padding: "2px 7px", borderRadius: 4, fontSize: 10, fontWeight: 700, flexShrink: 0,
                  background: m.prescription_required ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.12)",
                  color: m.prescription_required ? "#ef4444" : "#22c55e",
                }}>
                  {m.prescription_required ? "Rx" : "OTC"}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--pro-text)" }}>{m.name_zh}</div>
                  <div style={{ fontSize: 11, color: "var(--pro-text-muted)", marginTop: 1 }}>
                    {m.name_en}{m.generic_name ? ` · ${m.generic_name}` : ""}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: "var(--pro-text-muted)", flexShrink: 0 }}>{m.category}</div>
                {m.interactions && m.interactions.length > 0 && (
                  <span title={`${m.interactions.length} 個交互作用`}>
                    <AlertTriangle size={12} color="#f59e0b" />
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Detail panel */}
        {selected && (
          <div className="pro-card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14, height: "fit-content", position: "sticky", top: 16 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--pro-text)" }}>{selected.name_zh}</div>
                <div style={{ fontSize: 12, color: "var(--pro-text-muted)", marginTop: 2 }}>{selected.name_en}{selected.generic_name ? ` (${selected.generic_name})` : ""}</div>
              </div>
              <span style={{
                padding: "3px 9px", borderRadius: 6, fontSize: 11, fontWeight: 700, flexShrink: 0,
                background: selected.prescription_required ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.12)",
                color: selected.prescription_required ? "#ef4444" : "#22c55e",
              }}>
                {selected.prescription_required ? "處方藥 Rx" : "成藥 OTC"}
              </span>
            </div>

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 8, background: "rgba(99,102,241,0.12)", color: "#6366f1", fontWeight: 600 }}>{selected.category}</span>
              {selected.source && (
                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 8, background: "var(--pro-bg)", color: "var(--pro-text-muted)", border: "1px solid var(--pro-border)" }}>
                  <BookOpen size={9} style={{ display: "inline", marginRight: 3 }} />{selected.source}
                </span>
              )}
            </div>

            {[
              { label: "適應症", value: selected.uses_zh },
              { label: "常見劑量", value: selected.common_dosage },
              { label: "副作用", value: selected.side_effects_zh },
              { label: "警告", value: selected.warnings_zh, danger: true },
            ].map(({ label, value, danger }) => value ? (
              <div key={label}>
                <div style={{ fontSize: 11, fontWeight: 700, color: danger ? "var(--pro-danger)" : "var(--pro-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 13, color: danger ? "var(--pro-text)" : "var(--pro-text)", lineHeight: 1.6 }}>{value}</div>
              </div>
            ) : null)}

            {selected.interactions && selected.interactions.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
                  <AlertTriangle size={11} /> 藥物交互作用（{selected.interactions.length}）
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {selected.interactions.map(i => (
                    <div key={i} style={{ fontSize: 12, color: "var(--pro-text)", padding: "4px 8px", borderRadius: 5, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
                      {i}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Link
              href={`/pro/drugs?q=${encodeURIComponent(selected.name_en)}`}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px", borderRadius: 7, background: "rgba(245,158,11,0.1)", color: "#f59e0b", textDecoration: "none", fontSize: 13, fontWeight: 600, border: "1px solid rgba(245,158,11,0.2)", marginTop: 4 }}
            >
              <AlertTriangle size={13} /> 開啟交互作用檢查
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
