# ClinCalc 專案內部文件 (Internal Map)

> 快速定位專案功能與檔案位置。更新時請同步修改此文件。

---

## 專案結構總覽

```
clincalc/
├── src/
│   ├── app/                    # Next.js App Router 頁面
│   ├── components/             # 共用元件
│   ├── contexts/               # React Context（主題、語言）
│   └── lib/                    # 工具函數、資料庫、AI
├── .env.local                  # 環境變數（不上 Git）
├── netlify.toml                # Netlify 部署設定
└── IM.md                       # 本文件
```

---

## 頁面地圖 (`src/app/`)

| 路由 | 檔案 | 功能說明 |
|------|------|---------|
| `/` | `page.tsx` | 首頁 Landing Page，功能介紹 + CTA |
| `/dashboard` | `dashboard/page.tsx` | 登入後首頁，顯示用戶名稱 + 功能入口 |
| `/check` | `check/page.tsx` | **健康自查** — 完整體檢數值表單 + 本地分析 + AI 分析 |
| `/scan` | `scan/page.tsx` | **掃描報告** — 圖片上傳/拍照 + Gemini OCR + 醫療翻譯 |
| `/records` | `records/page.tsx` | **健康記錄** — 歷史查詢列表（localStorage → Supabase） |
| `/auth/login` | `auth/login/page.tsx` | 登入頁 — Supabase email/password 登入 |
| `/auth/register` | `auth/register/page.tsx` | 註冊頁 — 含免責聲明確認 checkbox |
| `/auth/callback` | `auth/callback/route.ts` | Email 驗證 callback（Supabase OAuth flow） |
| `/analyze` | `analyze/page.tsx` | ⛔ 已廢棄，重定向至 `/check` |
| `/translate` | `translate/page.tsx` | ⛔ 已廢棄，重定向至 `/scan` |

---

## API 路由 (`src/app/api/`)

| 路由 | 檔案 | 功能說明 |
|------|------|---------|
| `POST /api/gemini` | `api/gemini/route.ts` | Gemini AI 代理 — 保護 API Key，處理三種模式 |

### Gemini API 三種模式 (`type` 參數)
- `analyze` — 健康數值分析，輸入 `text`
- `translate` — 醫療翻譯，輸入 `text` + `direction`（`zh2en`/`en2zh`）
- `scan` — 圖片 OCR 分析，輸入 `imageBase64` + `imageMimeType` + 可選 `question`

---

## 元件 (`src/components/`)

| 檔案 | 功能說明 |
|------|---------|
| `Navbar.tsx` | 頂部導航列 + 行動版底部 Nav（首頁/自查/掃描/記錄） |
| `DisclaimerModal.tsx` | 首次進入顯示的全螢幕免責聲明 Modal（localStorage 記錄已同意） |

---

## Context (`src/contexts/`)

| 檔案 | 功能說明 | 用法 |
|------|---------|------|
| `ThemeContext.tsx` | 深色/淺色主題切換 | `const { theme, toggle } = useTheme()` |
| `LanguageContext.tsx` | 中英雙語切換 | `const { locale, t } = useLang()` |

---

## 工具函數庫 (`src/lib/`)

| 檔案 | 功能說明 |
|------|---------|
| `supabase.ts` | **Supabase 瀏覽器客戶端** — `createClient()` 用於 Client Components |
| `supabase-server.ts` | **Supabase 伺服器客戶端** — `createServerSupabaseClient()` 用於 Server Components / API Routes |
| `referenceRanges.ts` | **醫療參考值資料庫** — 所有指標的正常範圍、單位、中文解說（未來可換成 Supabase 查詢） |
| `localAnalysis.ts` | **本地數據分析引擎** — 不依賴 AI，用 referenceRanges 比對數值，產生分析報告 |
| `healthStore.ts` | **本地健康記錄存取** — localStorage CRUD（Phase 1 暫存，Phase 2 換成 Supabase） |
| `i18n.ts` | 翻譯字串定義（中/英） |
| `utils.ts` | 通用工具函數 |

