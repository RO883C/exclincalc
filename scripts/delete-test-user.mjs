/**
 * 刪除測試帳號
 * 執行：node scripts/delete-test-user.mjs
 */

import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

let env = {};
try {
  readFileSync(".env.local", "utf8")
    .split("\n")
    .forEach((line) => {
      const [k, ...v] = line.split("=");
      if (k && v.length) env[k.trim()] = v.join("=").trim();
    });
} catch {}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌ 缺少 SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const TEST_EMAIL = "00@test.com";

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data: { users } } = await admin.auth.admin.listUsers();
  const found = users?.find((u) => u.email === TEST_EMAIL);
  if (!found) {
    console.log("找不到測試帳號，可能已刪除。");
    return;
  }
  const { error } = await admin.auth.admin.deleteUser(found.id);
  if (error) {
    console.error("❌ 刪除失敗：", error.message);
  } else {
    console.log(`✓ 測試帳號 ${TEST_EMAIL} 已刪除`);
  }
}

main();
