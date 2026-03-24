"use client";

import { useState } from "react";
import { Brain, Send, Copy, Check, Trash2, AlertCircle } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";

export default function AnalyzePage() {
  const { t } = useLang();
  const ta = t.analyze;

  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const submit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError("");
    setResult("");

    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "analyze", text }),
      });
      const data = await res.json();

      if (data.error === "NO_API_KEY") {
        setError(ta.noKey);
      } else if (data.error) {
        setError(ta.error);
      } else {
        setResult(data.result);
      }
    } catch {
      setError(ta.error);
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">

      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "var(--accent-dim)", color: "var(--accent)" }}>
          <Brain size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            {ta.title}
          </h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {ta.subtitle}
          </p>
        </div>
      </div>

      <div className="h-px my-6" style={{ background: "var(--border)" }} />

      {/* Input */}
      <div className="mb-4">
        <textarea
          className="input-field"
          rows={8}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={ta.placeholder}
        />
      </div>

      <div className="flex items-center gap-2 mb-8">
        <button
          onClick={submit}
          disabled={loading || !text.trim()}
          className="btn-primary"
          style={{ opacity: loading || !text.trim() ? 0.6 : 1 }}>
          {loading ? (
            <>
              <span className="loading-dot" />
              <span className="loading-dot" style={{ animationDelay: "0.2s" }} />
              <span className="loading-dot" style={{ animationDelay: "0.4s" }} />
              <span className="ml-2">{ta.submitting}</span>
            </>
          ) : (
            <>
              <Send size={15} />
              {ta.submit}
            </>
          )}
        </button>

        {text && (
          <button onClick={() => { setText(""); setResult(""); setError(""); }}
            className="btn-ghost">
            <Trash2 size={14} />
            {t.common.clear}
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-lg mb-6 fade-in"
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <AlertCircle size={16} color="var(--danger)" />
          <span className="text-sm" style={{ color: "var(--danger)" }}>{error}</span>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="card p-6 fade-in">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Brain size={16} style={{ color: "var(--accent)" }} />
              <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                {ta.result}
              </span>
            </div>
            <button onClick={copy} className="btn-ghost text-xs px-2 py-1 gap-1">
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? t.common.copied : t.common.copy}
            </button>
          </div>

          <div className="text-sm leading-relaxed whitespace-pre-wrap"
            style={{ color: "var(--text-secondary)" }}>
            {result}
          </div>

          <div className="mt-4 pt-4 text-xs" style={{ borderTop: "1px solid var(--border)", color: "var(--warning)" }}>
            ⚠️ {t.common.aiDisclaimer}
          </div>
        </div>
      )}
    </div>
  );
}
