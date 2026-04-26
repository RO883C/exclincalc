// Middleware：保護 /pro/* 路由
// 1. 未登入 → /auth/login
// 2. 已登入但 is_pro=false → /auth/login?error=unauthorized
// 3. 已綁 TOTP 但目前 session 仍是 aal1 → /auth/mfa-verify
// 4. /pro/security 例外（讓尚未綁 MFA 的使用者可進去 enroll）

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll(toSet) {
          toSet.forEach(({ name, value, options }) => {
            res.cookies.set({ name, value, ...options });
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = req.nextUrl.pathname;

  // 未登入
  if (!user) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("redirect", path);
    return NextResponse.redirect(url);
  }

  // 檢查 is_pro
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_pro")
    .eq("id", user.id)
    .single();
  if (!profile?.is_pro) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("error", "unauthorized");
    return NextResponse.redirect(url);
  }

  // /pro/security 是 enroll MFA 的入口，不論 AAL 都允許
  if (path.startsWith("/pro/security")) return res;

  // 檢查 AAL 升級需求
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/mfa-verify";
    url.searchParams.set("redirect", path);
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: ["/pro/:path*"],
};
