/**
 * 建立測試管理員帳號（繞過 email 驗證）
 * 執行：node scripts/create-test-user.mjs
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
  console.error("❌ 缺少 SUPABASE_SERVICE_ROLE_KEY，請在 .env.local 補上");
  process.exit(1);
}

const TEST_EMAIL    = "00@test.com";
const TEST_PASSWORD = "000000";

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log(`\n建立測試帳號：${TEST_EMAIL} / ${TEST_PASSWORD}\n`);

  let userId;

  // 建立使用者（繞過 email 驗證）
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
  });

  if (createErr) {
    if (createErr.message.toLowerCase().includes("already")) {
      console.log("⚠  帳號已存在，直接更新 profile…");
      const { data: { users } } = await admin.auth.admin.listUsers();
      const found = users?.find((u) => u.email === TEST_EMAIL);
      if (!found) { console.error("找不到使用者"); process.exit(1); }
      userId = found.id;
    } else {
      console.error("❌ 建立失敗：", createErr.message);
      process.exit(1);
    }
  } else {
    userId = created.user.id;
    console.log("✓ 使用者建立成功：", userId);
  }

  await setAdminProfile(userId);
}

async function setAdminProfile(userId) {
  // 先試 update（行可能由 trigger 建立）
  const { error: upErr, count } = await admin
    .from("profiles")
    .update({ is_pro: true, pro_role: "admin" })
    .eq("id", userId);

  if (upErr || count === 0) {
    // 若無此行則 insert
    const { error: insErr } = await admin
      .from("profiles")
      .insert({ id: userId, is_pro: true, pro_role: "admin" });
    if (insErr) {
      console.error("❌ profiles upsert 失敗：", insErr.message);
      console.log("\n請手動在 Supabase Dashboard > Table Editor > profiles");
      console.log(`  找到 id = ${userId}，將 is_pro 設為 true，pro_role 設為 admin`);
      return;
    }
  }

  console.log("✓ is_pro = true, pro_role = admin");
  console.log("\n────────────────────────────────────");
  console.log("  帳號（email）：", TEST_EMAIL);
  console.log("  密碼：", TEST_PASSWORD);
  console.log("  角色：管理員（admin）");
  console.log("────────────────────────────────────\n");
}

main();
