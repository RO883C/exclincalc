/**
 * 台灣家醫科 — 漸進式分階段檢查系統
 * 依主訴引導醫師由基本到進階，逐步縮小鑑別診斷範圍
 */

// ── 檢查套組定義 ─────────────────────────────────────────────

export interface ExamPackage {
  id: string;
  label: string;
  labelEn: string;
  stage: 1 | 2 | 3 | 4;
  icon: string;
  keys: string[];          // keys from REFERENCE_RANGES
  rationale: string;
  color: string;
  suggestIf?: (data: Record<string, string>) => boolean; // auto-suggest rule
}

export const EXAM_PACKAGES: ExamPackage[] = [
  // ── Stage 1：基本評估（所有診次必做）──────────────────────────
  {
    id: "vitals",
    label: "生命徵象",
    labelEn: "Vital Signs",
    stage: 1,
    icon: "🫀",
    keys: ["sbp", "dbp", "hr", "temp", "spo2", "bmi", "weight", "height", "waist"],
    rationale: "基本評估，所有診次必做",
    color: "#3b82f6",
  },
  {
    id: "cbc",
    label: "全血球計數 CBC",
    labelEn: "Complete Blood Count",
    stage: 1,
    icon: "🩸",
    keys: ["wbc", "rbc", "hgb", "hct", "plt", "mcv", "mch", "mchc"],
    rationale: "貧血、感染、血液疾病基本篩檢",
    color: "#ef4444",
  },
  // ── Stage 2：代謝評估（家醫科常規）──────────────────────────
  {
    id: "glucose",
    label: "血糖 / 糖化血色素",
    labelEn: "Glucose / HbA1c",
    stage: 2,
    icon: "🍬",
    keys: ["fbs", "hba1c"],
    rationale: "糖尿病篩檢，台灣約 11% 成人患病",
    color: "#f97316",
    suggestIf: (d) => parseFloat(d.fbs) > 100 || parseFloat(d.bmi) > 25,
  },
  {
    id: "lipids",
    label: "血脂四項",
    labelEn: "Lipid Panel",
    stage: 2,
    icon: "🫙",
    keys: ["tcho", "tg", "hdl", "ldl"],
    rationale: "心血管疾病風險評估",
    color: "#eab308",
    suggestIf: (d) => parseFloat(d.bmi) > 24 || parseFloat(d.fbs) > 100,
  },
  {
    id: "uric_acid",
    label: "尿酸",
    labelEn: "Uric Acid",
    stage: 2,
    icon: "⚡",
    keys: ["uric_acid"],
    rationale: "台灣痛風盛行率亞洲最高，建議常規",
    color: "#8b5cf6",
    suggestIf: (d) => parseFloat(d.cr) > 1.2,
  },
  // ── Stage 3：器官功能（有代謝異常時追加）────────────────────
  {
    id: "renal",
    label: "腎功能",
    labelEn: "Renal Function",
    stage: 3,
    icon: "🫘",
    keys: ["cr", "bun", "egfr"],
    rationale: "台灣慢性腎病盛行率居全球前列 (12%)",
    color: "#06b6d4",
    suggestIf: (d) =>
      parseFloat(d.hba1c) > 6.5 ||
      parseFloat(d.sbp) > 140 ||
      parseFloat(d.uric_acid) > 7.0,
  },
  {
    id: "liver",
    label: "肝功能",
    labelEn: "Liver Function",
    stage: 3,
    icon: "🟫",
    keys: ["ast", "alt", "ggt", "albumin", "tbili"],
    rationale: "台灣 B/C 型肝炎盛行，肝功能應定期監控",
    color: "#84cc16",
    suggestIf: (d) => parseFloat(d.bmi) > 25 || parseFloat(d.tg) > 200,
  },
  {
    id: "electrolytes",
    label: "電解質",
    labelEn: "Electrolytes",
    stage: 3,
    icon: "⚗️",
    keys: ["na", "k", "cl", "ca"],
    rationale: "高血壓用藥、腎功能異常時監控",
    color: "#64748b",
    suggestIf: (d) => parseFloat(d.egfr) < 60 || parseFloat(d.cr) > 1.3,
  },
  // ── Stage 4：特定系統（依主訴選擇）─────────────────────────
  {
    id: "thyroid",
    label: "甲狀腺功能",
    labelEn: "Thyroid Function",
    stage: 4,
    icon: "🦋",
    keys: ["tsh", "ft4"],
    rationale: "疲勞、體重變化、心悸、畏寒的鑑別",
    color: "#ec4899",
  },
  {
    id: "iron",
    label: "鐵質相關",
    labelEn: "Iron Studies",
    stage: 4,
    icon: "🔩",
    keys: ["serum_iron", "ferritin", "tibc"],
    rationale: "貧血原因鑑別：缺鐵 vs 慢性病貧血",
    color: "#b45309",
  },
  {
    id: "tumor",
    label: "腫瘤指標",
    labelEn: "Tumor Markers",
    stage: 4,
    icon: "🔬",
    keys: ["cea", "afp", "psa", "ca125", "ca199"],
    rationale: "台灣癌症篩檢：大腸癌(CEA)、肝癌(AFP)、胃癌(CA19-9)",
    color: "#f43f5e",
  },
];

