"use client";

import { useState } from "react";
import { type InteractionResult, SEVERITY_LABEL, SEVERITY_ORDER } from "@/lib/pro/drugInteractions";

interface InteractionMatrixProps {
  drugs: string[];
  interactions: InteractionResult[];
}

export default function InteractionMatrix({ drugs, interactions }: InteractionMatrixProps) {
  const [selected, setSelected] = useState<InteractionResult | null>(null);

  if (drugs.length < 2) return null;

  const getInteraction = (a: string, b: string): InteractionResult | null => {
    return interactions.find(
      i => (i.drugA === a && i.drugB === b) || (i.drugA === b && i.drugB === a)
    ) || null;
  };

  const getWorst = (a: string, b: string) => {
    const i = getInteraction(a, b);
    return i ? i.severity : "none";
  };

  // Sort drugs by worst interaction severity
  const sorted = [...drugs];

  return (
    <div>
      {/* Matrix grid */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "separate", borderSpacing: 4 }}>
          <thead>
            <tr>
              <th style={{ width: 100 }}></th>
              {sorted.slice(1).map(d => (
                <th key={d} style={{
                  fontSize: 11, fontWeight: 600, color: "var(--pro-text-muted)",
                  padding: "4px 8px", textAlign: "center",
                  maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.slice(0, -1).map((rowDrug, ri) => (
              <tr key={rowDrug}>
                <td style={{
                  fontSize: 11, fontWeight: 600, color: "var(--pro-text-muted)",
                  padding: "4px 8px", textAlign: "right",
                  maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {rowDrug}
                </td>
                {sorted.slice(1).map((colDrug, ci) => {
                  if (ci < ri) {
                    return <td key={colDrug} />;
                  }
                  if (rowDrug === colDrug) return <td key={colDrug} />;
                  const sev = getWorst(rowDrug, colDrug);
                  const style = SEVERITY_LABEL[sev];
                  const interaction = getInteraction(rowDrug, colDrug);
                  return (
                    <td key={colDrug}>
                      <button
                        onClick={() => interaction && setSelected(selected?.drugA === interaction.drugA && selected?.drugB === interaction.drugB ? null : interaction)}
                        style={{
                          width: 64, height: 36, borderRadius: 6,
                          background: style.bg, color: style.color,
                          border: `1px solid ${style.color}40`,
                          cursor: interaction ? "pointer" : "default",
                          fontSize: 11, fontWeight: 700,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          transition: "all 0.15s",
                        }}
                        title={interaction?.description}
                      >
                        {style.zh}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
        {(["contraindicated", "major", "moderate", "minor", "none"] as const).map(sev => {
          const s = SEVERITY_LABEL[sev];
          return (
            <div key={sev} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: s.bg, border: `1px solid ${s.color}40` }} />
              <span style={{ fontSize: 11, color: "var(--pro-text-muted)" }}>
                {s.zh} {sev !== "none" ? `(${sev})` : "(無交互)"}
              </span>
            </div>
          );
        })}
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="pro-card" style={{ marginTop: 16, padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{
              padding: "3px 10px", borderRadius: 5, fontSize: 12, fontWeight: 700,
              background: SEVERITY_LABEL[selected.severity].bg,
              color: SEVERITY_LABEL[selected.severity].color,
            }}>
              {SEVERITY_LABEL[selected.severity].zh}
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--pro-text)" }}>
              {selected.drugA} × {selected.drugB}
            </span>
          </div>
          <p style={{ fontSize: 13, color: "var(--pro-text-muted)", lineHeight: 1.7 }}>
            {selected.description}
          </p>
        </div>
      )}

      {/* Interaction list */}
      {interactions.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--pro-text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            交互作用清單
          </div>
          {[...interactions].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]).map((i, idx) => (
            <div key={idx} className="pro-card" style={{ padding: "12px 16px", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <span style={{
                  padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, flexShrink: 0,
                  background: SEVERITY_LABEL[i.severity].bg,
                  color: SEVERITY_LABEL[i.severity].color,
                }}>
                  {SEVERITY_LABEL[i.severity].zh}
                </span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--pro-text)", marginBottom: 4 }}>
                    {i.drugA} ↔ {i.drugB}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--pro-text-muted)", lineHeight: 1.6 }}>
                    {i.description}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
