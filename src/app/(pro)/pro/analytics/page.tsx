"use client";

import { useEffect, useState } from "react";
import { BarChart3, Users, FileText, Pill, BookOpen, Stethoscope, Sparkles, X } from "lucide-react";
import ProStatCard from "@/components/pro/ProStatCard";

interface AnalyticsData {
  totalUsers: number;
  totalRecords: number;
  totalManual: number;
  totalScan: number;
  totalPatients: number;
  totalMedications: number;
  totalReferences: number;
  diagnosisAccuracy: number | null;
  totalFeedback: number;
  correctCount: number;
  partialCount: number;
  incorrectCount: number;
  weeklyVolume: Array<{ week: string; count: number }>;
  sexDistribution: Array<{ sex: string; count: number }>;
  topMedicationCategories: Array<{ category: string; count: number }>;
}

function SimpleBarChart({ data, maxVal, colorVar = "var(--pro-accent)" }: {
  data: Array<{ label: string; value: number }>;
  maxVal: number;
  colorVar?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {data.map(({ label, value }) => (
        <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 11, color: "var(--pro-text-muted)", width: 80, flexShrink: 0, textAlign: "right" }}>
            {label}
          </div>
          <div style={{ flex: 1, height: 20, background: "var(--pro-bg)", borderRadius: 4, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 4,
              width: `${maxVal > 0 ? (value / maxVal) * 100 : 0}%`,
              background: colorVar,
              transition: "width 0.5s ease",
              display: "flex", alignItems: "center", justifyContent: "flex-end",
              paddingRight: 6,
              minWidth: value > 0 ? 24 : 0,
            }}>
              {value > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: "#fff" }}>{value}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    fetch("/api/pro/analytics")
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setData(d);
        setLoading(false);
      })
      .catch(() => { setError("載入失敗"); setLoading(false); });
  }, []);

  const handleAiAnalysis = async () => {
    if (!data) return;
    setAiLoading(true);
    setAiAnalysis("");
    const accuracy = data.diagnosisAccuracy !== null ? `${data.diagnosisAccuracy}%（共 ${data.totalFeedback} 筆回饋，正確 ${data.correctCount}、部分 ${data.partialCount}、有誤 ${data.incorrectCount}）` : "尚無回饋資料";
    const prompt = `你是一位醫療資訊系統顧問。以下是 ClinCalc Pro 臨床決策平台的最新使用統計，請用繁體中文提供 3-4 點簡短的洞察與建議（每點 1-2 句話，著重臨床實用性）：

平台統計摘要：
- 已登錄 Pro 帳號：${data.totalUsers} 個
- 管理病患記錄：${data.totalPatients} 筆
- 藥物資料庫：${data.totalMedications} 筆
- 醫療參考值：${data.totalReferences} 筆
- AI 診斷準確率（E 指標）：${accuracy}
- 健康記錄總數：${data.totalRecords} 筆（手動 ${data.totalManual}、掃描 ${data.totalScan}）
${data.sexDistribution?.length ? `- 病患性別分布：${data.sexDistribution.map(s => `${s.sex === "M" ? "男" : s.sex === "F" ? "女" : "其他"} ${s.count}人`).join("、")}` : ""}

請聚焦於：平台使用趨勢、AI 診斷準確率的臨床意義、資料庫完整度、以及可優化的方向。`;

    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "analyze", text: prompt }),
      });
      const json = await res.json();
      setAiAnalysis(json.result || json.error || "分析失敗，請稍後再試");
    } catch {
      setAiAnalysis("無法連線至 AI 服務，請確認網路連線");
    }
    setAiLoading(false);
  };

  if (loading) return <div style={{ color: "var(--pro-text-muted)", padding: 40 }}>載入統計資料中...</div>;
  if (error) return <div style={{ color: "var(--pro-danger)", padding: 40 }}>{error}</div>;
  if (!data) return null;

  const weeklyMax = Math.max(...(data.weeklyVolume?.map(w => w.count) || [1]));
  const sexMax = Math.max(...(data.sexDistribution?.map(s => s.count) || [1]));

  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--pro-text)", display: "flex", alignItems: "center", gap: 8 }}>
            <BarChart3 size={20} color="var(--pro-accent)" /> 數據分析
          </h1>
          <p style={{ fontSize: 13, color: "var(--pro-text-muted)", marginTop: 4 }}>平台使用統計概覽</p>
        </div>
        <button
          onClick={handleAiAnalysis}
          disabled={aiLoading}
          style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "8px 16px", borderRadius: 8,
            background: aiLoading ? "var(--pro-bg)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
            border: aiLoading ? "1px solid var(--pro-border)" : "none",
            color: aiLoading ? "var(--pro-text-muted)" : "#fff",
            cursor: aiLoading ? "not-allowed" : "pointer",
            fontSize: 13, fontWeight: 600,
            boxShadow: aiLoading ? "none" : "0 2px 8px rgba(99,102,241,0.35)",
          }}
        >
          <Sparkles size={14} />
          {aiLoading ? "AI 分析中..." : "AI 摘要分析"}
        </button>
      </div>

      {/* Summary cards — A: Accounts, B: Patients, C: Drugs, D: References, E: Accuracy */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14, marginBottom: 28 }}>
        <ProStatCard icon={Users}        value={data.totalUsers}       label="帳號數"      color="blue"   href="/pro/admin/users" />
        <ProStatCard icon={Stethoscope}  value={data.totalPatients}    label="病患記錄"    color="green"  href="/pro/patients" />
        <ProStatCard icon={Pill}         value={data.totalMedications} label="藥物資料庫"  color="yellow" href="/pro/admin/medications" />
        <ProStatCard icon={BookOpen}     value={data.totalReferences}  label="醫療參考值"  color="red"    href="/pro/admin/references" />
        {/* Diagnosis Accuracy */}
        <div className="pro-card" style={{ padding: "14px 18px" }}>
          <div style={{ fontSize: 11, color: "var(--pro-text-muted)", marginBottom: 6, fontWeight: 600 }}>診斷準確率</div>
          {data.diagnosisAccuracy !== null ? (
            <>
              <div style={{ fontSize: 28, fontWeight: 800, color: data.diagnosisAccuracy >= 80 ? "#22c55e" : data.diagnosisAccuracy >= 60 ? "#f59e0b" : "#ef4444" }}>
                {data.diagnosisAccuracy}%
              </div>
              <div style={{ fontSize: 11, color: "var(--pro-text-muted)", marginTop: 4 }}>
                共 {data.totalFeedback} 筆回饋
              </div>
            </>
          ) : (
            <div style={{ fontSize: 13, color: "var(--pro-text-muted)", marginTop: 4 }}>暫無回饋資料</div>
          )}
        </div>
        <ProStatCard icon={FileText}   value={data.totalRecords} label="健康記錄總數" color="blue" href="/pro/admin/records" />
      </div>

      {/* AI Analysis result */}
      {(aiAnalysis || aiLoading) && (
        <div style={{
          marginBottom: 24, padding: "16px 20px", borderRadius: 10,
          background: "linear-gradient(135deg, rgba(99,102,241,0.07), rgba(139,92,246,0.07))",
          border: "1px solid rgba(99,102,241,0.25)",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 700, color: "#6366f1" }}>
              <Sparkles size={14} /> AI 平台分析摘要
            </div>
            {!aiLoading && (
              <button onClick={() => setAiAnalysis("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--pro-text-muted)" }}>
                <X size={14} />
              </button>
            )}
          </div>
          {aiLoading ? (
            <div style={{ fontSize: 13, color: "var(--pro-text-muted)" }}>正在分析平台數據，請稍候...</div>
          ) : (
            <div style={{ fontSize: 13, color: "var(--pro-text)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{aiAnalysis}</div>
          )}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        {/* Weekly volume */}
        {data.weeklyVolume?.length > 0 && (
          <div className="pro-card" style={{ padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--pro-text)", marginBottom: 16 }}>近期記錄量（每週）</div>
            <SimpleBarChart
              data={data.weeklyVolume.map(w => ({ label: w.week, value: w.count }))}
              maxVal={weeklyMax}
              colorVar="var(--pro-accent)"
            />
          </div>
        )}

        {/* Sex distribution of doctor_patients */}
        {data.sexDistribution?.length > 0 && (
          <div className="pro-card" style={{ padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--pro-text)", marginBottom: 16 }}>病患性別分布</div>
            <SimpleBarChart
              data={data.sexDistribution.map(s => ({
                label: s.sex === "M" ? "男" : s.sex === "F" ? "女" : "其他",
                value: s.count,
              }))}
              maxVal={sexMax}
              colorVar="var(--pro-success)"
            />
          </div>
        )}

        {/* Record type breakdown */}
        <div className="pro-card" style={{ padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--pro-text)", marginBottom: 16 }}>記錄類型佔比</div>
          {data.totalRecords > 0 ? (
            <>
              <div style={{ display: "flex", height: 20, borderRadius: 6, overflow: "hidden", marginBottom: 12 }}>
                <div style={{ width: `${(data.totalManual / data.totalRecords) * 100}%`, background: "var(--pro-accent)" }} />
                <div style={{ width: `${(data.totalScan / data.totalRecords) * 100}%`, background: "var(--pro-success)" }} />
              </div>
              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: "var(--pro-accent)" }} />
                  <span style={{ fontSize: 12, color: "var(--pro-text-muted)" }}>手動 {data.totalManual}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: "var(--pro-success)" }} />
                  <span style={{ fontSize: 12, color: "var(--pro-text-muted)" }}>掃描 {data.totalScan}</span>
                </div>
              </div>
            </>
          ) : (
            <p style={{ color: "var(--pro-text-muted)", fontSize: 13 }}>尚無記錄</p>
          )}
        </div>

        {/* E: Diagnosis feedback breakdown */}
        {data.totalFeedback > 0 && (
          <div className="pro-card" style={{ padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--pro-text)", marginBottom: 16 }}>診斷回饋分布</div>
            <div style={{ display: "flex", height: 20, borderRadius: 6, overflow: "hidden", marginBottom: 12 }}>
              <div style={{ width: `${(data.correctCount / data.totalFeedback) * 100}%`, background: "#22c55e" }} />
              <div style={{ width: `${(data.partialCount / data.totalFeedback) * 100}%`, background: "#f59e0b" }} />
              <div style={{ width: `${(data.incorrectCount / data.totalFeedback) * 100}%`, background: "#ef4444" }} />
            </div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {[
                { label: "✓ 正確", count: data.correctCount,   color: "#22c55e" },
                { label: "△ 部分", count: data.partialCount,   color: "#f59e0b" },
                { label: "✗ 有誤", count: data.incorrectCount, color: "#ef4444" },
              ].map(({ label, count, color }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
                  <span style={{ fontSize: 12, color: "var(--pro-text-muted)" }}>
                    {label} {count}筆（{data.totalFeedback > 0 ? Math.round((count / data.totalFeedback) * 100) : 0}%）
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top medication categories */}
        {data.topMedicationCategories?.length > 0 && (
          <div className="pro-card" style={{ padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--pro-text)", marginBottom: 16 }}>藥物資料庫分類</div>
            <SimpleBarChart
              data={data.topMedicationCategories.map(c => ({ label: c.category, value: c.count }))}
              maxVal={Math.max(...data.topMedicationCategories.map(c => c.count))}
              colorVar="var(--pro-warning)"
            />
          </div>
        )}
      </div>
    </div>
  );
}
