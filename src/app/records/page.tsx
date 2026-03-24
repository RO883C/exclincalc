"use client";

import { useState, useEffect } from "react";
import { getRecords, deleteRecord, type HealthRecord } from "@/lib/healthStore";
import { REFERENCE_RANGES } from "@/lib/referenceRanges";
import { Trash2, ChevronDown, ChevronUp, Brain, ScanLine, CalendarDays, ClipboardList } from "lucide-react";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("zh-TW", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

function RecordCard({ record, onDelete }: { record: HealthRecord; onDelete: () => void }) {
  const [open, setOpen] = useState(false);

  const filledKeys = Object.entries(record.data || {}).filter(([, v]) => v !== "" && v !== undefined);
  const itemMap = Object.fromEntries(REFERENCE_RANGES.map((r) => [r.key, r]));

  return (
    <div className="card mb-3">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {record.source === "scan" ? (
              <ScanLine size={16} style={{ color: "var(--accent)" }} />
            ) : (
              <Brain size={16} style={{ color: "var(--accent)" }} />
            )}
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                {record.source === "scan" ? "圖片掃描分析" : "健康數值分析"}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                <CalendarDays size={11} className="inline mr-1" />
                {formatDate(record.date)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {filledKeys.length > 0 && (
              <span className="badge">{filledKeys.length} 項</span>
            )}
            <button onClick={onDelete}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-red-500/10"
              style={{ color: "var(--text-secondary)" }}>
              <Trash2 size={14} />
            </button>
            <button onClick={() => setOpen(!open)}
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ color: "var(--text-secondary)" }}>
              {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="px-4 pb-4" style={{ borderTop: "1px solid var(--border)" }}>
          {/* Filled values */}
          {filledKeys.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 mb-3">
              {filledKeys.map(([key, val]) => {
                const item = itemMap[key];
                if (!item) return null;
                return (
                  <div key={key} className="p-2 rounded-lg text-xs"
                    style={{ background: "var(--bg-primary)" }}>
                    <p className="font-medium" style={{ color: "var(--text-primary)" }}>
                      {item.label_zh}
                    </p>
                    <p style={{ color: "var(--accent)" }}>
                      {val} {item.unit}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Symptoms */}
          {record.symptoms && (
            <div className="mb-3">
              <p className="text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                自述症狀
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-primary)" }}>
                {record.symptoms}
              </p>
            </div>
          )}

          {/* AI Result */}
          {record.aiAnalysis && (
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                AI 分析結果
              </p>
              <div className="text-xs leading-relaxed whitespace-pre-wrap p-3 rounded-lg"
                style={{ background: "var(--bg-primary)", color: "var(--text-secondary)", maxHeight: "200px", overflowY: "auto" }}>
                {record.aiAnalysis}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function RecordsPage() {
  const [records, setRecords] = useState<HealthRecord[]>([]);

  useEffect(() => {
    setRecords(getRecords());
  }, []);

  const handleDelete = (id: string) => {
    deleteRecord(id);
    setRecords(getRecords());
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            健康記錄
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            {records.length} 筆記錄 · 儲存於本機
          </p>
        </div>
        <ClipboardList size={24} style={{ color: "var(--accent)" }} />
      </div>

      {records.length === 0 ? (
        <div className="card p-12 text-center">
          <ClipboardList size={40} className="mx-auto mb-3" style={{ color: "var(--text-secondary)", opacity: 0.4 }} />
          <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
            尚無記錄
          </p>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            完成健康自查或圖片掃描後儲存，記錄會出現在這裡
          </p>
        </div>
      ) : (
        records.map((r) => (
          <RecordCard key={r.id} record={r} onDelete={() => handleDelete(r.id)} />
        ))
      )}

      <div className="mt-6 p-3 rounded-lg text-xs text-center"
        style={{ background: "var(--bg-card)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
        記錄目前儲存於瀏覽器本機。註冊帳號後可同步至雲端。
      </div>
    </div>
  );
}
