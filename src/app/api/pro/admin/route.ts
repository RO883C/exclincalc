import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

const ALLOWED_TABLES = ["medications", "medical_references"] as const;
type AllowedTable = typeof ALLOWED_TABLES[number];

async function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  return createClient(url, key);
}

async function verifyAdmin() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("is_pro, pro_role").eq("id", user.id).single();
  if (!profile?.is_pro) return null;
  return { user, isAdmin: ["admin", "super_admin"].includes(profile.pro_role ?? "") };
}

// POST: insert new row (or upsert if upsert: true)
export async function POST(req: NextRequest) {
  const auth = await verifyAdmin();
  if (!auth?.isAdmin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  let body: { table: string; row: Record<string, unknown>; upsert?: boolean };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 }); }

  if (!ALLOWED_TABLES.includes(body.table as AllowedTable)) {
    return NextResponse.json({ error: "INVALID_TABLE" }, { status: 400 });
  }

  const admin = await getAdminClient();
  const { id: _id, ...rowWithoutId } = body.row;
  void _id;

  let result;
  if (body.upsert) {
    result = await admin.from(body.table).upsert(rowWithoutId, { onConflict: "key" });
  } else {
    result = await admin.from(body.table).insert(rowWithoutId);
  }

  if (result.error) {
    console.error("[Admin POST]", result.error);
    return NextResponse.json({ error: result.error.message }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}

// PUT: update existing row by id
export async function PUT(req: NextRequest) {
  const auth = await verifyAdmin();
  if (!auth?.isAdmin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  let body: { table: string; row: Record<string, unknown> };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 }); }

  if (!ALLOWED_TABLES.includes(body.table as AllowedTable)) {
    return NextResponse.json({ error: "INVALID_TABLE" }, { status: 400 });
  }

  const { id, ...rowData } = body.row;
  if (!id) return NextResponse.json({ error: "MISSING_ID" }, { status: 400 });

  const admin = await getAdminClient();
  const { error } = await admin.from(body.table).update({ ...rowData, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) {
    console.error("[Admin PUT]", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}

// DELETE: delete row by id
export async function DELETE(req: NextRequest) {
  const auth = await verifyAdmin();
  if (!auth?.isAdmin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  let body: { table: string; id: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 }); }

  if (!ALLOWED_TABLES.includes(body.table as AllowedTable)) {
    return NextResponse.json({ error: "INVALID_TABLE" }, { status: 400 });
  }

  const admin = await getAdminClient();
  const { error } = await admin.from(body.table).delete().eq("id", body.id);
  if (error) {
    console.error("[Admin DELETE]", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
