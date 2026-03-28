"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, Plus, Lightbulb, CheckCircle2 } from "lucide-react";
import {
  EXAM_PACKAGES,
  COMPLAINT_SUGGESTIONS,
  suggestNextPackages,
  type ExamPackage,
} from "@/lib/pro/taiwanFamilyMedicine";

interface Props {
  complaint: string;
  labData: Record<string, string>;
  addedIds: string[];           // currently active package IDs
  onAdd: (keys: string[]) => void;
  onAddId: (id: string) => void;
}

const STAGE_LABELS: Record<number, { label: string; desc: string; color: string }> = {
  1: { label: "Stage 1", desc: "基本評估", color: "#3b82f6" },
  2: { label: "Stage 2", desc: "代謝篩檢", color: "#f97316" },
  3: { label: "Stage 3", desc: "器官功能", color: "#06b6d4" },
  4: { label: "Stage 4", desc: "特定系統", color: "#8b5cf6" },
};

export default function ExamProgressGuide({ complaint, labData, addedIds, onAdd, onAddId }: Props) {
  const [expanded, setExpanded] = useState(true);
  const [selectedStage, setSelectedStage] = useState<1 | 2 | 3 | 4 | null>(null);

  // Suggestions based on complaint
  const complaintKey = Object.keys(COMPLAINT_SUGGESTIONS).find((k) =>
    complaint && k.split("/").some((part) => complaint.includes(part))
  );
  const suggestion = complaintKey ? COMPLAINT_SUGGESTIONS[complaintKey] : null;
  const suggestedIds = suggestion?.packages ?? EXAM_PACKAGES.filter((p) => p.stage === 1).map((p) => p.id);

  // Auto-suggest based on current data
  const autoSuggest = useMemo(
    () => suggestNextPackages(labData, addedIds),
    [labData, addedIds]
  );

  const stageGroups = ([1, 2, 3, 4] as const).map((s) => ({
    stage: s,
    meta: STAGE_LABELS[s],
    packages: EXAM_PACKAGES.filter((p) => p.stage === s),
  }));

  const handleAdd = (pkg: ExamPackage) => {
    onAdd(pkg.keys);
    onAddId(pkg.id);
  };

  // Compute fill progress per package
  const fillRate = (pkg: ExamPackage) => {
    const filled = pkg.keys.filter((k) => labData[k] !== "" && labData[k] !== undefined).length;
    return { filled, total: pkg.keys.length };
  };

  return (
    <div style={{
      border: "1px solid var(--pro-border)",
      borderRadius: 10,
      marginBottom: 16,
      overflow: "hidden",
      background: "var(--pro-card)",
    }}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 16px", background: "none", border: "none", cursor: "pointer",
          borderBottom: expanded ? "1px solid var(--pro-border)" : "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Lightbulb size={15} color="var(--pro-accent)" />
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--pro-text)" }}>
            漸進式檢查引導
          </span>
          {addedIds.length > 0 && (
            <span style={{
              padding: "1px 8px", borderRadius: 10, fontSize: 11, fontWeight: 700,
              background: "var(--pro-accent-dim)", color: "var(--pro-accent)",
            }}>
              {addedIds.length} 套組已選
            </span>
          )}
        </div>
        {expanded ? <ChevronUp size={14} color="var(--pro-text-muted)" /> : <ChevronDown size={14} color="var(--pro-text-muted)" />}
      </button>

      {expanded && (
        <div style={{ padding: "14px 16px" }}>
          {/* Complaint suggestion */}
          {suggestion && (
            <div style={{
              padding: "8px 12px", borderRadius: 7, marginBottom: 12,
              background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.2)",
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--pro-accent)", marginBottom: 3 }}>
                依主訴「{complaintKey}」建議套組
              </div>
              <div style={{ fontSize: 11, color: "var(--pro-text-muted)" }}>{suggestion.note}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
                {suggestion.priority.map((id) => {
                  const pkg = EXAM_PACKAGES.find((p) => p.id === id);
                  if (!pkg) return null;
                  const added = addedIds.includes(id);
                  return (
                    <button
                      key={id}
                      onClick={() => !added && handleAdd(pkg)}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        padding: "3px 10px", borderRadius: 5, fontSize: 11, fontWeight: 600,
                        background: added ? "var(--pro-accent-dim)" : "rgba(59,130,246,0.15)",
                        color: added ? "var(--pro-accent)" : "#93c5fd",
                        border: "1px solid rgba(59,130,246,0.3)",
                        cursor: added ? "default" : "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      {added ? <CheckCircle2 size={10} /> : <Plus size={10} />}
                      {pkg.icon} {pkg.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Auto-suggest based on data */}
          {autoSuggest.length > 0 && (
            <div style={{
              padding: "8px 12px", borderRadius: 7, marginBottom: 12,
              background: "rgba(234,179,8,0.07)", border: "1px solid rgba(234,179,8,0.25)",
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#ca8a04", marginBottom: 6 }}>
                💡 根據目前數據，建議加入：
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {autoSuggest.map((pkg) => (
                  <button
                    key={pkg.id}
                    onClick={() => handleAdd(pkg)}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      padding: "3px 10px", borderRadius: 5, fontSize: 11, fontWeight: 600,
                      background: "rgba(234,179,8,0.12)", color: "#ca8a04",
                      border: "1px solid rgba(234,179,8,0.3)", cursor: "pointer",
                    }}
                  >
                    <Plus size={10} /> {pkg.icon} {pkg.label}
                    <span style={{ fontSize: 9, opacity: 0.8 }}>· {pkg.rationale.substring(0, 15)}…</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stage tabs */}
          <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
            {stageGroups.map(({ stage, meta }) => {
              const stageAdded = EXAM_PACKAGES.filter((p) => p.stage === stage && addedIds.includes(p.id)).length;
              const stageTotal = EXAM_PACKAGES.filter((p) => p.stage === stage).length;
              return (
                <button
                  key={stage}
                  onClick={() => setSelectedStage(selectedStage === stage ? null : stage)}
                  style={{
                    flex: 1, padding: "5px 4px", borderRadius: 6, fontSize: 10, fontWeight: 700,
                    border: `1px solid ${selectedStage === stage ? meta.color : "var(--pro-border)"}`,
                    background: selectedStage === stage ? `${meta.color}15` : "transparent",
                    color: selectedStage === stage ? meta.color : "var(--pro-text-muted)",
                    cursor: "pointer", transition: "all 0.15s", textAlign: "center" as const,
                  }}
                >
                  <div>{meta.label}</div>
                  <div style={{ fontSize: 9, marginTop: 1 }}>{meta.desc}</div>
                  {stageAdded > 0 && (
                    <div style={{ fontSize: 9, color: meta.color, marginTop: 1 }}>
                      {stageAdded}/{stageTotal}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Package list for selected stage */}
          {selectedStage && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {stageGroups
                .find((g) => g.stage === selectedStage)
                ?.packages.map((pkg) => {
                  const added = addedIds.includes(pkg.id);
                  const { filled, total } = fillRate(pkg);
                  const pct = total > 0 ? Math.round((filled / total) * 100) : 0;
                  return (
                    <div
                      key={pkg.id}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "8px 12px", borderRadius: 7,
                        background: added ? `${pkg.color}0d` : "var(--pro-bg)",
                        border: `1px solid ${added ? pkg.color + "40" : "var(--pro-border)"}`,
                        transition: "all 0.15s",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                          <span style={{ fontSize: 13 }}>{pkg.icon}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--pro-text)" }}>{pkg.label}</span>
                          <span style={{ fontSize: 10, color: "var(--pro-text-muted)" }}>({pkg.labelEn})</span>
                        </div>
                        <div style={{ fontSize: 10, color: "var(--pro-text-muted)", marginBottom: added ? 5 : 0 }}>
                          {pkg.rationale}
                        </div>
                        {added && total > 0 && (
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{
                              flex: 1, height: 3, borderRadius: 2,
                              background: "var(--pro-border)", overflow: "hidden",
                            }}>
                              <div style={{
                                height: "100%", borderRadius: 2,
                                width: `${pct}%`,
                                background: pct === 100 ? "#22c55e" : pkg.color,
                                transition: "width 0.3s",
                              }} />
                            </div>
                            <span style={{ fontSize: 10, color: "var(--pro-text-muted)" }}>
                              {filled}/{total} 已填
                            </span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => !added && handleAdd(pkg)}
                        disabled={added}
                        style={{
                          marginLeft: 10, padding: "4px 10px", borderRadius: 5,
                          fontSize: 11, fontWeight: 700, cursor: added ? "default" : "pointer",
                          border: added ? "none" : `1px solid ${pkg.color}`,
                          background: added ? `${pkg.color}20` : "transparent",
                          color: added ? pkg.color : pkg.color,
                          display: "flex", alignItems: "center", gap: 4,
                          transition: "all 0.15s",
                          flexShrink: 0,
                        }}
                      >
                        {added ? <><CheckCircle2 size={11} /> 已加入</> : <><Plus size={11} /> 加入</>}
                      </button>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