// ── 主訴 → 建議套組映射 ─────────────────────────────────────

export interface ComplaintSuggestion {
  packages: string[];
  note: string;
  priority: string[];  // packages to do first
}

export const COMPLAINT_SUGGESTIONS: Record<string, ComplaintSuggestion> = {
  "頭暈/頭痛": {
    packages: ["vitals", "cbc", "glucose", "thyroid"],
    priority: ["vitals", "cbc"],
    note: "先排除高血壓、貧血；若正常再查甲狀腺",
  },
  "疲勞/倦怠": {
    packages: ["cbc", "thyroid", "glucose", "renal", "liver"],
    priority: ["cbc", "thyroid"],
    note: "台灣最常見原因：貧血、甲狀腺低下、慢性B肝",
  },
  "多尿/口渴": {
    packages: ["glucose", "renal", "electrolytes"],
    priority: ["glucose"],
    note: "首要排除糖尿病、尿崩症",
  },
  "關節腫痛": {
    packages: ["uric_acid", "cbc", "renal"],
    priority: ["uric_acid"],
    note: "台灣痛風盛行率高，尿酸為第一優先",
  },
  "胸悶/心悸": {
    packages: ["vitals", "cbc", "lipids", "thyroid"],
    priority: ["vitals", "cbc"],
    note: "排除貧血、心血管疾病、甲狀腺亢進",
  },
  "體重增加": {
    packages: ["glucose", "thyroid", "lipids"],
    priority: ["thyroid", "glucose"],
    note: "甲狀腺低下、胰島素阻抗為最常見原因",
  },
  "水腫": {
    packages: ["renal", "liver", "electrolytes", "cbc"],
    priority: ["renal", "liver"],
    note: "腎病症候群(低蛋白)、肝硬化、心衰竭鑑別",
  },
  "腹部不適": {
    packages: ["liver", "cbc", "tumor"],
    priority: ["liver"],
    note: "台灣B肝盛行，先排除肝炎；腫瘤指標輔助",
  },
  "皮膚黃疸": {
    packages: ["liver", "cbc", "renal"],
    priority: ["liver"],
    note: "肝細胞性 vs 阻塞性 vs 溶血性黃疸鑑別",
  },
  "定期健檢": {
    packages: ["vitals", "cbc", "glucose", "lipids", "uric_acid", "renal", "liver"],
    priority: ["vitals", "cbc", "glucose"],
    note: "台灣成人健檢建議套組（含台灣特異項目）",
  },
  "高血壓追蹤": {
    packages: ["vitals", "renal", "electrolytes", "lipids"],
    priority: ["vitals", "renal"],
    note: "高血壓靶器官損傷監控：腎臟、電解質",
  },
  "糖尿病追蹤": {
    packages: ["glucose", "renal", "lipids", "liver"],
    priority: ["glucose", "renal"],
    note: "DM 三期病變監控：腎病變、眼病變、神經病變",
  },
};

// ── 台灣疾病特異 ICD-10 規則 ─────────────────────────────────

export interface TaiwanDiseaseRule {
  id: string;
  name_zh: string;
  name_en: string;
  icd10: string;
  prevalence_note: string; // Taiwan-specific prevalence note
  criteria: (data: Record<string, string>, sex?: string) => boolean;
  evidence: (data: Record<string, string>, sex?: string) => string[];
  severity: "routine" | "urgent" | "critical";
}

