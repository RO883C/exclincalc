"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import type { ICD10Candidate } from "@/lib/pro/clinicalAnalysis";

const CONFIDENCE_STYLE = {
  high:     { label: "高",   color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
  moderate: { label: "中",   color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  low:      { label: "低",   color: "#94a3b8", bg: "rgba(148,163,184,0.1)" },
};

export default function ICD10Table({ candidates }: { candidates: ICD10Candidate[] }) {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 1500);
  };

  if (candidates.length === 0) return null;

  return (
    <div>
      <table className="pro-table" style={{ fontSize: 12 }}>
        <thead>
          <tr>
            <th style={{ width: 110 }}>ICD-10 Code</th>
            <th>中文診斷</th>
            <th>英文診斷</th>
            <th style={{ width: 60 }}>相關性</th>
            <th style={{ width: 44 }}></th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((c) => {
            const conf = CONFIDENCE_STYLE[c.confidence];
            return (
              <tr key={c.code}>
                <td>
                  <code style={{
                    background: "var(--pro-accent-dim)", color: "var(--pro-accent)",
                    padding: "2px 7px", borderRadius: 4, fontFamily: "monospace", fontSize: 12,
                  }}>
                    {c.code}
                  </code>
                </td>
                <td style={{ fontWeight: 500 }}>{c.description_zh}</td>
                <td style={{ color: "var(--pro-text-muted)" }}>{c.description_en}</td>
                <td>
                  <span style={{
                    background: conf.bg, color: conf.color,
                    padding: "1px 6px", borderRadius: 3, fontSize: 11, fontWeight: 600,
                  }}>
                    {conf.label}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => copy(c.code)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--pro-text-muted)" }}
                    title="複製代碼"
                  >
                    {copied === c.code ? <Check size={13} color="var(--pro-success)" /> : <Copy size={13} />}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
