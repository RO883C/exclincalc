"use client";

import { useState, useRef, useEffect } from "react";
import { X, Search } from "lucide-react";
import { createClient } from "@/lib/supabase";

interface Drug {
  id: string;
  name_zh: string;
  name_en: string;
  generic_name: string | null;
  category: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  心血管: "#ef4444", 糖尿病: "#f59e0b", 血脂: "#f97316",
  抗生素: "#10b981", 止痛: "#8b5cf6", 腸胃: "#06b6d4",
  呼吸: "#3b82f6", 精神科: "#ec4899", 其他: "#94a3b8",
};

interface DrugTokenInputProps {
  selected: string[];
  onChange: (drugs: string[]) => void;
  placeholder?: string;
}

export default function DrugTokenInput({ selected, onChange, placeholder = "輸入藥物名稱搜尋..." }: DrugTokenInputProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Drug[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length < 1) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("medications")
        .select("id, name_zh, name_en, generic_name, category")
        .or(`name_zh.ilike.%${query}%,name_en.ilike.%${query}%,generic_name.ilike.%${query}%`)
        .limit(8);
      setSuggestions(data || []);
      setOpen(true);
      setLoading(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const addDrug = (name: string) => {
    if (!selected.includes(name)) {
      onChange([...selected, name]);
    }
    setQuery("");
    setSuggestions([]);
    setOpen(false);
    inputRef.current?.focus();
  };

  const removeDrug = (name: string) => {
    onChange(selected.filter(d => d !== name));
  };

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <div
        className="pro-input"
        style={{
          display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center",
          cursor: "text", minHeight: 44,
        }}
        onClick={() => inputRef.current?.focus()}
      >
        {selected.map(drug => (
          <span key={drug} style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "3px 8px", borderRadius: 6, fontSize: 12, fontWeight: 500,
            background: "var(--pro-accent-dim)", color: "var(--pro-accent)",
            border: "1px solid rgba(59,130,246,0.2)",
          }}>
            {drug}
            <button
              onClick={(e) => { e.stopPropagation(); removeDrug(drug); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--pro-accent)", padding: 0, display: "flex" }}
            >
              <X size={11} />
            </button>
          </span>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 150 }}>
          {loading ? null : <Search size={13} color="var(--pro-text-muted)" />}
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={selected.length === 0 ? placeholder : "繼續新增..."}
            style={{
              background: "none", border: "none", outline: "none",
              color: "var(--pro-text)", fontSize: 13, flex: 1,
            }}
          />
        </div>
      </div>

      {open && suggestions.length > 0 && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          background: "var(--pro-card)", border: "1px solid var(--pro-border)",
          borderRadius: 8, overflow: "hidden", zIndex: 100,
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        }}>
          {suggestions.map(drug => {
            const catColor = CATEGORY_COLORS[drug.category] || "#94a3b8";
            const alreadyAdded = selected.includes(drug.name_zh);
            return (
              <div
                key={drug.id}
                onClick={() => !alreadyAdded && addDrug(drug.name_zh)}
                style={{
                  padding: "10px 14px", cursor: alreadyAdded ? "default" : "pointer",
                  opacity: alreadyAdded ? 0.5 : 1,
                  borderBottom: "1px solid var(--pro-border)",
                  display: "flex", alignItems: "center", gap: 10,
                  transition: "background 0.1s",
                }}
                onMouseEnter={e => { if (!alreadyAdded) (e.currentTarget as HTMLDivElement).style.background = "var(--pro-card-hover)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
              >
                <span style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: catColor, flexShrink: 0,
                }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--pro-text)" }}>
                    {drug.name_zh}
                    {alreadyAdded && <span style={{ fontSize: 11, color: "var(--pro-text-muted)", marginLeft: 6 }}>（已加入）</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--pro-text-muted)" }}>
                    {drug.name_en}{drug.generic_name ? ` · ${drug.generic_name}` : ""}
                  </div>
                </div>
                <span style={{
                  marginLeft: "auto", fontSize: 10, padding: "1px 6px", borderRadius: 3,
                  background: `${catColor}20`, color: catColor,
                }}>
                  {drug.category}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
