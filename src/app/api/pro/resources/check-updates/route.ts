import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { KNOWN_UPDATES, findUpdate } from "@/lib/pro/resourceUpdates";

interface ResourceRow {
  id: string;
  title: string;
  year: string | null;
  url: string | null;
  source: string | null;
  category: string;
}

export interface UpdateResult {
  resourceId: string;
  currentTitle: string;
  currentYear: string | null;
  latestYear: string;
  latestTitle: string;
  latestUrl: string;
  source: string;
  changeNote: string;
  category: string;
}

export async function GET() {
  const supabase = await createServerSupabaseClient();

  // Verify Pro access
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("is_pro").eq("id", user.id).single();
  if (!profile?.is_pro) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Fetch all resources
  const { data: resources, error } = await supabase
    .from("pro_resources")
    .select("id, title, year, url, source, category")
    .eq("is_public", true);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results: UpdateResult[] = [];

  for (const r of (resources as ResourceRow[]) || []) {
    const known = findUpdate(r.title);
    if (!known) continue;

    // Check if this resource is outdated
    const currentYear = parseInt(r.year || "0");
    const latestYear = parseInt(known.latestYear);
    const urlOutdated = r.url !== known.latestUrl;

    if (currentYear < latestYear || urlOutdated) {
      results.push({
        resourceId: r.id,
        currentTitle: r.title,
        currentYear: r.year,
        latestYear: known.latestYear,
        latestTitle: known.latestTitle,
        latestUrl: known.latestUrl,
        source: known.source,
        changeNote: known.changeNote,
        category: known.category,
      });
    }
  }

  // Also return unmatched known updates (resources not in DB yet)
  const matchedTitles = new Set(results.map(r => r.currentTitle.toLowerCase()));
  const missing = KNOWN_UPDATES.filter(
    ku => !((resources as ResourceRow[]) || []).some(r => r.title.toLowerCase().includes(ku.titleMatch.toLowerCase()))
  ).map(ku => ({
    resourceId: null,
    currentTitle: null,
    currentYear: null,
    latestYear: ku.latestYear,
    latestTitle: ku.latestTitle,
    latestUrl: ku.latestUrl,
    source: ku.source,
    changeNote: ku.changeNote,
    category: ku.category,
  }));

  void matchedTitles;

  return NextResponse.json({ updates: results, missing, checkedAt: new Date().toISOString() });
}

// PATCH: apply an update to a specific resource
export async function PATCH(req: Request) {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("pro_role").eq("id", user.id).single();
  if (!["admin", "super_admin"].includes(profile?.pro_role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { resourceId, latestTitle, latestYear, latestUrl, source } = await req.json();
  if (!resourceId) return NextResponse.json({ error: "Missing resourceId" }, { status: 400 });

  const { error } = await supabase.from("pro_resources").update({
    title: latestTitle,
    year: latestYear,
    url: latestUrl,
    source,
  }).eq("id", resourceId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
