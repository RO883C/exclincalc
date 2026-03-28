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
    description: "Concurrent use significantly increases bleeding risk. Monitor INR closely and watch for signs of hemorrhage.",
  },
  {
    a: "warfarin", b: "ibuprofen",
    severity: "major",
    description: "NSAIDs displace warfarin from protein binding and inhibit platelet function, increasing hemorrhagic risk.",
  },
  {
    a: "metformin", b: "contrast",
    severity: "major",
    description: "Iodinated contrast media can cause acute kidney injury, increasing risk of metformin-associated lactic acidosis. Hold metformin 48h before and after contrast.",
  },
  {
    a: "simvastatin", b: "amiodarone",
    severity: "major",
    description: "Amiodarone inhibits CYP3A4, markedly increasing simvastatin levels and risk of myopathy/rhabdomyolysis. Limit simvastatin to 20mg/day.",
  },
  {
    a: "sildenafil", b: "硝酸",
    severity: "contraindicated",
    description: "Combination of PDE-5 inhibitors with nitrates causes severe hypotension. Absolutely contraindicated.",
  },
  {
    a: "sildenafil", b: "nitrate",
    severity: "contraindicated",
    description: "Combination of PDE-5 inhibitors with nitrates causes severe hypotension. Absolutely contraindicated.",
  },
  {
    a: "clopidogrel", b: "omeprazole",
    severity: "moderate",
    description: "Omeprazole inhibits CYP2C19, reducing activation of clopidogrel and diminishing antiplatelet effect. Consider pantoprazole as alternative.",
  },
  {
    a: "ssri", b: "tramadol",
    severity: "major",
    description: "Risk of serotonin syndrome. Monitor for agitation, clonus, diaphoresis, and hyperthermia.",
  },
  {
    a: "fluoroquinolone", b: "antacid",
    severity: "moderate",
    description: "Divalent cations (Mg²⁺, Al³⁺, Ca²⁺) chelate fluoroquinolones, reducing absorption by up to 50%. Separate administration by 2 hours.",
  },
  {
    a: "amlodipine", b: "simvastatin",
    severity: "moderate",
    description: "Amlodipine inhibits CYP3A4, increasing simvastatin exposure. Limit simvastatin to 20mg/day when co-administered.",
  },
  {
    a: "digoxin", b: "amiodarone",
    severity: "major",
    description: "Amiodarone inhibits P-glycoprotein and reduces renal clearance of digoxin. Reduce digoxin dose by 50% and monitor levels.",
  },
  {
    a: "methotrexate", b: "nsaid",
    severity: "major",
    description: "NSAIDs reduce renal clearance of methotrexate, leading to methotrexate toxicity (pancytopenia, mucositis).",
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

  for (let i = 0; i < drugNames.length; i++) {
    for (let j = i + 1; j < drugNames.length; j++) {
      const a = drugNames[i].toLowerCase();
      const b = drugNames[j].toLowerCase();
      const pairKey = [drugNames[i], drugNames[j]].sort().join("||");
      if (seen.has(pairKey)) continue;
      seen.add(pairKey);

      // Check static table
      // One-directional: drug name must CONTAIN the key (not reverse) to prevent
      // false positives (e.g., "statin" should NOT match pair key "simvastatin")
      for (const pair of STATIC_CRITICAL) {
        const matchA = a.includes(pair.a);
        const matchB = b.includes(pair.b);
        const matchAB = a.includes(pair.b);
        const matchBA = b.includes(pair.a);
        if ((matchA && matchB) || (matchAB && matchBA)) {
          results.push({
            drugA: drugNames[i],
            drugB: drugNames[j],
            severity: pair.severity,
            description: pair.description,
          });
        }
      }

      // Check medications DB interactions field
      if (medsWithInteractions) {
        const medA = medsWithInteractions.find(m =>
          m.name_zh === drugNames[i] || m.name_en.toLowerCase() === a ||
          m.generic_name?.toLowerCase() === a
        );
        const medB = medsWithInteractions.find(m =>
          m.name_zh === drugNames[j] || m.name_en.toLowerCase() === b ||
          m.generic_name?.toLowerCase() === b
        );

        // Check if medA lists medB in its interactions, or vice versa
        const checkInList = (med: typeof medA, target: string): boolean => {
          if (!med?.interactions) return false;
          return med.interactions.some(interaction =>
            interaction.toLowerCase().includes(target.toLowerCase())
          );
        };

        if (medA && checkInList(medA, drugNames[j])) {
          if (!results.find(r => r.drugA === drugNames[i] && r.drugB === drugNames[j])) {
            results.push({
              drugA: drugNames[i], drugB: drugNames[j],
              severity: "moderate",
              description: `Interaction noted in ${drugNames[i]} prescribing information. Review medication profiles for clinical significance.`,
            });
          }
        } else if (medB && checkInList(medB, drugNames[i])) {
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
