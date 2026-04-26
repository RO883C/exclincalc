// Drug interaction checker
// Builds pairwise interaction list from medications.interactions[] field in Supabase
// Also includes a static known-critical interactions table

export interface InteractionResult {
  drugA: string;
  drugB: string;
  severity: "contraindicated" | "major" | "moderate" | "minor" | "none";
  description: string;
}

// Severity order for sorting
export const SEVERITY_ORDER: Record<InteractionResult["severity"], number> = {
  contraindicated: 0,
  major: 1,
  moderate: 2,
  minor: 3,
  none: 4,
};

export const SEVERITY_LABEL: Record<InteractionResult["severity"], { zh: string; color: string; bg: string }> = {
  contraindicated: { zh: "禁忌", color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
  major:           { zh: "重大", color: "#f97316", bg: "rgba(249,115,22,0.15)" },
  moderate:        { zh: "中度", color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
  minor:           { zh: "輕微", color: "#94a3b8", bg: "rgba(148,163,184,0.1)" },
  none:            { zh: "無",   color: "#10b981", bg: "rgba(16,185,129,0.1)" },
};

// Static critical interaction pairs (drug name substring matching, case-insensitive)
const STATIC_CRITICAL: Array<{
  a: string; b: string;
  severity: InteractionResult["severity"];
  description: string;
}> = [
  {
    a: "warfarin", b: "aspirin",
    severity: "major",
    description: "兩者併用會顯著增加出血風險（包括胃腸道出血、皮下瘀青、顱內出血）。臨床建議：密切監測 INR，避免合併使用；若必須合併，建議低劑量 Aspirin 並加 PPI 保護胃黏膜。",
  },
  {
    a: "warfarin", b: "ibuprofen",
    severity: "major",
    description: "NSAIDs 會置換 Warfarin 的蛋白結合並抑制血小板功能，雙重提升出血風險。臨床建議：改用 Acetaminophen 止痛，避免 NSAIDs；如需短期使用，需密切觀察出血徵象。",
  },
  {
    a: "metformin", b: "contrast",
    severity: "major",
    description: "碘造影劑可能造成急性腎傷害（AKI），進而提高 Metformin 引起的乳酸中毒風險。臨床建議：造影前 48 小時停 Metformin，造影後待腎功能恢復再恢復用藥。",
  },
  {
    a: "simvastatin", b: "amiodarone",
    severity: "major",
    description: "Amiodarone 抑制 CYP3A4，使 Simvastatin 血中濃度顯著上升，增加肌病變與橫紋肌溶解風險。臨床建議：Simvastatin 劑量不超過 20 mg/day，或改用 Pravastatin、Rosuvastatin。",
  },
  {
    a: "sildenafil", b: "硝酸",
    severity: "contraindicated",
    description: "PDE-5 抑制劑與硝酸鹽類併用會造成嚴重低血壓（血壓驟降至休克程度）。臨床建議：絕對禁用，最少間隔 24 小時；急性胸痛病患使用 Sildenafil 後勿給硝酸鹽。",
  },
  {
    a: "sildenafil", b: "nitrate",
    severity: "contraindicated",
    description: "PDE-5 抑制劑與硝酸鹽類併用會造成嚴重低血壓（血壓驟降至休克程度）。臨床建議：絕對禁用，最少間隔 24 小時；急性胸痛病患使用 Sildenafil 後勿給硝酸鹽。",
  },
  {
    a: "clopidogrel", b: "omeprazole",
    severity: "moderate",
    description: "Omeprazole 抑制 CYP2C19，降低 Clopidogrel 活化，使抗血小板效果下降，可能增加心血管事件風險。臨床建議：改用 Pantoprazole 或 H2 blocker 替代。",
  },
  {
    a: "ssri", b: "tramadol",
    severity: "major",
    description: "兩者皆增加血清素濃度，併用有血清素症候群風險（症狀：躁動、肌陣攣、出汗、體溫升高、意識改變）。臨床建議：避免合併使用；若必須使用，密切監測症狀並備好支持治療。",
  },
  {
    a: "fluoroquinolone", b: "antacid",
    severity: "moderate",
    description: "制酸劑中的二價陽離子（Mg²⁺、Al³⁺、Ca²⁺）會與氟喹諾酮類螯合，降低吸收率達 50%。臨床建議：兩藥服用時間至少間隔 2 小時。",
  },
  {
    a: "amlodipine", b: "simvastatin",
    severity: "moderate",
    description: "Amlodipine 抑制 CYP3A4，使 Simvastatin 暴露量增加，提高肌病變風險。臨床建議：合併使用時 Simvastatin 不超過 20 mg/day。",
  },
  {
    a: "digoxin", b: "amiodarone",
    severity: "major",
    description: "Amiodarone 抑制 P-glycoprotein 並降低 Digoxin 的腎清除率，可能造成 Digoxin 中毒（症狀：噁心、視力異常、心律不整）。臨床建議：Digoxin 減半量，每週監測血中濃度。",
  },
  {
    a: "methotrexate", b: "nsaid",
    severity: "major",
    description: "NSAIDs 降低 Methotrexate 的腎清除率，導致 Methotrexate 毒性（全血球減少、口腔潰瘍、肝毒性）。臨床建議：避免合併；如必須使用，密切監測 CBC 與肝腎功能。",
  },
];

/**
 * Check interactions between a list of drug names.
 * Uses static critical interaction table + matches against the `interactions` array
 * fetched from the medications table (passed as `medsWithInteractions`).
 */
export function checkInteractions(
  drugNames: string[],
  medsWithInteractions?: Array<{ name_zh: string; name_en: string; generic_name: string | null; interactions: string[] | null }>,
): InteractionResult[] {
  const results: InteractionResult[] = [];
  const seen = new Set<string>();

  // 為每個藥建立「可搜字串」 = name_zh + name_en + generic_name（若有 medsDB 即用其全部別名）
  const aliasFor = (drugName: string): string => {
    const med = medsWithInteractions?.find(m =>
      m.name_zh === drugName ||
      m.name_en.toLowerCase() === drugName.toLowerCase() ||
      m.generic_name?.toLowerCase() === drugName.toLowerCase()
    );
    if (med) {
      return [med.name_zh, med.name_en, med.generic_name].filter(Boolean).join(" ").toLowerCase();
    }
    return drugName.toLowerCase();
  };

  for (let i = 0; i < drugNames.length; i++) {
    for (let j = i + 1; j < drugNames.length; j++) {
      const aliasA = aliasFor(drugNames[i]);
      const aliasB = aliasFor(drugNames[j]);
      const pairKey = [drugNames[i], drugNames[j]].sort().join("||");
      if (seen.has(pairKey)) continue;
      seen.add(pairKey);

      // Static table：檢查 alias（含中英文與 generic name）是否包含 pair key
      for (const pair of STATIC_CRITICAL) {
        const matchA = aliasA.includes(pair.a);
        const matchB = aliasB.includes(pair.b);
        const matchAB = aliasA.includes(pair.b);
        const matchBA = aliasB.includes(pair.a);
        if ((matchA && matchB) || (matchAB && matchBA)) {
          results.push({
            drugA: drugNames[i],
            drugB: drugNames[j],
            severity: pair.severity,
            description: pair.description,
          });
        }
      }

      // medications DB interactions field：用 target 的全部別名比對
      if (medsWithInteractions) {
        const medA = medsWithInteractions.find(m =>
          m.name_zh === drugNames[i] ||
          m.name_en.toLowerCase() === drugNames[i].toLowerCase() ||
          m.generic_name?.toLowerCase() === drugNames[i].toLowerCase()
        );
        const medB = medsWithInteractions.find(m =>
          m.name_zh === drugNames[j] ||
          m.name_en.toLowerCase() === drugNames[j].toLowerCase() ||
          m.generic_name?.toLowerCase() === drugNames[j].toLowerCase()
        );

        // 檢查 med 的 interactions 陣列是否含 target 的任一別名
        const checkInList = (med: typeof medA, targetMed: typeof medB, targetName: string): boolean => {
          if (!med?.interactions) return false;
          const targetAliases = targetMed
            ? [targetMed.name_zh, targetMed.name_en, targetMed.generic_name].filter(Boolean) as string[]
            : [targetName];
          return med.interactions.some(interaction => {
            const lowered = interaction.toLowerCase();
            return targetAliases.some(alias => lowered.includes(alias.toLowerCase()));
          });
        };

        if (medA && checkInList(medA, medB, drugNames[j])) {
          if (!results.find(r => r.drugA === drugNames[i] && r.drugB === drugNames[j])) {
            results.push({
              drugA: drugNames[i], drugB: drugNames[j],
              severity: "moderate",
              description: `Interaction noted in ${drugNames[i]} prescribing information. Review medication profiles for clinical significance.`,
            });
          }
        } else if (medB && checkInList(medB, medA, drugNames[i])) {
          if (!results.find(r => r.drugA === drugNames[i] && r.drugB === drugNames[j])) {
            results.push({
              drugA: drugNames[i], drugB: drugNames[j],
              severity: "moderate",
              description: `Interaction noted in ${drugNames[j]} prescribing information. Review medication profiles for clinical significance.`,
            });
          }
        }
      }
    }
  }

  return results.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

export function getWorstSeverity(results: InteractionResult[]): InteractionResult["severity"] {
  if (results.length === 0) return "none";
  return results.reduce((worst, r) =>
    SEVERITY_ORDER[r.severity] < SEVERITY_ORDER[worst] ? r.severity : worst,
    "none" as InteractionResult["severity"]
  );
}
