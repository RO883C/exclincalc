// Clinical analysis layer for pro version
// Returns full medical terminology, ICD-10 candidates, differential diagnosis
// Extends localAnalysis.ts with clinical-grade output

import { REFERENCE_RANGES, CATEGORIES, checkAbnormal, getNormalRange } from "@/lib/referenceRanges";
import type { AnalysisItem } from "@/lib/localAnalysis";

export interface ICD10Candidate {
  code: string;
  description_zh: string;
  description_en: string;
  confidence: "high" | "moderate" | "low";
}

export interface DifferentialItem {
  diagnosis_zh: string;
  diagnosis_en: string;
  icd10: string;
  probability: "high" | "moderate" | "low";
  supporting: string[];    // supporting findings
  against: string[];       // findings against this diagnosis
}

export interface ClinicalAnalysisResult {
  items: AnalysisItem[];
  abnormalCount: number;
  highCount: number;
  lowCount: number;
  normalCount: number;
  bmi?: number;
  icd10Candidates: ICD10Candidate[];
  differentials: DifferentialItem[];
  criticalFlags: string[];   // critical values needing immediate attention
  clinicalNotes: string[];   // clinical interpretation notes
}

// ICD-10 mapping for abnormal values
const ICD10_MAP: Record<string, { high?: ICD10Candidate[]; low?: ICD10Candidate[] }> = {
  glucose: {
    high: [
      { code: "R73.09", description_zh: "高血糖症", description_en: "Hyperglycemia, unspecified", confidence: "high" },
      { code: "E11", description_zh: "第2型糖尿病", description_en: "Type 2 diabetes mellitus", confidence: "moderate" },
      { code: "E11.9", description_zh: "第2型糖尿病，無並發症", description_en: "Type 2 DM without complications", confidence: "moderate" },
    ],
    low: [
      { code: "E16.0", description_zh: "藥物引起低血糖", description_en: "Drug-induced hypoglycemia", confidence: "moderate" },
      { code: "E16.2", description_zh: "低血糖症", description_en: "Hypoglycemia, unspecified", confidence: "high" },
    ],
  },
  hba1c: {
    high: [
      { code: "E11", description_zh: "第2型糖尿病", description_en: "Type 2 diabetes mellitus", confidence: "high" },
      { code: "R73.01", description_zh: "糖尿病前期", description_en: "Impaired fasting glucose", confidence: "moderate" },
    ],
  },
  systolic: {
    high: [
      { code: "I10", description_zh: "原發性高血壓", description_en: "Essential hypertension", confidence: "high" },
      { code: "I11.9", description_zh: "高血壓性心臟病", description_en: "Hypertensive heart disease", confidence: "low" },
    ],
  },
  ldl: {
    high: [
      { code: "E78.00", description_zh: "純高膽固醇血症", description_en: "Pure hypercholesterolemia", confidence: "high" },
      { code: "E78.5", description_zh: "高脂血症", description_en: "Hyperlipidemia, unspecified", confidence: "moderate" },
    ],
  },
  triglyceride: {
    high: [
      { code: "E78.1", description_zh: "純高三酸甘油脂血症", description_en: "Pure hypertriglyceridemia", confidence: "high" },
      { code: "E78.5", description_zh: "高脂血症", description_en: "Hyperlipidemia, unspecified", confidence: "moderate" },
    ],
  },
  alt: {
    high: [
      { code: "K76.0", description_zh: "脂肪肝", description_en: "Fatty (change of) liver", confidence: "moderate" },
      { code: "K72.90", description_zh: "肝衰竭", description_en: "Hepatic failure, unspecified", confidence: "low" },
      { code: "R74.01", description_zh: "肝功能異常", description_en: "Elevation of liver transaminase levels", confidence: "high" },
    ],
  },
  ast: {
    high: [
      { code: "R74.01", description_zh: "轉氨酶升高", description_en: "Elevation of liver transaminase levels", confidence: "high" },
    ],
  },
  creatinine: {
    high: [
      { code: "N18.9", description_zh: "慢性腎臟病", description_en: "Chronic kidney disease, unspecified", confidence: "moderate" },
      { code: "N17.9", description_zh: "急性腎衰竭", description_en: "Acute kidney failure, unspecified", confidence: "low" },
      { code: "R79.89", description_zh: "血清肌酸酐升高", description_en: "Other abnormal blood chemistry", confidence: "high" },
    ],
  },
  egfr: {
    low: [
      { code: "N18.3", description_zh: "慢性腎臟病第3期", description_en: "Chronic kidney disease, stage 3", confidence: "high" },
      { code: "N18.4", description_zh: "慢性腎臟病第4期", description_en: "Chronic kidney disease, stage 4", confidence: "moderate" },
    ],
  },
  hemoglobin: {
    low: [
      { code: "D64.9", description_zh: "貧血", description_en: "Anemia, unspecified", confidence: "high" },
      { code: "D50.9", description_zh: "缺鐵性貧血", description_en: "Iron deficiency anemia, unspecified", confidence: "moderate" },
    ],
  },
  wbc: {
    high: [
      { code: "D72.829", description_zh: "白血球增多症", description_en: "Leukocytosis, unspecified", confidence: "high" },
    ],
    low: [
      { code: "D70.9", description_zh: "嗜中性球減少症", description_en: "Neutropenia, unspecified", confidence: "moderate" },
      { code: "D72.819", description_zh: "白血球減少症", description_en: "Leukocytopenia, unspecified", confidence: "high" },
    ],
  },
  platelet: {
    low: [
      { code: "D69.6", description_zh: "血小板減少症", description_en: "Thrombocytopenia, unspecified", confidence: "high" },
    ],
    high: [
      { code: "D75.1", description_zh: "繼發性紅細胞增多症", description_en: "Secondary polycythemia", confidence: "low" },
      { code: "D47.3", description_zh: "原發性血小板增多症", description_en: "Essential thrombocythemia", confidence: "low" },
    ],
  },
  tsh: {
    high: [
      { code: "E03.9", description_zh: "甲狀腺功能低下", description_en: "Hypothyroidism, unspecified", confidence: "high" },
    ],
    low: [
      { code: "E05.90", description_zh: "甲狀腺毒症", description_en: "Thyrotoxicosis, unspecified", confidence: "high" },
    ],
  },
  bmi: {
    high: [
      { code: "E66.9", description_zh: "肥胖症", description_en: "Obesity, unspecified", confidence: "high" },
      { code: "Z68.3", description_zh: "過重", description_en: "Body mass index 27-29", confidence: "moderate" },
    ],
  },
  uric_acid: {
    high: [
      { code: "E79.0", description_zh: "高尿酸血症", description_en: "Hyperuricemia without gout", confidence: "high" },
      { code: "M10.9", description_zh: "痛風", description_en: "Gout, unspecified", confidence: "low" },
    ],
  },
};

