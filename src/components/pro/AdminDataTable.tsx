"use client";

import { useState } from "react";
import { Pencil, Trash2, X, Check, Plus, Search, ChevronDown, ChevronUp } from "lucide-react";

export interface ColumnDef<T> {
  key: keyof T | string;
  label: string;
  width?: number;
  render?: (row: T) => React.ReactNode;
  editable?: boolean;
  type?: "text" | "number" | "boolean" | "textarea";
  /** Only shown in edit/detail modal, not in the table */
  modalOnly?: boolean;
}

interface AdminDataTableProps<T extends object> {
  columns: ColumnDef<T>[];
  data: T[];
  idKey?: keyof T;
  onSave: (row: T) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onAdd: () => void;
  searchKeys?: (keyof T)[];
  loading?: boolean;
  /** Function to extract a group label string from a row. When set, rows are grouped with collapsible headers. */
  groupBy?: (row: T) => string;
}

export default function AdminDataTable<T extends object>({
  columns, data, idKey = "id" as keyof T,
  onSave, onDelete, onAdd, searchKeys, loading, groupBy,
}: AdminDataTableProps<T>) {
  const [editRow, setEditRow] = useState<T | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const filtered = search.trim()
    ? data.filter(row =>
        (searchKeys || columns.map(c => c.key as keyof T)).some(k => {
          const v = row[k];
          return typeof v === "string" && v.toLowerCase().includes(search.toLowerCase());
        })
      )
    : data;

  const handleSave = async () => {
    if (!editRow) return;
    setSaving(true);
    try {
      await onSave(editRow);
      setEditRow(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await onDelete(id);
    setDeletingId(null);
  };

  const toggleGroup = (g: string) => setCollapsed(prev => ({ ...prev, [g]: !prev[g] }));

  // Columns visible in the table (not modalOnly)
  const tableCols = columns.filter(c => !c.modalOnly);
  // Columns shown in the edit modal (all editable ones, including modalOnly)
  const editableCols = columns.filter(c => c.editable !== false);

  // Group rows if groupBy is provided
  const groups: { label: string; rows: T[] }[] = groupBy
    ? (() => {
        const map = new Map<string, T[]>();
        for (const row of filtered) {
          const g = groupBy(row);
          if (!map.has(g)) map.set(g, []);
          map.get(g)!.push(row);
        }
        return Array.from(map.entries()).map(([label, rows]) => ({ label, rows }));
      })()
    : [{ label: "", rows: filtered }];

  const renderRows = (rows: T[]) =>
    rows.map(row => {
      const id = String(row[idKey]);
      return (
        <tr key={id} style={{ cursor: "pointer" }} onClick={() => setEditRow({ ...row })}>
          {tableCols.map(col => (
            <td key={String(col.key)} onClick={col.render ? e => e.stopPropagation() : undefined}>
              {col.render
                ? col.render(row)
                : <span style={{ fontSize: 12 }}>{String(row[col.key as keyof T] ?? "—")}</span>
              }
            </td>
          ))}
          <td onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", gap: 4 }}>
              <button
                onClick={() => setEditRow({ ...row })}
                style={{ background: "var(--pro-accent-dim)", color: "var(--pro-accent)", border: "none", borderRadius: 6, padding: "5px 8px", cursor: "pointer" }}
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={() => handleDelete(id)}
                disabled={deletingId === id}
                style={{ background: "var(--pro-danger-dim)", color: "var(--pro-danger)", border: "none", borderRadius: 6, padding: "5px 8px", cursor: "pointer" }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          </td>
        </tr>
      );
    });

  return (
    <>
      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 300 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--pro-text-muted)" }} />
          <input
            className="pro-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜尋..."
            style={{ paddingLeft: 32 }}
          />
        </div>
        <button className="pro-btn-primary" onClick={onAdd}>
          <Plus size={14} />
          新增
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: 32, color: "var(--pro-text-muted)" }}>載入中...</div>
      )}
      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: 32, color: "var(--pro-text-muted)" }}>無資料</div>
      )}

      {!loading && groups.map(({ label, rows }) => (
        <div key={label || "_"} style={{ marginBottom: groupBy ? 12 : 0 }}>
          {/* Group header */}
          {groupBy && label && (
            <button
              onClick={() => toggleGroup(label)}
              style={{
                display: "flex", alignItems: "center", gap: 8, width: "100%",
                padding: "8px 12px", marginBottom: collapsed[label] ? 0 : 4,
                background: "var(--pro-bg)", border: "1px solid var(--pro-border)",
                borderRadius: collapsed[label] ? 8 : "8px 8px 0 0",
                cursor: "pointer", textAlign: "left",
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--pro-text)", flex: 1 }}>{label}</span>
              <span style={{ fontSize: 11, color: "var(--pro-text-muted)", marginRight: 4 }}>{rows.length} 筆</span>
              {collapsed[label] ? <ChevronDown size={14} color="var(--pro-text-muted)" /> : <ChevronUp size={14} color="var(--pro-text-muted)" />}
            </button>
          )}

          {/* Table */}
          {!collapsed[label] && (
            <div style={{ overflowX: "auto", borderRadius: groupBy ? "0 0 8px 8px" : 10, border: "1px solid var(--pro-border)", borderTop: groupBy ? "none" : undefined }}>
              <table className="pro-table">
                {!groupBy && (
                  <thead>
                    <tr>
                      {tableCols.map(col => (
                        <th key={String(col.key)} style={{ width: col.width }}>{col.label}</th>
                      ))}
                      <th style={{ width: 80 }}>操作</th>
                    </tr>
                  </thead>
                )}
                {groupBy && (
                  <thead>
                    <tr>
                      {tableCols.map(col => (
                        <th key={String(col.key)} style={{ width: col.width, fontSize: 11 }}>{col.label}</th>
                      ))}
                      <th style={{ width: 80, fontSize: 11 }}>操作</th>
                    </tr>
                  </thead>
                )}
                <tbody>
                  {renderRows(rows)}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}

      <div style={{ marginTop: 8, fontSize: 12, color: "var(--pro-text-muted)", textAlign: "right" }}>
        共 {filtered.length} 筆{search ? `（篩選自 ${data.length} 筆）` : ""}
      </div>

      {/* Edit Modal — avoids horizontal scroll entirely */}
      {editRow && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 200,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        }}>
          <div style={{
            background: "var(--pro-sidebar)", border: "1px solid var(--pro-border)",
            borderRadius: 12, width: "100%", maxWidth: 520,
            maxHeight: "90vh", overflow: "auto",
          }}>
            {/* Modal header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px 20px", borderBottom: "1px solid var(--pro-border)",
              position: "sticky", top: 0, background: "var(--pro-sidebar)", zIndex: 1,
            }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: "var(--pro-text)" }}>編輯資料</span>
              <button onClick={() => setEditRow(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--pro-text-muted)" }}>
                <X size={18} />
              </button>
            </div>

            {/* Fields */}
            <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
              {editableCols.map(col => (
                <div key={String(col.key)}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--pro-text-muted)", marginBottom: 5 }}>
                    {col.label}
                  </label>
                  {col.type === "boolean" ? (
                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={Boolean(editRow[col.key as keyof T])}
                        onChange={e => setEditRow(prev => prev ? { ...prev, [col.key]: e.target.checked } : prev)}
                      />
                      <span style={{ fontSize: 13, color: "var(--pro-text)" }}>{col.label}</span>
                    </label>
                  ) : col.type === "textarea" ? (
                    <textarea
                      className="pro-input"
                      value={String(editRow[col.key as keyof T] ?? "")}
                      onChange={e => setEditRow(prev => prev ? { ...prev, [col.key]: e.target.value } : prev)}
                      rows={3}
                      style={{ width: "100%", resize: "vertical" }}
                    />
                  ) : (
                    <input
                      className="pro-input"
                      type={col.type === "number" ? "number" : "text"}
                      value={String(editRow[col.key as keyof T] ?? "")}
                      onChange={e => setEditRow(prev => prev ? {
                        ...prev,
                        [col.key]: col.type === "number" ? Number(e.target.value) : e.target.value,
                      } : prev)}
                      style={{ width: "100%" }}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{
              display: "flex", gap: 8, padding: "14px 20px",
              borderTop: "1px solid var(--pro-border)",
              position: "sticky", bottom: 0, background: "var(--pro-sidebar)",
            }}>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "9px", borderRadius: 7, border: "none", cursor: "pointer",
                  background: "var(--pro-accent)", color: "#fff", fontSize: 13, fontWeight: 600,
                  opacity: saving ? 0.6 : 1,
                }}
              >
                <Check size={14} />
                {saving ? "儲存中..." : "確認儲存"}
              </button>
              <button
                onClick={() => setEditRow(null)}
                style={{
                  padding: "9px 18px", borderRadius: 7, border: "1px solid var(--pro-border)",
                  background: "transparent", color: "var(--pro-text-muted)", cursor: "pointer", fontSize: 13,
                }}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
