import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// Rate limit: max 5 registrations / IP / hour
const registerRateMap = new Map<string, { count: number; resetAt: number }>();
function checkRegisterLimit(ip: string): boolean {
  const now = Date.now();
  const entry = registerRateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    registerRateMap.set(ip, { count: 1, resetAt: now + 3_600_000 });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || "unknown";
  if (!checkRegisterLimit(ip)) {
    return NextResponse.json({ error: "註冊次數過多，請 1 小時後再試" }, { status: 429 });
  }

  const { email, password, name } = await req.json();

  if (!email || !password || password.length < 8) {
    return NextResponse.json({ error: "資料不完整" }, { status: 400 });
  }

  const admin = getAdminClient();

  // 用 service role 建立帳號，email_confirm: true 跳過驗證信
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });

  if (error) {
    const msg = error.message;
    if (msg.includes("already registered") || msg.includes("already been registered")) {
      return NextResponse.json({ error: "此電子郵件已被註冊" }, { status: 400 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  // 更新 profile 名稱（trigger 已建立基本 profile）
  if (data.user) {
    await admin.from("profiles").update({ name }).eq("id", data.user.id);
  }

  return NextResponse.json({ ok: true });
}
