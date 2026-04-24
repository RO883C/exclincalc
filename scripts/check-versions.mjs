/**
 * check-versions.mjs
 * 臨床指引版本偵測腳本
 *
 * 每月 1 日由 GitHub Actions 執行（與 sync-references.yml 同日）
 * 比對官網最新版本與資料庫中的 current 記錄
 * 若發現新版本 → 在 reference_pdf_links 插入 status='update_available'
 *
 * 手動執行：
 *   SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=yyy node scripts/check-versions.mjs
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// ═══════════════════════════════════════════════════════════════
// 版本偵測規則
// check_url: 抓取的頁面
// detect: (html) => string | null  → 回傳偵測到的年份，null = 無法判斷
// expected_year: 目前 DB 中的版本年份
// ═══════════════════════════════════════════════════════════════
const VERSION_CHECKS = [
  {
    title: "Standards of Care in Diabetes",
    publisher: "ADA",
    check_url: "https://professional.diabetes.org/standards-of-care",
    expected_year: "2026",
    detect: (html) => {
      const match = html.match(/Standards of Care in Diabetes[^\d]*(\d{4})/i);
      return match ? match[1] : null;
    },
  },
  {
    title: "GINA Strategy for Asthma",
    publisher: "GINA",
    check_url: "https://ginasthma.org/",
    expected_year: "2025",
    detect: (html) => {
      const match = html.match(/GINA[^\d]*(\d{4})[^\d]*Strategy Report/i)
        || html.match(/(\d{4})[^\d]*GINA[^\d]*Strategy/i);
      return match ? match[1] : null;
    },
  },
  {
    title: "GOLD Report for COPD",
    publisher: "GOLD",
    check_url: "https://goldcopd.org/",
    expected_year: "2026",
    detect: (html) => {
      const match = html.match(/GOLD[^\d]*(\d{4})[^\d]*Report/i)
        || html.match(/(\d{4})[^\d]*GOLD[^\d]*Report/i);
      return match ? match[1] : null;
    },
  },
  {
    title: "KDIGO 2024 CKD Guideline",
    publisher: "KDIGO",
    check_url: "https://kdigo.org/guidelines/ckd-evaluation-management/",
    expected_year: "2024",
    detect: (html) => {
      const match = html.match(/KDIGO[^\d]*(\d{4})[^\d]*CKD/i)
        || html.match(/CKD[^\d]*Guideline[^\d]*(\d{4})/i);
      return match ? match[1] : null;
    },
  },
  {
    title: "WHO Model List of Essential Medicines",
    publisher: "WHO",
    check_url: "https://www.who.int/groups/expert-committee-on-selection-and-use-of-essential-medicines/essential-medicines-lists",
    expected_year: "2025",
    detect: (html) => {
      // 尋找 "24th" "25th" 等版次
      const edMatch = html.match(/(\d+)(?:st|nd|rd|th)[^\d]*Edition[^\d]*Essential Medicines/i)
        || html.match(/Essential Medicines[^\d]*(\d+)(?:st|nd|rd|th)[^\d]*Edition/i);
      if (edMatch) {
        const editionNum = parseInt(edMatch[1]);
        // 24th = 2025, 25th ≈ 2027，以版次推算年份
        if (editionNum >= 25) return String(2025 + (editionNum - 24) * 2);
      }
      const yearMatch = html.match(/Essential Medicines[^\d]*(\d{4})/i);
      return yearMatch ? yearMatch[1] : null;
    },
  },
];

// ═══════════════════════════════════════════════════════════════
// 執行版本偵測
// ═══════════════════════════════════════════════════════════════

async function fetchPage(url) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ExClinCalc-VersionChecker/1.0)" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

const updates = [];
const currentYear = new Date().getFullYear();

console.log(`\n=== ExClinCalc 臨床指引版本偵測 ===`);
console.log(`執行時間：${new Date().toISOString()}\n`);

for (const check of VERSION_CHECKS) {
  process.stdout.write(`檢查 ${check.publisher} (${check.title})... `);
  const html = await fetchPage(check.check_url);

  if (!html) {
    console.log(`⚠️  無法抓取頁面，跳過`);
    continue;
  }

  const detected = check.detect(html);

  if (!detected) {
    console.log(`❓ 無法從頁面辨識版本年份`);
    continue;
  }

  if (detected === check.expected_year) {
    console.log(`✅ 版本符合（${detected}）`);
    continue;
  }

  // 偵測到不同版本
  const detectedNum = parseInt(detected);
  const expectedNum = parseInt(check.expected_year);

  if (detectedNum > expectedNum) {
    console.log(`🆕 發現新版本！${check.expected_year} → ${detected}`);
    updates.push({ ...check, detected_year: detected });
  } else {
    console.log(`ℹ️  偵測到舊版年份 ${detected}，目前已是 ${check.expected_year}`);
  }
}

// ═══════════════════════════════════════════════════════════════
// 寫入 Supabase：有新版本時建立 update_available 記錄
// ═══════════════════════════════════════════════════════════════

if (updates.length === 0) {
  console.log(`\n✅ 所有已檢查指引皆為最新版本。`);
  process.exit(0);
}

console.log(`\n⚠️  發現 ${updates.length} 個指引可能有新版本，寫入資料庫待審查...\n`);

for (const u of updates) {
  const { error } = await supabase.from("reference_pdf_links").insert({
    title: u.title,
    publisher: u.publisher,
    year: u.detected_year,
    source_url: u.check_url,
    check_url: u.check_url,
    version_keyword: u.title,
    notes: `自動偵測：原版本 ${u.expected_year}，頁面偵測到 ${u.detected_year}。請管理員手動確認並更新。`,
    status: "update_available",
    detected_at: new Date().toISOString(),
  });

  if (error) {
    console.error(`  ❌ 寫入失敗（${u.title}）:`, error.message);
  } else {
    console.log(`  ✅ 已記錄：${u.title} → ${u.detected_year}`);
  }
}

console.log(`
═══════════════════════════════════════════════
後續動作：
1. 登入 ExClinCalc 管理員頁面 → 臨床指引版本管理
2. 確認每筆 update_available 記錄（點開 source_url 查看官網）
3. 確認後更新：
   - scripts/sync-references.mjs 的 RESOURCES 陣列
   - supabase/seed_resources.sql
   - 在 reference_pdf_links 補充 PDF 直連 URL
4. 手動執行 sync-references.mjs（或等下月自動執行）
═══════════════════════════════════════════════
`);
