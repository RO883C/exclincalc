"use client";

import { useState, useEffect } from "react";
import { useLang } from "@/contexts/LanguageContext";
import { AlertTriangle } from "lucide-react";

export default function DisclaimerModal() {
  const { t } = useLang();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem("cc-disclaimer");
    if (!accepted) setShow(true);
  }, []);

  const accept = () => {
    localStorage.setItem("cc-disclaimer", "1");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}>
      <div className="card max-w-md w-full p-6 fade-in"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "rgba(245,158,11,0.15)" }}>
            <AlertTriangle size={20} color="#f59e0b" />
          </div>
          <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            {t.disclaimer.modalTitle}
          </h2>
        </div>

        <div className="text-sm leading-relaxed whitespace-pre-line mb-6"
          style={{ color: "var(--text-secondary)" }}>
          {t.disclaimer.modalBody}
        </div>

        <button onClick={accept} className="btn-primary w-full justify-center">
          {t.disclaimer.agree}
        </button>
      </div>
    </div>
  );
}
