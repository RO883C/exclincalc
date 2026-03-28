"use client";

import { useEffect } from "react";

const SETTINGS_KEY = "pro_app_settings";

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

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/**
 * Reads settings from localStorage and applies them as CSS custom properties
 * on the .pro-root element, plus data attributes for JS hooks.
 *
 * Applied effects:
 * - fontSize: "large" → sets --pro-font-scale to 1.1 (10% larger everywhere)
 * - compactMode: true → sets --pro-main-padding to 14px (instead of 24px)
 *   and --pro-card-padding-scale for tighter cards
 * - showPatientAge / enableNotifications: stored as data-* for component reads
 */
export default function ProSettingsApplier() {
  useEffect(() => {
    const s = loadSettings();
    const root = document.querySelector(".pro-root") as HTMLElement | null;
    if (!root) return;

    // Font size
    root.style.setProperty("--pro-font-scale", s.fontSize === "large" ? "1.1" : "1");
    root.style.fontSize = s.fontSize === "large" ? "15px" : "";

    // Compact mode — adjust .pro-main padding
    const main = document.querySelector(".pro-main") as HTMLElement | null;
    if (main) {
      main.style.padding = s.compactMode ? "14px" : "";
    }
    root.setAttribute("data-compact", s.compactMode ? "true" : "false");
    root.setAttribute("data-show-patient-age", s.showPatientAge ? "true" : "false");
    root.setAttribute("data-notifications", s.enableNotifications ? "true" : "false");
  }, []);

  return null;
}
