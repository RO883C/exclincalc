"use client";

import { useEffect, useState } from "react";
import { Settings, Monitor, Stethoscope, Bell, Info, CheckCircle, Cloud } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

// Settings stored in localStorage
interface AppSettings {
  defaultPage: string;
  fontSize: "normal" | "large";
  compactMode: boolean;
  showPatientAge: boolean;
  defaultEncounterStep: string;
  enableNotifications: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  defaultPage: "/pro/dashboard",
  fontSize: "normal",
  compactMode: false,
  showPatientAge: true,
  defaultEncounterStep: "complaint",
  enableNotifications: true,
};

const SETTINGS_KEY = "pro_app_settings";

function loadSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(s: AppSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [synced, setSynced] = useState(false);

  // Load: Supabase first, fallback to localStorage
  useEffect(() => {
    const load = async () => {
      const local = loadSettings();
      setSettings(local);
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase.from("profiles").select("settings").eq("id", user.id).single();
        if (data?.settings && Object.keys(data.settings).length > 0) {
          const merged = { ...DEFAULT_SETTINGS, ...(data.settings as Partial<AppSettings>) };
          setSettings(merged);
          saveSettings(merged);
        }
      } catch { /* fallback to localStorage already set */ }
    };
    load();
  }, []);

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(false);
    setSynced(false);
  };

  const handleSave = async () => {
    saveSettings(settings);
    setSaved(true);
    setSynced(false);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").update({ settings }).eq("id", user.id);
        setSynced(true);
      }
    } catch { /* localStorage already saved */ }
    setTimeout(() => { setSaved(false); setSynced(false); }, 2500);
  };

  const handleReset = async () => {
    setSettings(DEFAULT_SETTINGS);
    saveSettings(DEFAULT_SETTINGS);
    setSaved(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await supabase.from("profiles").update({ settings: DEFAULT_SETTINGS }).eq("id", user.id);
    } catch { /* ignore */ }
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--pro-text)", display: "flex", alignItems: "center", gap: 8 }}>
          <Settings size={20} color="var(--pro-accent)" /> 系統設定
        </h1>
        <p style={{ fontSize: 13, color: "var(--pro-text-muted)", marginTop: 4 }}>個人化 ClinCalc Pro 使用偏好</p>
      </div>

      {/* Section: Navigation */}
      <div className="pro-card" style={{ padding: 20, marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--pro-text)", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
          <Monitor size={14} color="var(--pro-accent)" /> 導覽偏好
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--pro-text-muted)", display: "block", marginBottom: 6 }}>登入後預設頁面</label>
            <select
              value={settings.defaultPage}
              onChange={e => update("defaultPage", e.target.value)}
              className="pro-input"
              style={{ width: "100%" }}
            >
              <option value="/pro/dashboard">總覽 Dashboard</option>
              <option value="/pro/encounter">診療流程</option>
              <option value="/pro/patients">病患管理</option>
              <option value="/pro/notes">SOAP 筆記</option>
              <option value="/pro/references">參考資料庫</option>
            </select>
            <p style={{ fontSize: 11, color: "var(--pro-text-muted)", marginTop: 4 }}>設定儲存於本機及雲端，換裝置登入後自動同步</p>
          </div>
        </div>
      </div>

      {/* Section: Display */}
      <div className="pro-card" style={{ padding: 20, marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--pro-text)", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
          <Monitor size={14} color="var(--pro-accent)" /> 顯示設定
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--pro-text-muted)", display: "block", marginBottom: 6 }}>字體大小</label>
            <div style={{ display: "flex", gap: 8 }}>
              {(["normal", "large"] as const).map(size => (
                <button
                  key={size}
                  onClick={() => update("fontSize", size)}
                  style={{
                    padding: "6px 16px", borderRadius: 7, cursor: "pointer",
                    border: `1.5px solid ${settings.fontSize === size ? "var(--pro-accent)" : "var(--pro-border)"}`,
                    background: settings.fontSize === size ? "var(--pro-accent-dim)" : "transparent",
                    color: settings.fontSize === size ? "var(--pro-accent)" : "var(--pro-text-muted)",
                    fontWeight: settings.fontSize === size ? 700 : 400,
                    fontSize: size === "large" ? 15 : 13,
                  }}
                >
                  {size === "normal" ? "標準" : "大字"}
                </button>
              ))}
            </div>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <div
              onClick={() => update("compactMode", !settings.compactMode)}
              style={{
                width: 40, height: 22, borderRadius: 11, position: "relative", cursor: "pointer",
                background: settings.compactMode ? "var(--pro-accent)" : "var(--pro-border)",
                transition: "background 0.2s",
                flexShrink: 0,
              }}
            >
              <div style={{
                position: "absolute", top: 3, left: settings.compactMode ? 21 : 3,
                width: 16, height: 16, borderRadius: "50%", background: "#fff",
                transition: "left 0.2s",
              }} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--pro-text)" }}>緊湊模式</div>
              <div style={{ fontSize: 11, color: "var(--pro-text-muted)" }}>減少間距，在小螢幕上顯示更多內容</div>
            </div>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <div
              onClick={() => update("showPatientAge", !settings.showPatientAge)}
              style={{
                width: 40, height: 22, borderRadius: 11, position: "relative", cursor: "pointer",
                background: settings.showPatientAge ? "var(--pro-accent)" : "var(--pro-border)",
                transition: "background 0.2s",
                flexShrink: 0,
              }}
            >
              <div style={{
                position: "absolute", top: 3, left: settings.showPatientAge ? 21 : 3,
                width: 16, height: 16, borderRadius: "50%", background: "#fff",
                transition: "left 0.2s",
              }} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--pro-text)" }}>顯示病患年齡</div>
              <div style={{ fontSize: 11, color: "var(--pro-text-muted)" }}>在病患列表顯示計算年齡</div>
            </div>
          </label>
        </div>
      </div>

      {/* Section: Clinical */}
      <div className="pro-card" style={{ padding: 20, marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--pro-text)", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
          <Stethoscope size={14} color="var(--pro-accent)" /> 臨床偏好
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--pro-text-muted)", display: "block", marginBottom: 6 }}>診療流程預設起始步驟</label>
          <select
            value={settings.defaultEncounterStep}
            onChange={e => update("defaultEncounterStep", e.target.value)}
            className="pro-input"
            style={{ width: "100%" }}
          >
            <option value="complaint">1. 主訴</option>
            <option value="history">2. 問診</option>
            <option value="vitals">3. 生命徵象</option>
            <option value="pe">4. 身體檢查</option>
          </select>
        </div>
      </div>

      {/* Section: Notifications */}
      <div className="pro-card" style={{ padding: 20, marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--pro-text)", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
          <Bell size={14} color="var(--pro-accent)" /> 通知設定
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
          <div
            onClick={() => update("enableNotifications", !settings.enableNotifications)}
            style={{
              width: 40, height: 22, borderRadius: 11, position: "relative", cursor: "pointer",
              background: settings.enableNotifications ? "var(--pro-accent)" : "var(--pro-border)",
              transition: "background 0.2s",
              flexShrink: 0,
            }}
          >
            <div style={{
              position: "absolute", top: 3, left: settings.enableNotifications ? 21 : 3,
              width: 16, height: 16, borderRadius: "50%", background: "#fff",
              transition: "left 0.2s",
            }} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--pro-text)" }}>啟用系統通知</div>
            <div style={{ fontSize: 11, color: "var(--pro-text-muted)" }}>儲存成功、藥物交互警示等提示</div>
          </div>
        </label>
      </div>

      {/* Account section link */}
      <div className="pro-card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--pro-text)", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
          <Info size={14} color="var(--pro-accent)" /> 帳號與安全
        </div>
        <p style={{ fontSize: 13, color: "var(--pro-text-muted)", marginBottom: 10 }}>
          變更電子郵件、密碼、個人資料等帳號設定請至個人資料頁面。
        </p>
        <Link href="/pro/profile" className="pro-btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none", fontSize: 13 }}>
          前往個人資料頁面 →
        </Link>
      </div>

      {/* Save / Reset */}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button onClick={handleSave} className="pro-btn-primary" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {saved ? <><CheckCircle size={13} /> 已儲存</> : "儲存設定"}
        </button>
        {synced && (
          <span style={{ fontSize: 11, color: "#22c55e", display: "flex", alignItems: "center", gap: 4 }}>
            <Cloud size={11} /> 已同步至雲端
          </span>
        )}
        <button
          onClick={handleReset}
          style={{
            padding: "8px 18px", borderRadius: 7, border: "1px solid var(--pro-border)",
            background: "transparent", color: "var(--pro-text-muted)", cursor: "pointer", fontSize: 13,
          }}
        >
          恢復預設值
        </button>
      </div>
    </div>
  );
}
