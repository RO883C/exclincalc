"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, FileText, Edit3, Trash2, Search } from "lucide-react";
import { createClient } from "@/lib/supabase";

interface SOAPNote {
  id: string; title: string | null; draft: boolean;
  created_at: string; updated_at: string;
  doctor_patients: { full_name: string } | null;
}

export default function NotesPage() {
  const [notes, setNotes] = useState<SOAPNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "draft" | "final">("all");

  const load = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("soap_notes")
      .select("id, title, draft, created_at, updated_at, doctor_patients(full_name)")
      .eq("doctor_id", user.id)
      .order("updated_at", { ascending: false });
    setNotes((data as unknown as SOAPNote[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("確定刪除此筆記？")) return;
    const supabase = createClient();
    await supabase.from("soap_notes").delete().eq("id", id);
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const filtered = notes
    .filter(n => filter === "all" ? true : filter === "draft" ? n.draft : !n.draft)
    .filter(n => !search || (n.title || "").includes(search) || (n.doctor_patients?.full_name || "").includes(search));

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--pro-text)" }}>SOAP 筆記</h1>
          <p style={{ fontSize: 13, color: "var(--pro-text-muted)", marginTop: 2 }}>共 {notes.length} 筆</p>
        </div>
        <Link href="/pro/notes/new" className="pro-btn-primary">
          <Plus size={14} /> 新增筆記
        </Link>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 280 }}>
          <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--pro-text-muted)" }} />
          <input className="pro-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="搜尋筆記..." style={{ paddingLeft: 30 }} />
        </div>
        {(["all", "draft", "final"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "8px 14px", borderRadius: 7, fontSize: 12, cursor: "pointer",
            background: filter === f ? "var(--pro-accent)" : "var(--pro-card)",
            color: filter === f ? "#fff" : "var(--pro-text-muted)",
            border: `1px solid ${filter === f ? "var(--pro-accent)" : "var(--pro-border)"}`,
            fontWeight: filter === f ? 600 : 400,
          }}>
            {f === "all" ? "全部" : f === "draft" ? "草稿" : "已完成"}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: "var(--pro-text-muted)", padding: 40, textAlign: "center" }}>載入中...</div>
      ) : filtered.length === 0 ? (
        <div className="pro-card" style={{ padding: 48, textAlign: "center" }}>
          <FileText size={36} color="var(--pro-text-muted)" style={{ margin: "0 auto 12px" }} />
          <p style={{ color: "var(--pro-text-muted)", fontSize: 13 }}>尚無筆記</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {filtered.map(n => (
            <div key={n.id} className="pro-card" style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
              <FileText size={16} color={n.draft ? "var(--pro-warning)" : "var(--pro-success)"} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: "var(--pro-text)" }}>{n.title || "未命名筆記"}</span>
                  {n.draft && <span className="pro-badge pro-badge-yellow" style={{ fontSize: 10 }}>草稿</span>}
                </div>
                <div style={{ fontSize: 12, color: "var(--pro-text-muted)" }}>
                  {n.doctor_patients?.full_name ? `${n.doctor_patients.full_name} · ` : ""}
                  {new Date(n.updated_at).toLocaleDateString("zh-TW", { year: "numeric", month: "short", day: "numeric" })}
                </div>
              </div>
              <div style={{ display: "flex", gap: 5 }}>
                <Link href={`/pro/notes/${n.id}`} style={{
                  display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", borderRadius: 6,
                  background: "var(--pro-accent-dim)", color: "var(--pro-accent)", fontSize: 12, textDecoration: "none",
                }}>
                  <Edit3 size={12} /> 編輯
                </Link>
                <button onClick={() => handleDelete(n.id)} style={{
                  display: "flex", alignItems: "center", padding: "6px 8px", borderRadius: 6,
                  background: "var(--pro-danger-dim)", color: "var(--pro-danger)", border: "none", cursor: "pointer",
                }}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
