# ExClinCalc Pro — AI 驅動醫師臨床決策支援系統

> 銘傳大學生物醫學工程學系專題研究 · 雙層醫療輔助系統之**醫事端**
> 民眾端對應專案：[ClinCalc](https://github.com/RO883C/clincalc)

![Doctor Dashboard](assets/01-doctor-dashboard.png)

🌐 **線上體驗：[exclincalc.ro883c.workers.dev](https://exclincalc.ro883c.workers.dev)**（測試帳號見下方「Demo 帳號」段落）

ExClinCalc Pro 是針對基層診所工作流程設計的醫師臨床決策支援平台（CDSS）。系統將完整診所流程拆解為 **掛號 → 護理分診 → 醫師診療（SOAP 七步驟）→ 藥物交互檢查 → 藥師調配** 五個環節；醫師端的 SOAP 病歷依 20 種主訴模板自動展開引導問題，處方欄位整合 12 組關鍵藥物交互的即時警示。系統部署在 Cloudflare Workers 全球邊緣節點，月成本壓在 5 美元以內。

## 為什麼做這個專案

台灣全民健保覆蓋率達 99.9%、全國醫療院所逾 23,000 家，但**基層診所的資訊化程度落差極大** — 部分診所仍依賴紙本病歷、自製 Excel、或孤島式商用軟體。在大型醫院端有完整 HIS / EMR 系統，但中小型診所要嘛買不起、要嘛流程不合用。

同時，AI 在醫療決策支援的應用快速進展（如 Med-PaLM 2、Gemini 多模態），但兩個現實限制使其難以真正落地：

1. **法規與責任** — AI 不能取代醫師決策，最多輔助
2. **資料安全** — 醫療資料若集中在第三方雲端不可控，是合規地雷

ExClinCalc 的設計回應這兩個限制：

- **完整工作流程閉環**：不是只做病歷編輯器，是**掛號 → 分診 → SOAP → 處方 → 調配**五個環節都做，反映真實診所運作
- **資料庫層權限控制**：透過 PostgreSQL Row Level Security（**14 張表、29 條 policy**），即使前端程式有漏洞，跨使用者資料也不會被讀走
- **TOTP 強制 MFA**：所有醫事人員角色強制雙重驗證，且實作 5 次失敗鎖定
- **AI 為提示而非決策**：Gemini 用於 SOAP A/P 段建議、藥物交互敘述生成，最終決策仍由醫師按下「確認」

目標：**作為基層診所資訊化的參考實作**，並在合理的安全與合規前提下，展示 AI 整合進醫療工作流程的具體做法。

## 功能展示

| 醫師 SOAP 七步驟診療流程 | 藥物交互作用即時警示 |
|:---:|:---:|
| ![SOAP](assets/02-soap-flow.png) | ![Drug Interaction](assets/03-drug-interaction.png) |
| 20 種主訴模板自動展開引導問題，ICD-10 自動建議 | 12 組關鍵藥物交互即時警示，紅色高優先警告 |

| 護理師分診工作台 | 藥師調配工作台 |
|:---:|:---:|
| ![Nursing](assets/04-nurse-triage.png) | ![Pharmacy](assets/05-pharmacy-dispensing.png) |
| 7 項生命徵象結構化輸入，醫師端可一鍵帶入 | 處方調配確認、預計使用天數計算、雙層交互檢查 |

![Admin Analytics](assets/06-admin-analytics.png)
*管理者分析儀表板：平台使用統計、用戶活躍度、處方分布等指標*

## Demo 帳號

> ⚠️ 以下帳號僅供體驗系統流程，**請勿輸入真實病患資料**。
> *待當事人填入實際 demo 帳號 — 各角色至少各一組（doctor / nurse / pharmacist / admin）*

| 角色 | Email | 密碼 |
|---|---|---|
| 醫師 (doctor) | `_______@________` | `_______` |
| 護理師 (nurse) | `_______@________` | `_______` |
| 藥師 (pharmacist) | `_______@________` | `_______` |
| 管理員 (admin) | `_______@________` | `_______` |

醫師角色登入後請至 `/pro/security` 完成 TOTP 設定（使用 Google Authenticator 或同類 app 掃描 QR Code）。

## 核心模組（六種角色）

| 角色 | 主要工作台 | 核心功能 |
|---|---|---|
| 醫師 (doctor) | `/pro/dashboard`、`/pro/encounter`、`/pro/patients` | 儀表板、SOAP 七步驟診療、病患管理、ICD-10 自動建議 |
| 護理師 (nurse) | `/pro/nursing` | 分診工作台、輸入 7 項生命徵象 → 醫師端可一鍵帶入 |
| 藥師 (pharmacist) | `/pro/pharmacy` | 處方調配、修改處方、預計使用天數、雙層藥物交互檢查 |
| 行政 (admin_staff) | 共用使用者管理頁面 | profiles 唯讀（限同診所），由 RLS 自動過濾 |
| 管理員 (admin) | `/pro/admin/*`、`/pro/analytics` | 帳號管理、藥物 DB CRUD、健康記錄總覽、使用統計 |
| 超級管理員 (super_admin) | 同 admin | 同 admin 並可寫入醫療參考值 |

## 技術棧

- **Next.js 16** App Router + React 19 + TypeScript
- **Tailwind CSS v4**（Pro 深藍色系 design tokens）
- **Supabase**（PostgreSQL + Auth + RLS + TOTP MFA）
- **Google Gemini 1.5 Flash**（鑑別診斷、藥物交互敘述、SOAP A/P 段輔助）
- **Cloudflare Workers**（OpenNext for Cloudflare 轉接器，全球邊緣節點）
- **GitHub Actions**（自動部署、月度參考值同步、Supabase keep-alive）

## 安全性設計

### 1. PostgreSQL Row Level Security（核心防線）

兩個子系統共用同一份 PostgreSQL，**29 條 RLS policy 分散在 14 張表上**：權限檢查不寫在後端程式裡，而是直接由 PostgreSQL 在執行查詢前比對 JWT 與 policy。即使前端程式有漏洞，跨使用者資料也不會被讀走。

完整 RLS 定義見 [`supabase/complete_setup.sql`](supabase/complete_setup.sql)。

### 2. TOTP 雙重驗證（兩階段強制）

ExClinCalc 對所有 `pro` 角色強制啟用 TOTP：

- **首次登入**：[`/auth/login`](src/app/auth/login/page.tsx) 偵測 `nextLevel === "aal1"` 且 user 為 pro → 引導至 [`/pro/security?firstLogin=true`](src/app/(pro)/pro/security/page.tsx) 完成 enroll
- **每次後續登入**：[`/auth/login`](src/app/auth/login/page.tsx) 偵測 `nextLevel === "aal2"` 且當前 session `currentLevel !== "aal2"` → 跳 [`/auth/mfa-verify`](src/app/auth/mfa-verify/page.tsx) 輸入 6 位數動態碼
- **路由保護**：[`src/middleware.ts`](src/middleware.ts) 對所有 `/pro/*` 路由要求 aal2，未通過自動 redirect mfa-verify
- **5 次失敗鎖定**：mfa-verify 頁以 `sessionStorage` 計數，連續 5 次失敗鎖定 15 分鐘

實作 API：`supabase.auth.mfa.enroll / challenge / verify / unenroll / listFactors / getAuthenticatorAssuranceLevel`

### 3. 稽核日誌

`audit_logs` 表記錄登入、處方建立、SOAP 修改、藥物交互查詢、未授權嘗試等敏感操作，由 Supabase trigger 自動寫入；保留 90 天供管理員稽核。

### 4. API 金鑰管理

| 金鑰 | 存放位置 | 是否暴露至前端 |
|---|---|---|
| `GEMINI_API_KEY` | Cloudflare Workers runtime secret | ❌ |
| `SUPABASE_SERVICE_ROLE_KEY` | Cloudflare Workers runtime secret | ❌ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Build-time inline | ✅（受 RLS 保護，安全） |

所有 Gemini 呼叫透過 [`/api/pro/gemini-clinical`](src/app/api/pro/gemini-clinical/) 後端代理，前端只看到結果，看不到金鑰。

## 本地開發

### 前置需求
- Node.js 22+
- 一個 Supabase 專案
- 一個 Google AI Studio API Key

### 步驟

```bash
# 1. 安裝依賴
npm install

# 2. 建立 .env.local（範本見下方）

# 3. 初始化資料庫：在 Supabase SQL Editor 依序執行
#    supabase/complete_setup.sql       (14 張表 + 22 條基礎 RLS)
#    supabase/clinic_flow.sql          (擴充處方欄位 + 補 RLS)
#    supabase/create_patient_consents.sql
#    supabase/create_reference_pdf_links.sql
#    supabase/seed_medications.sql     (選用：30 種台灣常用藥)
#    supabase/seed_resources.sql       (選用：醫療參考資源)
#    supabase/seed_50_patients.sql     (選用：50 名模擬病患)
#    supabase/seed_today_workload.sql  (選用：今日掛號/SOAP/處方資料)

# 4. 開通管理員角色（將自己的帳號設為 admin）：
#    UPDATE profiles SET is_pro=true, pro_role='admin' WHERE id='<你的 auth uid>';

# 5. 啟動 dev server（Windows 用 webpack 避免 Turbopack WASM 問題）
npm run dev                          # macOS / Linux
npx next dev --webpack -p 3001       # Windows
# → http://localhost:3001
```

### `.env.local` 範本

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY

# Google Gemini
GEMINI_API_KEY=YOUR_GEMINI_KEY
```

> ⚠️ `.env.local` 已列入 `.gitignore`。`SUPABASE_SERVICE_ROLE_KEY` 繞過 RLS，**僅可在伺服器端使用**。

### Seed SQL 內的 Email 替換

跑 seed 前須將 `seed_50_patients.sql`、`seed_today_workload.sql` 內的 `YOUR_DOCTOR_EMAIL@example.com` 替換成你 Supabase 上實際的醫師帳號 email。

## 部署到 Cloudflare Workers

```bash
# 本地建置 + 預覽
npm run cf:build
npm run cf:preview

# 手動部署（或 push main 自動觸發 GitHub Actions）
npm run cf:deploy
```

### GitHub Repository Secrets
- `CLOUDFLARE_API_TOKEN`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Cloudflare Workers Dashboard 環境變數
- `GEMINI_API_KEY`（runtime secret）
- `SUPABASE_SERVICE_ROLE_KEY`（runtime secret）

## 主要 API 路由

| 路由 | 方法 | 功能 |
|---|---|---|
| `/api/pro/gemini-clinical` | POST | 醫師助手模式 Gemini 呼叫（含速率限制 30 req/min/IP） |
| `/api/pro/drug-interactions` | POST | 多藥物交互作用分析（靜態表 + medications.interactions[]） |
| `/api/pro/analytics` | GET | 平台統計數據（需 is_pro） |
| `/api/pro/admin/*` | POST/PUT/DELETE | 資料表 CRUD（白名單限 medications/medical_references） |
| `/api/pro/consent/invite` | POST | 產生 patient_consents 一次性權杖 |
| `/api/ping` | GET | Supabase 健康檢查（供 keep-alive workflow） |

## 自動化 Workflows

| Workflow | 觸發 | 功能 |
|---|---|---|
| `deploy.yml` | push main | 自動部署到 Cloudflare Workers |
| `keep-alive.yml` | 每 3 天 16:00 (台灣時間) | Ping Worker `/api/ping` |
| `sync-references.yml` | 每月 1 日 08:00 | 同步參考值到 `medical_references` |
| `check-versions.yml` | 每月 1 日 08:30 | 檢查 KDIGO/ADA/ACC-AHA 等指引是否有新版 |

## 學術引用

本專題撰寫於 2026 年 2 月，相關論文：

> 江家寓，《醫療輔助系統的設計與實作——以慢性腎臟病評估為核心案例之雙層健康資訊平台》，銘傳大學生物醫學工程學系專題研究，2026。

## 授權

MIT License — 學術與非商業用途自由使用。商業使用請先聯絡作者。

本系統提供之臨床建議僅供醫事人員參考，**不構成任何醫療診斷或處方**。所有臨床決策應由合格醫師依專業判斷做成，系統建議僅作輔助。
