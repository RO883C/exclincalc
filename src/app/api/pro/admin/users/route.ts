import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase-server";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function verifyAdmin() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("pro_role").eq("id", user.id).single();
  if (!["admin", "super_admin"].includes(profile?.pro_role ?? "")) return null;
  return user;
}

async function writeAuditLog(params: {
  actorId: string; actorEmail: string;
  action: string; targetId?: string; targetEmail?: string;
  details?: Record<string, unknown>;
}) {
  const admin = getAdminClient();
  await admin.from("audit_logs").insert({
    actor_id:     params.actorId,
    actor_email:  params.actorEmail,
    action:       params.action,
    target_id:    params.targetId ?? null,
    target_email: params.targetEmail ?? null,
    details:      params.details ?? {},
  });
}

// GET — list all users with stats
export async function GET() {
  const caller = await verifyAdmin();
  if (!caller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const supabase = await createServerSupabaseClient();
  const { data: callerProfile } = await supabase.from("profiles").select("pro_role").eq("id", caller.id).single();

  const admin = getAdminClient();

  // Get all auth users
  const { data: { users }, error } = await admin.auth.admin.listUsers({ perPage: 200 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get profiles
  const { data: profiles } = await admin.from("profiles")
    .select("id, is_pro, pro_role, institution, license_number");

  // Get activity stats per user
  const { data: patientCounts } = await admin
    .from("doctor_patients")
    .select("doctor_id")
    .then(({ data }) => ({
      data: data?.reduce((acc: Record<string, number>, r) => {
        acc[r.doctor_id] = (acc[r.doctor_id] || 0) + 1;
        return acc;
      }, {}),
    }));

  const { data: recordCounts } = await admin
    .from("clinical_records")
    .select("doctor_id")
    .then(({ data }) => ({
      data: data?.reduce((acc: Record<string, number>, r) => {
        acc[r.doctor_id] = (acc[r.doctor_id] || 0) + 1;
        return acc;
      }, {}),
    }));

  const { data: noteCounts } = await admin
    .from("soap_notes")
    .select("doctor_id")
    .then(({ data }) => ({
      data: data?.reduce((acc: Record<string, number>, r) => {
        acc[r.doctor_id] = (acc[r.doctor_id] || 0) + 1;
        return acc;
      }, {}),
    }));

  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

  const result = users.map((u) => {
    const p = profileMap.get(u.id);
    return {
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      email_confirmed_at: u.email_confirmed_at,
      is_pro: p?.is_pro ?? false,
      pro_role: p?.pro_role ?? "doctor",
      institution: p?.institution ?? null,
      license_number: p?.license_number ?? null,
      patients: (patientCounts as Record<string, number>)?.[u.id] ?? 0,
      records: (recordCounts as Record<string, number>)?.[u.id] ?? 0,
      notes: (noteCounts as Record<string, number>)?.[u.id] ?? 0,
    };
  });

  return NextResponse.json({
    users: result,
    currentUserId: caller.id,
    currentRole: callerProfile?.pro_role ?? "admin",
  });
}

// POST — create user or reset password
export async function POST(req: NextRequest) {
  const caller = await verifyAdmin();
  if (!caller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const admin = getAdminClient();

  if (body.action === "reset_password") {
    const { userId, newPassword } = body;
    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: "密碼至少 6 字元" }, { status: 400 });
    }
    const { error } = await admin.auth.admin.updateUserById(userId, { password: newPassword });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const { data: targetUser } = await admin.auth.admin.getUserById(userId);
    await writeAuditLog({
      actorId: caller.id, actorEmail: caller.email ?? "",
      action: "reset_password",
      targetId: userId, targetEmail: targetUser.user?.email ?? "",
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

// PATCH — update user profile (is_pro, pro_role, etc.)
export async function PATCH(req: NextRequest) {
  const caller = await verifyAdmin();
  if (!caller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId, updates } = await req.json();
  const admin = getAdminClient();

  // Protect super_admin: only super_admin can modify super_admin accounts
  const { data: targetProfile } = await admin.from("profiles").select("pro_role").eq("id", userId).single();
  const { data: callerProfile } = await (await createServerSupabaseClient()).from("profiles").select("pro_role").eq("id", caller.id).single();
  if (targetProfile?.pro_role === "super_admin" && callerProfile?.pro_role !== "super_admin") {
    return NextResponse.json({ error: "無法修改超級管理員帳號" }, { status: 403 });
  }
  // Prevent setting super_admin role unless caller is super_admin
  if (updates.pro_role === "super_admin" && callerProfile?.pro_role !== "super_admin") {
    return NextResponse.json({ error: "無法設定超級管理員角色" }, { status: 403 });
  }

  // Allowed fields only
  const allowed: Record<string, unknown> = {};
  if ("is_pro" in updates) allowed.is_pro = updates.is_pro;
  if ("pro_role" in updates) allowed.pro_role = updates.pro_role;
  if ("institution" in updates) allowed.institution = updates.institution;

  // Upsert: insert if row doesn't exist, update if it does
  const { error } = await admin
    .from("profiles")
    .upsert({ id: userId, ...allowed }, { onConflict: "id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Audit log
  const { data: targetUser } = await admin.auth.admin.getUserById(userId);
  await writeAuditLog({
    actorId: caller.id, actorEmail: caller.email ?? "",
    action: "role_change",
    targetId: userId, targetEmail: targetUser.user?.email ?? "",
    details: { updates: allowed, prev_role: targetProfile?.pro_role },
  });

  return NextResponse.json({ ok: true });
}

// DELETE — delete user account
export async function DELETE(req: NextRequest) {
  const caller = await verifyAdmin();
  if (!caller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId } = await req.json();

  // Prevent self-deletion
  if (userId === caller.id) {
    return NextResponse.json({ error: "無法刪除自己的帳號" }, { status: 400 });
  }

  const admin = getAdminClient();
  const { data: targetUser } = await admin.auth.admin.getUserById(userId);
  const targetEmail = targetUser.user?.email ?? "";
  const { data: targetProfile } = await admin.from("profiles").select("pro_role").eq("id", userId).single();

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog({
    actorId: caller.id, actorEmail: caller.email ?? "",
    action: "delete_user",
    targetId: userId, targetEmail,
    details: { deleted_role: targetProfile?.pro_role },
  });

  return NextResponse.json({ ok: true });
}
