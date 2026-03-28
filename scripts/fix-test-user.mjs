/**
 * 修正已建立的測試帳號 — 設定 is_pro + pro_role
 * 執行一次後可刪除此檔
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

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const USER_ID = "c6266e4a-227f-4a5c-a275-56cb6eae56ed";

async function main() {
  // 先確認 profiles 行是否存在
  const { data: existing } = await admin.from("profiles").select("id").eq("id", USER_ID).maybeSingle();

  let error;
  if (existing) {
    ({ error } = await admin.from("profiles").update({ is_pro: true, pro_role: "admin" }).eq("id", USER_ID));
    console.log("update:", error?.message ?? "✓");
  } else {
    ({ error } = await admin.from("profiles").insert({ id: USER_ID, is_pro: true, pro_role: "admin" }));
    console.log("insert:", error?.message ?? "✓");
  }

  if (!error) {
    console.log("\n✓ 帳號 00@test.com 已設為管理員（is_pro=true, pro_role=admin）");
    console.log("  現在可以用 00@test.com / 000000 登入了\n");
  }
}

main();
