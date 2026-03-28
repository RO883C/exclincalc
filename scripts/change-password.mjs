/**
 * 管理員密碼修改工具
 * 執行：node scripts/change-password.mjs <email> <new-password>
 * 範例：node scripts/change-password.mjs 00@test.com newpass123
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

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌ 缺少 SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const [,, email, newPassword] = process.argv;

if (!email || !newPassword) {
  console.log("使用方式：node scripts/change-password.mjs <email> <new-password>");
  console.log("範例：   node scripts/change-password.mjs 00@test.com newpass123");
  process.exit(1);
}

if (newPassword.length < 6) {
  console.error("❌ 密碼至少需要 6 字元");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  // Find user by email
  const { data: { users }, error: listErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listErr) { console.error("❌", listErr.message); process.exit(1); }

  const user = users?.find((u) => u.email === email);
  if (!user) {
    console.error(`❌ 找不到帳號：${email}`);
    process.exit(1);
  }

  // Update password
  const { error } = await admin.auth.admin.updateUserById(user.id, { password: newPassword });
  if (error) {
    console.error("❌ 修改失敗：", error.message);
    process.exit(1);
  }

  console.log(`✓ 帳號 ${email} 密碼已更新`);
  console.log(`  新密碼：${newPassword}`);
}

main();
