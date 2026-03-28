/**
 * resourceUpdates.ts
 *
 * 維護已知的最新版本清單。當主要指引出版新版本時，在此新增或更新條目。
 * API route /api/pro/resources/check-updates 會比對資料庫中的 pro_resources，
 * 找出版本落後的項目並提示管理員更新。
 *
 * 每個條目的 titleMatch 是用 toLowerCase().includes() 做模糊匹配，
 * 建議用足夠特定的字串避免誤判。
 */

export interface KnownUpdate {
  /** 用於模糊匹配資料庫中的 title（toLowerCase includes） */
  titleMatch: string;
  /** 最新已知版本年份 */
  latestYear: string;
  /** 最新版本完整標題 */
  latestTitle: string;
  /** 最新版本 URL */
  latestUrl: string;
  /** 來源說明（顯示用） */
  source: string;
  /** 本版更新要點摘要 */
  changeNote: string;
  /** 指引類別 */
  category: string;
}

export const KNOWN_UPDATES: KnownUpdate[] = [
  // ── 糖尿病 ──────────────────────────────────────────────────
  {
    titleMatch: "standards of care in diabetes",
    latestYear: "2026",
    latestTitle: "Standards of Care in Diabetes — 2026",
    latestUrl: "https://diabetesjournals.org/care/issue/49/Supplement_1",
    source: "ADA, Diabetes Care 2026;49(Suppl.1)",
    changeNote: "2026 更新：tirzepatide 相關章節擴充、低血糖預防策略修訂、心血管保護藥物分層建議更新",
    category: "糖尿病",
  },

  // ── 呼吸道 ──────────────────────────────────────────────────
  {
    titleMatch: "global strategy for asthma",
    latestYear: "2025",
    latestTitle: "Global Strategy for Asthma Management and Prevention (GINA 2025)",
    latestUrl: "https://ginasthma.org/2025-gina-report-global-strategy-for-asthma-management-and-prevention/",
    source: "Global Initiative for Asthma (GINA) 2025",
    changeNote: "2025 更新：生物製劑適應症擴大、ICS-formoterol MART 療法進一步確立",
    category: "氣喘",
  },
  {
    titleMatch: "global strategy for prevention, diagnosis and management of copd",
    latestYear: "2025",
    latestTitle: "Global Strategy for Prevention, Diagnosis and Management of COPD (GOLD 2025)",
    latestUrl: "https://goldcopd.org/2025-gold-report/",
    source: "Global Initiative for Chronic Obstructive Lung Disease (GOLD) 2025",
    changeNote: "2025 更新：ABCD 群組分類調整、Triple therapy 適應症更新",
    category: "COPD",
  },

  // ── 高血壓 ──────────────────────────────────────────────────
  {
    titleMatch: "2023 esh guidelines",
    latestYear: "2023",
    latestTitle: "2023 ESH Guidelines for the Management of Arterial Hypertension",
    latestUrl: "https://www.karger.com/Article/FullText/531488",
    source: "European Society of Hypertension (ESH) 2023",
    changeNote: "目前最新版（2023）",
    category: "高血壓",
  },

  // ── 腎臟病 ──────────────────────────────────────────────────
  {
    titleMatch: "kdigo 2024 clinical practice guideline for the evaluation",
    latestYear: "2024",
    latestTitle: "KDIGO 2024 Clinical Practice Guideline for the Evaluation and Management of CKD",
    latestUrl: "https://kdigo.org/guidelines/ckd-evaluation-and-management/",
    source: "Kidney Disease: Improving Global Outcomes (KDIGO) 2024",
    changeNote: "目前最新版（2024）",
    category: "腎臟病",
  },

  // ── 血脂 ──────────────────────────────────────────────────
  {
    titleMatch: "esc/eas guidelines for the management of dyslipidaemia",
    latestYear: "2019",
    latestTitle: "2019 ESC/EAS Guidelines for the Management of Dyslipidaemias",
    latestUrl: "https://www.escardio.org/Guidelines/Clinical-Practice-Guidelines/Dyslipidaemias-Management-of",
    source: "European Society of Cardiology / European Atherosclerosis Society 2019",
    changeNote: "目前最新版（2019），ESC 2025 更新預計發布",
    category: "血脂",
  },

  // ── 骨關節 ──────────────────────────────────────────────────
  {
    titleMatch: "acr guideline for the management of gout",
    latestYear: "2020",
    latestTitle: "2020 American College of Rheumatology Guideline for the Management of Gout",
    latestUrl: "https://www.rheumatology.org/Practice-Quality/Clinical-Support/Clinical-Practice-Guidelines/Gout",
    source: "American College of Rheumatology (ACR) 2020",
    changeNote: "目前最新版（2020）",
    category: "痛風",
  },

  // ── 心臟病 ──────────────────────────────────────────────────
  {
    titleMatch: "acc/aha guideline on the primary prevention of cardiovascular disease",
    latestYear: "2019",
    latestTitle: "2019 ACC/AHA Guideline on the Primary Prevention of Cardiovascular Disease",
    latestUrl: "https://www.jacc.org/doi/10.1016/j.jacc.2019.03.010",
    source: "American College of Cardiology / American Heart Association 2019",
    changeNote: "目前最新版（2019）",
    category: "心血管",
  },
];

/**
 * 根據資源標題找出對應的已知更新條目
 */
export function findUpdate(title: string): KnownUpdate | undefined {
  const lower = title.toLowerCase();
  return KNOWN_UPDATES.find(u => lower.includes(u.titleMatch.toLowerCase()));
}