// Clinical interpretation notes (more detailed than lay language)
const CLINICAL_NOTES_MAP: Record<string, (value: number, status: string, gender?: "M" | "F") => string | null> = {
  glucose: (v, s) => {
    if (s === "high") {
      if (v >= 200) return `Fasting glucose ${v} mg/dL — meets ADA diagnostic criteria for diabetes (≥200 mg/dL with symptoms, or ≥126 mg/dL on two separate occasions). Recommend HbA1c confirmation and OGTT if not already performed.`;
      if (v >= 126) return `Fasting glucose ${v} mg/dL — meets ADA 2024 diagnostic threshold for diabetes (≥126 mg/dL). Requires repeat confirmation. Evaluate for microvascular complications.`;
      if (v >= 100) return `Fasting glucose ${v} mg/dL — impaired fasting glucose (IFG, 100-125 mg/dL). Annual monitoring and lifestyle modification recommended.`;
    }
    return null;
  },
  hba1c: (v, s) => {
    if (s === "high") {
      if (v >= 6.5) return `HbA1c ${v}% — meets ADA diagnostic criteria for diabetes mellitus (≥6.5%). Evaluate glycemic control and screen for complications (retinopathy, nephropathy, neuropathy).`;
      if (v >= 5.7) return `HbA1c ${v}% — prediabetes range (5.7-6.4%). High risk of progression; intensive lifestyle intervention reduces risk by 58% (DPP trial).`;
    }
    return null;
  },
  systolic: (v, s) => {
    if (s === "high") {
      if (v >= 180) return `Systolic ${v} mmHg — hypertensive urgency/emergency range. Immediate evaluation for end-organ damage (CNS, cardiac, renal). Consider immediate antihypertensive therapy.`;
      if (v >= 140) return `Systolic ${v} mmHg — Stage 2 hypertension (ACC/AHA 2017). Initiate pharmacologic therapy alongside lifestyle modification. 10-year ASCVD risk assessment recommended.`;
      if (v >= 130) return `Systolic ${v} mmHg — Stage 1 hypertension (ACC/AHA 2017). ASCVD risk stratification determines pharmacologic intervention threshold.`;
    }
    return null;
  },
  egfr: (v, s) => {
    if (s === "low") {
      if (v < 15) return `eGFR ${v} mL/min/1.73m² — CKD Stage 5 (kidney failure). Nephrology referral for dialysis planning.`;
      if (v < 30) return `eGFR ${v} mL/min/1.73m² — CKD Stage 4 (severely decreased). Nephrology co-management, avoid nephrotoxic agents, dose-adjust renally-cleared medications.`;
      if (v < 60) return `eGFR ${v} mL/min/1.73m² — CKD Stage 3. Monitor CMP every 3-6 months, screen for anemia, metabolic acidosis, secondary hyperparathyroidism.`;
    }
    return null;
  },
  alt: (v, s) => {
    if (s === "high") {
      if (v > 200) return `ALT ${v} U/L — markedly elevated (>5× ULN). Acute hepatocellular injury pattern. Urgent evaluation for viral hepatitis, ischemic hepatitis, drug-induced liver injury.`;
      if (v > 80) return `ALT ${v} U/L — moderately elevated (2-5× ULN). Differential: NAFLD/NASH, viral hepatitis, alcohol, drug-induced. AST:ALT ratio may help differentiate etiology.`;
    }
    return null;
  },
};

