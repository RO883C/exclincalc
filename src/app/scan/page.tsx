"use client";

import { useState, useRef, useCallback } from "react";
import {
  ScanLine, Camera, Upload, Send, Copy, Check,
  Trash2, AlertCircle, X, ImagePlus, Languages, ArrowLeftRight
} from "lucide-react";
import Image from "next/image";
import { useLang } from "@/contexts/LanguageContext";
import { saveRecord } from "@/lib/healthStore";

type Mode = "scan" | "translate";

export default function ScanPage() {
  const { locale } = useLang();
  const [mode, setMode] = useState<Mode>("scan");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [question, setQuestion] = useState("");
  const [translateText, setTranslateText] = useState("");
  const [translateDir, setTranslateDir] = useState<"zh2en" | "en2zh">("zh2en");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) { setError("請上傳圖片檔案"); return; }
    if (file.size > 10 * 1024 * 1024) { setError("圖片不能超過 10MB"); return; }
    setImageFile(file);
    setError("");
    setResult("");
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const submitScan = async () => {
    if (!imageFile) return;
    setLoading(true); setError(""); setResult("");
    try {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve((e.target?.result as string).split(",")[1]);
        reader.readAsDataURL(imageFile);
      });
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "scan",
          imageBase64: base64,
          imageMimeType: imageFile.type,
          question: question || undefined,
        }),
      });
      const data = await res.json();
      if (data.error) setError("辨識失敗，請稍後再試");
      else setResult(data.result);
    } catch {
      setError("辨識失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  const submitTranslate = async () => {
    if (!translateText.trim()) return;
    setLoading(true); setError(""); setResult("");
    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "translate", text: translateText, direction: translateDir }),
      });
      const data = await res.json();
      if (data.error) setError("翻譯失敗，請稍後再試");
      else setResult(data.result);
    } catch {
      setError("翻譯失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    saveRecord({ date: new Date().toISOString(), source: "scan", aiAnalysis: result, data: {} });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const clear = () => {
    setImageFile(null); setImagePreview(""); setQuestion("");
    setTranslateText(""); setResult(""); setError("");
  };

  const isReady = mode === "scan" ? !!imageFile : !!translateText.trim();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
          掃描與翻譯
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          上傳體檢報告、處方箋或藥品圖片，AI 自動辨識並解讀
        </p>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-6"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <button
          onClick={() => { setMode("scan"); setResult(""); setError(""); }}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all"
          style={{
            background: mode === "scan" ? "var(--accent)" : "transparent",
            color: mode === "scan" ? "#000" : "var(--text-secondary)",
          }}>
          <ScanLine size={15} /> 圖片掃描 / OCR
        </button>
        <button
          onClick={() => { setMode("translate"); setResult(""); setError(""); }}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all"
          style={{
            background: mode === "translate" ? "var(--accent)" : "transparent",
            color: mode === "translate" ? "#000" : "var(--text-secondary)",
          }}>
          <Languages size={15} /> 醫療翻譯
        </button>
      </div>

      {/* ── SCAN MODE ── */}
      {mode === "scan" && (
        <>
          {!imagePreview ? (
            <div
              className="rounded-xl border-2 border-dashed p-8 mb-4 transition-all"
              style={{
                borderColor: dragging ? "var(--accent)" : "var(--border)",
                background: dragging ? "var(--accent-dim)" : "var(--bg-card)",
              }}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}>
              <div className="flex flex-col items-center gap-4">
                <ImagePlus size={40} style={{ color: "var(--text-secondary)" }} />
                <div className="text-center">
                  <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                    上傳報告圖片
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    支援 JPG、PNG、WEBP（最大 10MB）
                  </p>
                </div>
                <div className="flex gap-2">
                  {/* Upload from gallery */}
                  <button onClick={() => fileInputRef.current?.click()}
                    className="btn-ghost gap-2 text-sm">
                    <Upload size={15} /> 從相簿選擇
                  </button>
                  {/* Camera capture (mobile) */}
                  <button onClick={() => cameraInputRef.current?.click()}
                    className="btn-primary gap-2 text-sm">
                    <Camera size={15} /> 拍照
                  </button>
                </div>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
              {/* Camera capture - mobile */}
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </div>
          ) : (
            <div className="relative mb-4 rounded-xl overflow-hidden"
              style={{ border: "1px solid var(--border)" }}>
              <Image src={imagePreview} alt="Report" width={800} height={600}
                className="w-full object-contain" style={{ maxHeight: "400px" }} />
              <button onClick={clear}
                className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "rgba(0,0,0,0.6)" }}>
                <X size={14} color="#fff" />
              </button>
            </div>
          )}

          <div className="mb-4">
            <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--text-secondary)" }}>
              您想了解什麼？（選填）
            </label>
            <input type="text" className="input-field"
              value={question} onChange={(e) => setQuestion(e.target.value)}
              placeholder="例：哪些數值異常？這個藥是做什麼的？請翻譯成中文" />
          </div>
        </>
      )}

      {/* ── TRANSLATE MODE ── */}
      {mode === "translate" && (
        <>
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => setTranslateDir("zh2en")}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: translateDir === "zh2en" ? "var(--accent)" : "var(--bg-card)",
                color: translateDir === "zh2en" ? "#000" : "var(--text-secondary)",
                border: "1px solid var(--border)",
              }}>
              繁中 → 英文
            </button>
            <ArrowLeftRight size={14} style={{ color: "var(--text-secondary)" }} />
            <button onClick={() => setTranslateDir("en2zh")}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: translateDir === "en2zh" ? "var(--accent)" : "var(--bg-card)",
                color: translateDir === "en2zh" ? "#000" : "var(--text-secondary)",
                border: "1px solid var(--border)",
              }}>
              英文 → 繁中
            </button>
          </div>
          <textarea className="input-field mb-4" rows={8}
            value={translateText} onChange={(e) => setTranslateText(e.target.value)}
            placeholder="貼上需要翻譯的醫療文字、藥品說明、報告內容..." />
        </>
      )}

      {/* Submit */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={mode === "scan" ? submitScan : submitTranslate}
          disabled={loading || !isReady}
          className="btn-primary"
          style={{ opacity: loading || !isReady ? 0.6 : 1 }}>
          {loading ? (
            <>
              <span className="loading-dot" />
              <span className="loading-dot" style={{ animationDelay: "0.2s" }} />
              <span className="loading-dot" style={{ animationDelay: "0.4s" }} />
              <span className="ml-2">{mode === "scan" ? "辨識中..." : "翻譯中..."}</span>
            </>
          ) : (
            <>
              <Send size={15} />
              {mode === "scan" ? "開始分析" : "開始翻譯"}
            </>
          )}
        </button>
        {(imageFile || result || translateText) && (
          <button onClick={clear} className="btn-ghost">
            <Trash2 size={14} /> 清除
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-lg mb-4 fade-in"
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <AlertCircle size={16} color="var(--danger)" />
          <span className="text-sm" style={{ color: "var(--danger)" }}>{error}</span>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="card p-5 fade-in">
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
              {mode === "scan" ? "AI 分析結果" : "翻譯結果"}
            </span>
            <div className="flex gap-2">
              <button onClick={copy} className="btn-ghost text-xs px-2 py-1 gap-1">
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? "已複製" : "複製"}
              </button>
              <button onClick={handleSave} className="btn-ghost text-xs px-2 py-1 gap-1"
                style={{ color: saved ? "var(--accent)" : undefined }}>
                {saved ? <Check size={13} /> : null}
                {saved ? "已儲存" : "儲存"}
              </button>
            </div>
          </div>
          <div className="text-sm leading-relaxed whitespace-pre-wrap"
            style={{ color: "var(--text-secondary)" }}>
            {result}
          </div>
          <div className="mt-4 pt-3 text-xs"
            style={{ borderTop: "1px solid var(--border)", color: "var(--warning)" }}>
            ⚠️ 以上為 AI 參考資訊，不構成醫療診斷。如有疑慮請就醫。
          </div>
        </div>
      )}
    </div>
  );
}