---

## Supabase 資料庫結構

| 表格 | 欄位 | 說明 |
|------|------|------|
| `profiles` | `id, name, gender, date_of_birth, language` | 用戶個人資料，id = auth.users.id |
| `health_records` | `id, user_id, type, data(jsonb), ai_analysis, created_at` | 健康記錄，type = `manual`/`scan`/`analyze` |

### RLS 政策
- `profiles`：用戶只能讀寫自己的資料
- `health_records`：用戶只能操作自己的記錄
- 新用戶註冊時，Trigger `on_auth_user_created` 自動建立 profile

---

## 環境變數

| 變數名 | 用途 | 位置 |
|--------|------|------|
| `GEMINI_API_KEY` | Gemini AI API Key | Server only（不可 `NEXT_PUBLIC_`） |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 專案 URL | Client + Server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Publishable Key | Client + Server（RLS 保護） |

---

## 樣式系統 (`src/app/globals.css`)

### CSS 變數（深/淺色主題自動切換）
```css
--bg-base        背景色
--bg-card        卡片背景
--border         邊框色
--accent         主色調（青綠 #00D4AA）
--text-primary   主要文字
--text-secondary 次要文字
--warning        警告色（黃）
--danger         危險色（紅）
```

### 共用 CSS Class
```css
.card            標準卡片樣式
.btn-primary     主要按鈕
.btn-ghost       次要按鈕
.input-field     輸入框
.fade-in         淡入動畫
.loading-dot     載入動畫點
```

---

## 開發指令

```bash
cd D:\Clinclac\clincalc
npm run dev          # 啟動開發伺服器 http://localhost:3000
npm run build        # 建置生產版本
npm run lint         # 程式碼檢查
```

---

## 部署

- **平台**：Netlify（連接 GitHub `yu8812/ClinCalc` main branch）
- **自動部署**：Push 到 main → Netlify 自動重新部署
- **環境變數**：Netlify → Site settings → Environment variables
- **設定檔**：`netlify.toml`（使用 `@netlify/plugin-nextjs`）

---

## 工具腳本 (`scripts/`)

| 檔案 | 執行方式 | 說明 |
|------|---------|------|
| `sync-references.mjs` | `node scripts/sync-references.mjs` | 將 `referenceRanges.ts` 同步至 Supabase `medical_references` 表 |

**GitHub Action 自動排程：** `.github/workflows/sync-references.yml`
- 每月 1 日台灣時間 08:00 自動執行
- 可在 GitHub Actions 頁面手動觸發
- 需要 GitHub Secrets：`SUPABASE_URL`、`SUPABASE_SERVICE_KEY`

---

## Supabase 資料表（完整）

| 表格 | 說明 | RLS |
|------|------|-----|
| `profiles` | 用戶個人資料 | 僅本人讀寫 |
| `health_records` | 健康記錄（manual/scan/analyze） | 僅本人 |
| `medications` | 藥物資料庫（~30+ 種常見藥） | 公開讀取 |
| `medical_references` | 醫療參考值（可替換本地 JSON） | 公開讀取 |

### 建表 SQL 位置
- `supabase/medications.sql` — 建表語法
- `supabase/seed_medications.sql` — 種子資料（常見藥物）

---

## 待開發 (TODO)

- [ ] 健康記錄從 localStorage 遷移至 Supabase `health_records`
- [ ] `/profile` 個人設定頁面（修改姓名、性別、生日）
- [ ] Navbar 顯示登入狀態（已登入顯示頭像/登出）
- [ ] 藥物查詢頁面（搜尋藥名、查看副作用、交互作用）
- [ ] 執行 `supabase/medications.sql` 和 `seed_medications.sql` 建立藥物資料庫
- [ ] 設定 GitHub Secrets（`SUPABASE_SERVICE_KEY`）啟用自動同步
- [ ] 共用醫療參考值資料庫與 exclinclac 專案整合