export function analyzeClinically(
  data: Record<string, number | string>,
  gender?: "M" | "F",
  age?: number,
): ClinicalAnalysisResult {
  // Auto-calculate BMI
  const height = Number(data.height);
  const weight = Number(data.weight);
  let bmi: number | undefined;
  if (height > 0 && weight > 0) {
    bmi = parseFloat((weight / ((height / 100) ** 2)).toFixed(1));
    if (!data.bmi) data = { ...data, bmi };
  }

  const items: AnalysisItem[] = [];

  for (const ref of REFERENCE_RANGES) {
    const raw = data[ref.key];
    if (raw === undefined || raw === "" || raw === null) continue;
    const value = Number(raw);
    if (isNaN(value)) continue;

    const status = checkAbnormal(ref, value, gender);
    const normalRange = getNormalRange(ref, gender);
    const cat = CATEGORIES[ref.category];

    items.push({
      key: ref.key,
      label_zh: ref.label_zh,
      label_en: ref.label_en,
      value,
      unit: ref.unit,
      status,
      normalRange,
      explanation_zh: ref.explanation_zh,
      category: ref.category,
      categoryLabel: cat?.label_zh ?? ref.category,
    });
  }

  items.sort((a, b) => {
    const order = { high: 0, low: 1, normal: 2, unknown: 3 };
    return order[a.status] - order[b.status];
  });

  const abnormalCount = items.filter(i => i.status !== "normal" && i.status !== "unknown").length;
  const highCount = items.filter(i => i.status === "high").length;
  const lowCount = items.filter(i => i.status === "low").length;
  const normalCount = items.filter(i => i.status === "normal").length;

  // Collect ICD-10 candidates
  const icd10Set = new Map<string, ICD10Candidate>();
  for (const item of items) {
    if (item.status === "normal" || item.status === "unknown") continue;
    const mapping = ICD10_MAP[item.key];
    if (!mapping) continue;
    const candidates = item.status === "high" ? mapping.high : mapping.low;
    if (!candidates) continue;
    for (const c of candidates) {
      if (!icd10Set.has(c.code) || c.confidence === "high") {
        icd10Set.set(c.code, c);
      }
    }
  }
  const icd10Candidates = Array.from(icd10Set.values())
    .sort((a, b) => {
      const order = { high: 0, moderate: 1, low: 2 };
      return order[a.confidence] - order[b.confidence];
    });

  // Build differentials
  const differentials = buildDifferentials(items, gender, age);

  // Critical flags (warning thresholds)
  const criticalFlags: string[] = [];
  const find = (key: string) => items.find(i => i.key === key);

  const spo2 = find("spo2");
  if (spo2 && spo2.value < 90) criticalFlags.push(`CRITICAL: SpO2 ${spo2.value}% — hypoxemia, immediate respiratory assessment required`);

  const hr = find("pulse");
  if (hr && hr.value > 150) criticalFlags.push(`CRITICAL: HR ${hr.value} bpm — tachycardia, evaluate for arrhythmia, sepsis, PE`);
  if (hr && hr.value < 40) criticalFlags.push(`CRITICAL: HR ${hr.value} bpm — bradycardia, evaluate for heart block, medication toxicity`);

  const sys = find("systolic");
  if (sys && sys.value >= 180) criticalFlags.push(`CRITICAL: BP ${sys.value} mmHg — hypertensive urgency/emergency, immediate evaluation required`);
  if (sys && sys.value < 90) criticalFlags.push(`CRITICAL: BP ${sys.value} mmHg — hypotension, evaluate for shock`);

  const gluc = find("glucose");
  if (gluc && gluc.value >= 500) criticalFlags.push(`CRITICAL: Glucose ${gluc.value} mg/dL — possible HHS/DKA, urgent evaluation`);
  if (gluc && gluc.value < 50) criticalFlags.push(`CRITICAL: Glucose ${gluc.value} mg/dL — severe hypoglycemia, immediate glucose administration`);

  const plt = find("platelet");
  if (plt && plt.value < 50) criticalFlags.push(`CRITICAL: PLT ${plt.value}K/uL — severe thrombocytopenia, bleeding risk high`);

  const temp = find("temperature");
  if (temp && temp.value >= 39.5) criticalFlags.push(`WARNING: Temperature ${temp.value}°C — high fever, evaluate for systemic infection`);
  if (temp && temp.value < 35) criticalFlags.push(`CRITICAL: Temperature ${temp.value}°C — hypothermia`);

  // Clinical notes
  const clinicalNotes: string[] = [];
  for (const item of items) {
    if (item.status === "normal" || item.status === "unknown") continue;
    const notesFn = CLINICAL_NOTES_MAP[item.key];
    if (notesFn) {
      const note = notesFn(item.value, item.status, gender);
      if (note) clinicalNotes.push(note);
    }
  }

  return {
    items,
    abnormalCount,
    highCount,
    lowCount,
    normalCount,
    bmi,
    icd10Candidates,
    differentials,
    criticalFlags,
    clinicalNotes,
  };
}

