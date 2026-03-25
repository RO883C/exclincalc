/**
 * sync-references.mjs
 * 從本地 referenceRanges.ts 同步數據到 Supabase
 * 每月由 GitHub Action 自動執行，也可手動執行：
 *   node scripts/sync-references.mjs
 *
 * 需要環境變數：
 *   SUPABASE_URL         - Supabase 專案 URL
 *   SUPABASE_SERVICE_KEY - Supabase service_role key（有完整寫入權限）
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Read the current reference ranges from the TypeScript source
// This is a simple extraction — for production, export a JSON file instead
const tsSource = readFileSync("src/lib/referenceRanges.ts", "utf8");

// Extract version comment if present (e.g. // VERSION: 2026-01-01)
const versionMatch = tsSource.match(/\/\/ VERSION: ([\d-]+)/);
const localVersion = versionMatch?.[1] ?? new Date().toISOString().slice(0, 10);

// Check current DB version
const { data: dbVersionRow } = await supabase
  .from("medical_references")
  .select("updated_at")
  .order("updated_at", { ascending: false })
  .limit(1)
  .single();

const dbVersion = dbVersionRow?.updated_at?.slice(0, 10) ?? "2000-01-01";

if (dbVersion >= localVersion) {
  console.log(`✅ Already up to date (DB: ${dbVersion}, Local: ${localVersion})`);
  process.exit(0);
}

console.log(`🔄 Updating references from ${dbVersion} → ${localVersion}`);

// Import reference data from the JSON export
// The actual reference data is maintained in src/lib/referenceRanges.ts
// For sync purposes, we read it as a data file
// In production, export a data/reference-ranges.json from the TS source

const { REFERENCE_RANGES } = await import("../src/lib/referenceRanges.ts").catch(() => {
  console.warn("⚠️ Could not import TS directly, reading from data/reference-ranges.json");
  return { REFERENCE_RANGES: JSON.parse(readFileSync("data/reference-ranges.json", "utf8")) };
});

const rows = REFERENCE_RANGES.map((ref) => ({
  key: ref.key,
  label_zh: ref.label_zh,
  label_en: ref.label_en,
  unit: ref.unit,
  explanation_zh: ref.explanation_zh,
  normal_general: ref.normal.general ?? null,
  normal_male: ref.normal.male ?? null,
  normal_female: ref.normal.female ?? null,
  warning_high: ref.warning_high ?? null,
  warning_low: ref.warning_low ?? null,
  category: ref.category,
  source: ref.source ?? null,
  updated_at: new Date().toISOString(),
}));

const { error } = await supabase
  .from("medical_references")
  .upsert(rows, { onConflict: "key" });

if (error) {
  console.error("❌ Sync failed:", error.message);
  process.exit(1);
}

console.log(`✅ Synced ${rows.length} reference items to Supabase`);