export const TAIWAN_DISEASE_RULES: TaiwanDiseaseRule[] = [
  {
    id: "gout",
    name_zh: "痛風 / 高尿酸血症",
    name_en: "Gout / Hyperuricemia",
    icd10: "M10.00",
    prevalence_note: "台灣男性盛行率約 6%，亞洲最高之一",
    criteria: (d, sex) =>
      (sex === "F" ? parseFloat(d.uric_acid) > 6.0 : parseFloat(d.uric_acid) > 7.0),
    evidence: (d) => [`尿酸 ${d.uric_acid} mg/dL（男 >7.0 / 女 >6.0 為高尿酸）`],
    severity: "routine",
  },
  {
    id: "metabolic_syndrome",
    name_zh: "代謝症候群",
    name_en: "Metabolic Syndrome",
    icd10: "E88.81",
    prevalence_note: "台灣成人盛行率約 25-30%",
    criteria: (d) => {
      let score = 0;
      if (parseFloat(d.waist) > 90 || parseFloat(d.waist) > 80) score++;  // 腰圍：男>90, 女>80
      if (parseFloat(d.tg) >= 150) score++;
      if (parseFloat(d.hdl) < 40) score++;  // 簡化：低HDL
      if (parseFloat(d.sbp) >= 130 || parseFloat(d.dbp) >= 85) score++;
      if (parseFloat(d.fbs) >= 100) score++;
      return score >= 3;
    },
    evidence: (d) => {
      const findings: string[] = [];
      if (parseFloat(d.waist) > 90) findings.push(`腰圍 ${d.waist} cm`);
      if (parseFloat(d.tg) >= 150) findings.push(`三酸甘油脂 ${d.tg} mg/dL`);
      if (parseFloat(d.hdl) < 40) findings.push(`HDL ${d.hdl} mg/dL 偏低`);
      if (parseFloat(d.sbp) >= 130) findings.push(`收縮壓 ${d.sbp} mmHg`);
      if (parseFloat(d.fbs) >= 100) findings.push(`空腹血糖 ${d.fbs} mg/dL`);
      return findings;
    },
    severity: "routine",
  },
  {
    id: "ckd_staging",
    name_zh: "慢性腎臟病分期",
    name_en: "Chronic Kidney Disease",
    icd10: "N18",
    prevalence_note: "台灣盛行率 12%，洗腎率世界第一",
    criteria: (d) => parseFloat(d.egfr) > 0 && parseFloat(d.egfr) < 60,
    evidence: (d) => {
      const egfr = parseFloat(d.egfr);
      if (egfr >= 45) return [`eGFR ${d.egfr} mL/min → CKD G3a（輕至中度）`];
      if (egfr >= 30) return [`eGFR ${d.egfr} mL/min → CKD G3b（中至重度）`];
      if (egfr >= 15) return [`⚠ eGFR ${d.egfr} mL/min → CKD G4（重度），應轉介腎臟科`];
      return [`🚨 eGFR ${d.egfr} mL/min → CKD G5（腎衰竭），需透析評估`];
    },
    severity: "routine",
  },
  {
    id: "nafld",
    name_zh: "非酒精性脂肪肝病 NAFLD",
    name_en: "Non-Alcoholic Fatty Liver Disease",
    icd10: "K76.0",
    prevalence_note: "台灣成人盛行率約 11-41%，隨肥胖率上升",
    criteria: (d) =>
      parseFloat(d.alt) > 40 &&
      parseFloat(d.bmi) > 23 &&
      parseFloat(d.tg) > 150,
    evidence: (d) => [
      `ALT ${d.alt} U/L 升高`,
      `BMI ${d.bmi} kg/m²（亞洲肥胖標準 >23）`,
      `三酸甘油脂 ${d.tg} mg/dL`,
    ],
    severity: "routine",
  },
  {
    id: "pre_diabetes",
    name_zh: "糖尿病前期",
    name_en: "Pre-Diabetes",
    icd10: "R73.09",
    prevalence_note: "台灣糖尿病前期約占成人 25%",
    criteria: (d) =>
      (parseFloat(d.fbs) >= 100 && parseFloat(d.fbs) < 126) ||
      (parseFloat(d.hba1c) >= 5.7 && parseFloat(d.hba1c) < 6.5),
    evidence: (d) => {
      const e: string[] = [];
      if (parseFloat(d.fbs) >= 100 && parseFloat(d.fbs) < 126)
        e.push(`空腹血糖 ${d.fbs} mg/dL（正常 <100，糖尿病 ≥126）`);
      if (parseFloat(d.hba1c) >= 5.7 && parseFloat(d.hba1c) < 6.5)
        e.push(`HbA1c ${d.hba1c}%（糖尿病前期 5.7-6.4%）`);
      return e;
    },
    severity: "routine",
  },
  {
    id: "iron_deficiency_anemia",
    name_zh: "缺鐵性貧血",
    name_en: "Iron Deficiency Anemia",
    icd10: "D50.9",
    prevalence_note: "台灣育齡女性盛行率約 15-20%",
    criteria: (d, sex) =>
      (sex === "F"
        ? parseFloat(d.hgb) < 12 || parseFloat(d.hgb) < 12.0
        : parseFloat(d.hgb) < 13) &&
      parseFloat(d.mcv) < 80,
    evidence: (d, sex) => {
      const hb_low = sex === "F" ? 12 : 13;
      return [
        `血紅素 ${d.hgb} g/dL（女性 <${hb_low} 為貧血）`,
        `MCV ${d.mcv} fL（<80 為小球性貧血，符合缺鐵型態）`,
      ];
    },
    severity: "routine",
  },
  {
    id: "dyslipidemia_mixed",
    name_zh: "混合性高脂血症",
    name_en: "Mixed Hyperlipidemia",
    icd10: "E78.49",
    prevalence_note: "台灣成人血脂異常盛行率約 30-40%",
    criteria: (d) =>
      parseFloat(d.tcho) > 200 &&
      parseFloat(d.tg) > 150 &&
      parseFloat(d.ldl) > 130,
    evidence: (d) => [
      `總膽固醇 ${d.tcho} mg/dL`,
      `三酸甘油脂 ${d.tg} mg/dL`,
      `LDL ${d.ldl} mg/dL`,
    ],
    severity: "routine",
  },
  {
    id: "hypertensive_crisis",
    name_zh: "高血壓危機",
    name_en: "Hypertensive Crisis",
    icd10: "I16.9",
    prevalence_note: "收縮壓 ≥180 或舒張壓 ≥120 需立即處置",
    criteria: (d) =>
      parseFloat(d.sbp) >= 180 || parseFloat(d.dbp) >= 120,
    evidence: (d) => [
      `血壓 ${d.sbp}/${d.dbp} mmHg`,
      `需排除高血壓急症（有靶器官損傷）vs 緊急症`,
    ],
    severity: "critical",
  },
];

