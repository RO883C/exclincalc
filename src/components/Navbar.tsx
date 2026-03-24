"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun, Globe, LogIn, Home, Stethoscope, ScanLine, ClipboardList } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";

const NAV_LINKS = [
  { href: "/",        icon: Home,          zh: "首頁",   en: "Home" },
  { href: "/check",   icon: Stethoscope,   zh: "自我檢測", en: "Check" },
  { href: "/scan",    icon: ScanLine,      zh: "掃描圖片", en: "Scan" },
  { href: "/records", icon: ClipboardList, zh: "記錄",   en: "Records" },
];

export default function Navbar() {
  const { locale, setLocale } = useLang();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* Disclaimer banner */}
      <div style={{
        background: "rgba(245,158,11,0.08)",
        borderBottom: "1px solid rgba(245,158,11,0.15)",
        padding: "5px 16px",
        fontSize: "11px",
        color: "#f59e0b",
        textAlign: "center",
      }}>
        ⚠️ 本平台僅供健康參考，不構成醫療診斷。如有不適請立即就醫。
        This platform is for reference only, not medical diagnosis.
      </div>

      {/* Desktop top nav */}
      <nav className="sticky top-0 z-40 hidden md:block"
        style={{
          background: "var(--nav-bg)",
          borderBottom: "1px solid var(--border)",
          backdropFilter: "blur(12px)",
        }}>
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mr-4 shrink-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm"
              style={{ background: "var(--accent)", color: "#000" }}>
              C+
            </div>
            <div className="leading-none">
              <div className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                ClinCalc
              </div>
              <div className="text-[10px]" style={{ color: "var(--text-secondary)" }}>
                精準計算臨床決策平台
              </div>
            </div>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-1 flex-1">
            {NAV_LINKS.map(({ href, icon: Icon, zh, en }) => (
              <Link key={href} href={href}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all"
                style={{
                  color: isActive(href) ? "var(--accent)" : "var(--text-secondary)",
                  background: isActive(href) ? "var(--accent-dim)" : "transparent",
                }}>
                <Icon size={14} />
                {locale === "zh" ? zh : en}
              </Link>
            ))}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={() => setLocale(locale === "zh" ? "en" : "zh")}
              className="btn-ghost text-xs px-2 py-1.5 gap-1">
              <Globe size={14} />
              {locale === "zh" ? "EN" : "中"}
            </button>
            <button onClick={toggleTheme} className="btn-ghost px-2 py-1.5">
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <Link href="/auth/login" className="btn-ghost text-xs px-3 py-1.5 gap-1">
              <LogIn size={14} />
              {locale === "zh" ? "登入" : "Login"}
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile top bar */}
      <nav className="sticky top-0 z-40 md:hidden"
        style={{
          background: "var(--nav-bg)",
          borderBottom: "1px solid var(--border)",
          backdropFilter: "blur(12px)",
        }}>
        <div className="px-4 h-13 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs"
              style={{ background: "var(--accent)", color: "#000" }}>
              C+
            </div>
            <span className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
              ClinCalc
            </span>
          </Link>
          <div className="flex items-center gap-1">
            <button onClick={() => setLocale(locale === "zh" ? "en" : "zh")}
              className="btn-ghost text-xs px-2 py-1 gap-1">
              <Globe size={13} />
              {locale === "zh" ? "EN" : "中"}
            </button>
            <button onClick={toggleTheme} className="btn-ghost px-2 py-1">
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
        style={{
          background: "var(--nav-bg)",
          borderTop: "1px solid var(--border)",
          backdropFilter: "blur(12px)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}>
        <div className="grid grid-cols-4">
          {NAV_LINKS.map(({ href, icon: Icon, zh, en }) => {
            const active = isActive(href);
            return (
              <Link key={href} href={href}
                className="flex flex-col items-center gap-1 py-2 px-1 transition-all"
                style={{ color: active ? "var(--accent)" : "var(--text-secondary)" }}>
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                <span style={{ fontSize: "10px", fontWeight: active ? 700 : 400 }}>
                  {locale === "zh" ? zh : en}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
