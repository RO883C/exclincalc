/**
 * 執行 pro_schema.sql — 建立所有 Pro 相關表格和欄位
 * 需要 SUPABASE_DB_URL 或透過 Management API
 *
 * 若此腳本無法運行，請手動在 Supabase Dashboard > SQL Editor 貼入並執行：
 *   supabase/pro_schema.sql 的內容
 */

import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

let env = {};
try {
  readFileSync(".env.local", "utf8").split("\n").forEach((line) => {
    const [k, ...v] = line.split("=");
    if (k && v.length) env[k.trim()] = v.join("=").trim();
  });
} catch {}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = env.SUPABASE_SERVICE_ROLE_KEY;

// 提取 project ref (從 URL 取得)
const projectRef = SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!projectRef || !SERVICE_KEY) {
  console.error("❌ 缺少環境變數");
  process.exit(1);
}

const sql = readFileSync("supabase/pro_schema.sql", "utf8");

// 使用 Supabase Management API 執行 SQL
async function main() {
  console.log("執行 pro_schema.sql...\n");

  const res = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({ query: sql }),
    }
  );

  const body = await res.json();

  if (!res.ok) {
    console.error("❌ API 失敗：", body);
    console.log("\n請改用手動方式：");
    printManualInstructions();
    process.exit(1);
  }

  console.log("✓ Schema 建立成功");
  console.log("  現在可執行：node scripts/fix-test-user.mjs");
}

function printManualInstructions() {
  console.log(`
手動執行步驟：
1. 前往 https://supabase.com/dashboard/project/${projectRef}/sql/new
2. 複製 supabase/pro_schema.sql 的全部內容
3. 貼上並點擊 Run
4. 完成後執行：node scripts/fix-test-user.mjs
`);
}

main().catch(() => {
  console.log("\n請改用手動方式：");
  printManualInstructions();
});