function buildDifferentials(
  items: AnalysisItem[],
  gender?: "M" | "F",
  _age?: number,
): DifferentialItem[] {
  const differentials: DifferentialItem[] = [];
  const find = (key: string) => items.find(i => i.key === key);
  const isHigh = (key: string) => find(key)?.status === "high";
  const isLow = (key: string) => find(key)?.status === "low";

  // Metabolic syndrome
  const metSyndromeScore = [
    isHigh("glucose"), isHigh("triglyceride"), isHigh("systolic"),
    isHigh("bmi"), isHigh("waist"),
  ].filter(Boolean).length;
  if (metSyndromeScore >= 2) {
    differentials.push({
      diagnosis_zh: "代謝症候群",
      diagnosis_en: "Metabolic Syndrome",
      icd10: "E88.81",
      probability: metSyndromeScore >= 3 ? "high" : "moderate",
      supporting: [
        isHigh("glucose") ? "Elevated fasting glucose" : "",
        isHigh("triglyceride") ? "Hypertriglyceridemia" : "",
        isHigh("systolic") ? "Hypertension" : "",
        isHigh("bmi") ? "Elevated BMI" : "",
        isHigh("waist") ? "Increased waist circumference" : "",
      ].filter(Boolean),
      against: [],
    });
  }

  // Type 2 DM
  const glucoseItem = find("glucose");
  const hba1cItem = find("hba1c");
  if (
    (glucoseItem && glucoseItem.value >= 126) ||
    (hba1cItem && hba1cItem.value >= 6.5)
  ) {
    differentials.push({
      diagnosis_zh: "第2型糖尿病",
      diagnosis_en: "Type 2 Diabetes Mellitus",
      icd10: "E11.9",
      probability: "high",
      supporting: [
        glucoseItem && glucoseItem.value >= 126 ? `FG ${glucoseItem.value} mg/dL (≥126)` : "",
        hba1cItem && hba1cItem.value >= 6.5 ? `HbA1c ${hba1cItem.value}% (≥6.5%)` : "",
      ].filter(Boolean),
      against: [],
    });
  }

  // Dyslipidemia
  if (isHigh("ldl") || isHigh("total_cholesterol") || isHigh("triglyceride")) {
    differentials.push({
      diagnosis_zh: "血脂異常",
      diagnosis_en: "Dyslipidemia",
      icd10: "E78.5",
      probability: "high",
      supporting: [
        isHigh("ldl") ? `Elevated LDL-C ${find("ldl")?.value} mg/dL` : "",
        isHigh("total_cholesterol") ? `Elevated TC ${find("total_cholesterol")?.value} mg/dL` : "",
        isHigh("triglyceride") ? `Elevated TG ${find("triglyceride")?.value} mg/dL` : "",
      ].filter(Boolean),
      against: [],
    });
  }

  // Hypertension
  if (isHigh("systolic") || isHigh("diastolic")) {
    const sysVal = find("systolic")?.value ?? 0;
    differentials.push({
      diagnosis_zh: "高血壓",
      diagnosis_en: "Arterial Hypertension",
      icd10: "I10",
      probability: sysVal >= 140 ? "high" : "moderate",
      supporting: [
        isHigh("systolic") ? `SBP ${find("systolic")?.value} mmHg` : "",
        isHigh("diastolic") ? `DBP ${find("diastolic")?.value} mmHg` : "",
      ].filter(Boolean),
      against: [],
    });
  }

  // Anemia
  if (isLow("hemoglobin") || isLow("hematocrit")) {
    differentials.push({
      diagnosis_zh: "貧血",
      diagnosis_en: "Anemia",
      icd10: "D64.9",
      probability: "high",
      supporting: [
        isLow("hemoglobin") ? `Hb ${find("hemoglobin")?.value} g/dL (low)` : "",
        isLow("hematocrit") ? `Hct ${find("hematocrit")?.value}% (low)` : "",
      ].filter(Boolean),
      against: [],
    });
  }

  // CKD
  if (isHigh("creatinine") || isLow("egfr")) {
    differentials.push({
      diagnosis_zh: "慢性腎臟病",
      diagnosis_en: "Chronic Kidney Disease",
      icd10: "N18.9",
      probability: isLow("egfr") ? "high" : "moderate",
      supporting: [
        isHigh("creatinine") ? `Cr ${find("creatinine")?.value} mg/dL (elevated)` : "",
        isLow("egfr") ? `eGFR ${find("egfr")?.value} mL/min/1.73m² (<60)` : "",
      ].filter(Boolean),
      against: [],
    });
  }

  // Hypothyroidism
  if (isHigh("tsh")) {
    differentials.push({
      diagnosis_zh: "甲狀腺功能低下",
      diagnosis_en: "Hypothyroidism",
      icd10: "E03.9",
      probability: "high",
      supporting: [`TSH ${find("tsh")?.value} μIU/mL (elevated)`],
      against: [],
    });
  }

  // Hyperthyroidism
  if (isLow("tsh")) {
    differentials.push({
      diagnosis_zh: "甲狀腺功能亢進",
      diagnosis_en: "Hyperthyroidism",
      icd10: "E05.90",
      probability: "moderate",
      supporting: [`TSH ${find("tsh")?.value} μIU/mL (suppressed)`],
      against: [],
    });
  }

  return differentials.sort((a, b) => {
    const order = { high: 0, moderate: 1, low: 2 };
    return order[a.probability] - order[b.probability];
  });
}