// ── 輔助函數 ──────────────────────────────────────────────────

/** 根據目前輸入的資料，自動建議下一批應加入的套組 */
export function suggestNextPackages(
  currentData: Record<string, string>,
  addedPackageIds: string[]
): ExamPackage[] {
  return EXAM_PACKAGES.filter(
    (pkg) =>
      !addedPackageIds.includes(pkg.id) &&
      pkg.suggestIf?.(currentData) === true
  );
}

/** 依主訴取得建議的套組清單 */
export function getComplaintPackages(complaint: string): ExamPackage[] {
  const match = Object.entries(COMPLAINT_SUGGESTIONS).find(
    ([key]) => complaint.includes(key.split("/")[0])
  );
  if (!match) return EXAM_PACKAGES.filter((p) => p.stage === 1);
  const ids = match[1].packages;
  return EXAM_PACKAGES.filter((p) => ids.includes(p.id));
}

/** 執行台灣疾病規則並回傳命中的疾病 */
export function runTaiwanRules(
  data: Record<string, string>,
  sex?: string
): Array<{ rule: TaiwanDiseaseRule; evidence: string[] }> {
  return TAIWAN_DISEASE_RULES
    .filter((rule) => {
      try { return rule.criteria(data, sex); }
      catch { return false; }
    })
    .map((rule) => ({
      rule,
      evidence: rule.evidence(data, sex),
    }));
}

/** CKD 分期 */
export function getCKDStage(egfr: number): { stage: string; icd10: string; color: string } {
  if (egfr >= 90) return { stage: "G1（正常或高）", icd10: "N18.1", color: "#22c55e" };
  if (egfr >= 60) return { stage: "G2（輕度降低）", icd10: "N18.2", color: "#84cc16" };
  if (egfr >= 45) return { stage: "G3a（輕中度降低）", icd10: "N18.31", color: "#eab308" };
  if (egfr >= 30) return { stage: "G3b（中重度降低）", icd10: "N18.32", color: "#f97316" };
  if (egfr >= 15) return { stage: "G4（重度降低）", icd10: "N18.4", color: "#ef4444" };
  return { stage: "G5（腎衰竭）", icd10: "N18.5", color: "#7f1d1d" };
}
