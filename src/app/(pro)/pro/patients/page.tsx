"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, User, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { calculateAge } from "@/lib/pro/patientUtils";

interface Patient {
  id: string;
  full_name: string;
  date_of_birth: string | null;
  sex: "M" | "F" | "Other" | null;
  blood_type: string | null;
  chronic_conditions: string[];
  allergies: string[];
  updated_at: string;
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("doctor_patients")
        .select("id, full_name, date_of_birth, sex, blood_type, chronic_conditions, allergies, updated_at")
        .eq("doctor_id", user.id)
        .order("updated_at", { ascending: false });
      setPatients(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = search.trim()
    ? patients.filter(p => p.full_name.includes(search) || (p.chronic_conditions || []).join("").includes(search))
    : patients;

  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--pro-text)" }}>病患管理</h1>
          <p style={{ fontSize: 13, color: "var(--pro-text-muted)", marginTop: 2 }}>共 {patients.length} 位病患</p>
        </div>
        <Link href="/pro/patients/new" className="pro-btn-primary">
          <Plus size={14} />
          新增病患
        </Link>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 20, maxWidth: 360 }}>
        <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--pro-text-muted)" }} />
        <input
          className="pro-input"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="搜尋病患姓名、慢性病..."
          style={{ paddingLeft: 36 }}
        />
      </div>

      {/* Patient list */}
      {loading ? (
        <div style={{ color: "var(--pro-text-muted)", padding: 40, textAlign: "center" }}>載入中...</div>
      ) : filtered.length === 0 ? (
        <div className="pro-card" style={{ padding: 48, textAlign: "center" }}>
          <User size={40} color="var(--pro-text-muted)" style={{ margin: "0 auto 12px" }} />
          <p style={{ color: "var(--pro-text-muted)", fontSize: 14 }}>
            {search ? "無符合的病患" : "尚未新增病患"}
          </p>
          {!search && (
            <Link href="/pro/patients/new" className="pro-btn-primary" style={{ marginTop: 16, display: "inline-flex" }}>
              <Plus size={14} />
              新增第一位病患
            </Link>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(p => {
            const age = calculateAge(p.date_of_birth);
            const sex = p.sex === "M" ? "男" : p.sex === "F" ? "女" : "—";
            return (
              <Link key={p.id} href={`/pro/patients/${p.id}`} style={{ textDecoration: "none" }}>
                <div className="pro-card" style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                    background: "var(--pro-accent-dim)", border: "1px solid rgba(59,130,246,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16, fontWeight: 700, color: "var(--pro-accent)",
                  }}>
                    {p.full_name.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 600, color: "var(--pro-text)" }}>{p.full_name}</span>
                      <span style={{ fontSize: 12, color: "var(--pro-text-muted)" }}>
                        {sex}{age !== null ? ` · ${age}歲` : ""}
                      </span>
                      {p.blood_type && (
                        <span className="pro-badge pro-badge-blue" style={{ fontSize: 10 }}>{p.blood_type}</span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {(p.chronic_conditions || []).map(c => (
                        <span key={c} className="pro-badge pro-badge-yellow" style={{ fontSize: 10 }}>{c}</span>
                      ))}
                      {(p.allergies || []).map(a => (
                        <span key={a} className="pro-badge pro-badge-red" style={{ fontSize: 10 }}>⚠️ {a}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--pro-text-muted)", textAlign: "right", flexShrink: 0 }}>
                    <div>{new Date(p.updated_at).toLocaleDateString("zh-TW")}</div>
                    <ChevronRight size={14} color="var(--pro-text-muted)" style={{ marginTop: 4 }} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
