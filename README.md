# ExClinCalc Pro — AI 驅動醫師臨床決策支援系統

> **版本：** 1.0.0　｜　**更新日期：** 2026-03-27　｜　**語言：** 繁體中文

---

## 目錄

1. [專案概述](#1-專案概述)
2. [系統架構](#2-系統架構)
3. [技術棧](#3-技術棧)
4. [功能模組詳述](#4-功能模組詳述)
5. [資料庫設計](#5-資料庫設計)
6. [API 路由說明](#6-api-路由說明)
7. [目錄結構](#7-目錄結構)
8. [環境設定與安裝](#8-環境設定與安裝)
9. [本機測試步驟](#9-本機測試步驟)
10. [部署說明](#10-部署說明)
11. [安全性設計](#11-安全性設計)

---

## 1. 專案概述

**ExClinCalc Pro** 是一套專為**領有執照的醫師**設計的 AI 輔助臨床決策支援平台（Clinical Decision Support System, CDSS）。系統整合 Google Gemini 2.5 Flash 大型語言模型，提供以下核心能力：

| 核心能力 | 說明 |
|---------|------|
| 即時臨床分析 | 輸入 30+ 項檢驗數值，即時生成異常摘要、ICD-10 候選診斷碼與鑑別診斷清單 |
| AI 臨床助理 | 以臨床醫師助手模式與 Gemini 互動，使用完整醫學術語，無一般用戶免責聲明 |
| 病患管理 | 建立病患檔案、記錄歷次就診、追蹤慢性病與過敏史 |
| 藥物交互作用 | 多藥物同時輸入，矩陣視覺化顯示交互作用嚴重程度 |
| SOAP 臨床筆記 | 結構化 S/O/A/P 記錄，支援 AI 輔助生成評估與計畫段落 |
| 臨床報告列印 | 一鍵生成可列印的 HTML 格式臨床摘要報告 |
| 資料庫管理 | 管理員可直接在介面上對藥物資料庫與醫療參考值進行 CRUD 操作 |
| 數據分析 | 平台使用統計、記錄量趨勢、病患性別分布等視覺化圖表 |

### 適用對象

- 一般科、家醫科、內科醫師：日常門診輔助決策
- 住院醫師：快速查閱參考值與鑑別診斷
- 醫院資訊管理員：維護藥物資料庫與參考值資料庫
- 醫學研究人員：分析平台使用數據

---

## 2. 系統架構

```
┌─────────────────────────────────────────────────────────┐
│                     瀏覽器（醫師端）                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Next.js 16 App Router (React 19 + TypeScript)   │   │
│  │                                                  │   │
│  │  ┌────────────┐  ┌───────────────────────────┐  │   │
│  │  │  /auth/*   │  │      /(pro)/*              │  │   │
│  │  │  登入/註冊  │  │  醫師功能主體 (Protected)  │  │   │
│  │  └────────────┘  └───────────────────────────┘  │   │
│  └──────────────────────────────────────────────────┘   │
└───────────────┬─────────────────────┬───────────────────┘
                │ Supabase Client SDK  │ fetch()
                ▼                     ▼
┌──────────────────────┐  ┌──────────────────────────────┐
│   Supabase (BaaS)    │  │   Next.js API Routes          │
│                      │  │   /api/pro/*                  │
│  • PostgreSQL DB     │  │                               │
│  • Auth (JWT)        │  │  ┌──────────────────────┐    │
│  • Row Level Security│  │  │  gemini-clinical      │    │
│                      │  │  │  drug-interactions    │    │
│  Tables:             │  │  │  analytics            │    │
│  • profiles          │  │  │  admin                │    │
│  • doctor_patients   │  │  └──────────────────────┘    │
│  • clinical_records  │           │
│  • soap_notes        │           ▼
│  • medications       │  ┌─────────────────────┐
│  • medical_references│  │  Google Gemini API   │
│  • health_records    │  │  (gemini-2.5-flash)  │
│  • drug_interaction  │  └─────────────────────┘
│    _checks           │
└──────────────────────┘
```

### 核心設計原則

1. **離線優先（Offline-First）**：`referenceRanges.ts` 與 `localAnalysis.ts` 包含完整的本地分析引擎，無需呼叫 AI API 即可完成基本分析。AI 為補強層，非依賴層。

2. **路由群組隔離**：`(pro)` Route Group 擁有獨立的 layout、CSS 變數體系與身份驗證守衛，與 `/auth` 完全分離。

3. **服務端 API 閘道**：所有 AI 呼叫與資料庫寫入操作均透過 Next.js API Routes 執行，API Key 與 Service Role Key 永遠不暴露至前端。

4. **RLS 雙層防護**：Supabase Row Level Security 確保醫師只能存取自己的病患資料，管理員寫入操作需同時通過 JWT 驗證與 `pro_role = 'admin'` 條件。

---

## 3. 技術棧

### 前端

| 技術 | 版本 | 用途 |
|------|------|------|
| Next.js | 16.2.1 | 全端框架，App Router 架構 |
| React | 19.2.4 | UI 元件庫 |
| TypeScript | ^5.0 | 靜態型別，提升程式碼安全性 |
| Tailwind CSS | ^4.0 | 工具型 CSS，配合自訂 CSS 變數 |
| Framer Motion | ^12.0 | 動畫效果 |
| Lucide React | ^1.0 | 圖示庫（800+ SVG icons） |

### 後端 / 服務

| 技術 | 版本 | 用途 |
|------|------|------|
| Supabase | ^2.100 | PostgreSQL 資料庫、JWT 身份驗證、Storage |
| @supabase/ssr | ^0.9 | 伺服器端 Supabase 客戶端（Cookie 處理） |
| Google Generative AI | ^0.24 | Gemini 2.5 Flash 模型呼叫 |

### 部署

| 技術 | 用途 |
|------|------|
| Netlify | 靜態前端 + Serverless Functions 部署 |
| @netlify/plugin-nextjs | Netlify 適配 Next.js 插件 |
| GitHub Actions | 定期自動同步參考值資料到 Supabase |

### 開發工具

| 技術 | 用途 |
|------|------|
| ESLint 9 | 程式碼風格檢查 |
| PostCSS | CSS 處理管線（搭配 Tailwind v4） |

---

## 4. 功能模組詳述

### 4.1 身份驗證系統（`/auth`）

**位置：** `src/app/auth/`

| 路徑 | 檔案 | 功能 |
|------|------|------|
| `/auth/login` | `login/page.tsx` | 電子郵件／密碼登入，支援 `?redirect=` 參數 |
| `/auth/register` | `register/page.tsx` | 醫師帳號申請，送出後需管理員開通 `is_pro=true` |
| `/auth/callback` | `callback/route.ts` | Supabase 電子郵件驗證回調處理 |

**認證流程：**
```
申請帳號 → 收到驗證信 → 點擊連結 → 聯絡管理員
→ 管理員執行 SQL 開通 is_pro=true → 醫師可登入使用 Pro 功能
```

**ProAuthGuard 守衛（`src/components/pro/ProAuthGuard.tsx`）：**
所有 `/pro/*` 路由在渲染前均會執行以下檢查：
1. 確認用戶已登入（`supabase.auth.getUser()`）
2. 查詢 `profiles.is_pro = true`
3. 未通過則重定向至 `/auth/login?redirect=/pro`

---

### 4.2 總覽儀表板（`/pro/dashboard`）

**位置：** `src/app/(pro)/dashboard/page.tsx`

提供醫師登入後的工作概覽：
- **統計卡片**：管理病患數、臨床記錄數、SOAP 筆記數
- **快速操作**：一鍵跳轉新增病患、臨床分析、藥物查詢、新增筆記
- **最近病患**：最後更新的 5 位病患，快速進入詳情

---

### 4.3 病患管理（`/pro/patients`）

**位置：** `src/app/(pro)/patients/`

#### 病患列表（`patients/page.tsx`）
- 搜尋功能：按姓名、慢性病篩選
- 顯示欄位：姓名、年齡、性別、血型、慢性病標籤、過敏標籤
- 按最後更新時間排序

#### 新增病患（`patients/new/page.tsx`）
建立完整病患檔案，欄位包含：
- 基本資料：姓名、出生日期、性別、身分證（遮罩顯示）、聯絡方式、血型
- 慢性疾病標籤（預設常見疾病 + 自訂輸入）
- 過敏史標籤（藥物/食物過敏，紅色醒目標示）
- 備註

#### 病患詳情（`patients/[id]/page.tsx`）
- 個人基本資料卡片
- 過敏史警示區塊（橙色警告）
- 就診記錄時間軸（可展開每次記錄的完整 SOAP 內容）
- 關聯的 SOAP 筆記列表
- 列印最近就診報告
- 刪除病患（需二次確認）

#### 新增臨床記錄（`patients/[id]/records/new/page.tsx`）

這是系統最核心的頁面，功能最複雜：

**左側：輸入區**
- 主訴（Chief Complaint）輸入
- **快速預設按鈕**：糖尿病追蹤、高血壓追蹤、血脂追蹤、全套 CBC、肝功能、腎功能、甲狀腺
- **30+ 項檢驗數值輸入表格**（按分類展開，輸入值後自動高亮）

**右側：即時分析區**
- **危急值警示**：立即標紅顯示需緊急處理的數值
- **ICD-10 候選診斷碼**：本地分析引擎自動建議，可手動新增
- **鑑別診斷清單**：依可能性排序，含支持/反對證據
- **SOAP 編輯器**：四格分區，A/P 格可觸發 AI 輔助
- **AI 臨床分析結果**：Gemini 生成的完整臨床評估

---

### 4.4 臨床分析工具（`/pro/analysis`）

**位置：** `src/app/(pro)/analysis/page.tsx`

不需要綁定病患的獨立分析工具，適合快速查詢：
- 設定性別、年齡
- 輸入任意檢驗數值
- 即時顯示：臨床解讀、ICD-10 候選碼、鑑別診斷
- 「取得 AI 臨床分析」按鈕呼叫 Gemini 深度分析

**核心分析引擎（`src/lib/pro/clinicalAnalysis.ts`）：**

```
輸入數值 → checkAbnormal() → ICD-10 對應表 → ICD10Candidate[]
                           → buildDifferentials() → DifferentialItem[]
                           → 危急值閾值檢查 → criticalFlags[]
                           → CLINICAL_NOTES_MAP → clinicalNotes[]
```

目前已內建 ICD-10 對應的指標：
`glucose`, `hba1c`, `systolic`, `ldl`, `triglyceride`, `alt`, `ast`, `creatinine`, `egfr`, `hemoglobin`, `wbc`, `platelet`, `tsh`, `bmi`, `uric_acid`

---

### 4.5 藥物交互作用查詢（`/pro/drugs`）

**位置：** `src/app/(pro)/drugs/page.tsx`

**操作流程：**
1. 在 Token 輸入框中搜尋並新增藥物（自動補全連接 Supabase `medications` 資料表）
2. 系統即時執行兩層交互作用檢查：
   - **靜態表格**（`src/lib/pro/drugInteractions.ts`）：內建 12 組常見重要交互作用
   - **資料庫層**：對照 `medications.interactions[]` 欄位
3. 顯示**交互作用矩陣**（三角矩陣，顏色對應嚴重程度）
4. 點擊矩陣格子顯示詳細說明
5. 可觸發 AI 生成完整交互作用敘述報告

**嚴重程度分級：**
| 等級 | 顏色 | 說明 |
|------|------|------|
| contraindicated | 紅 | 禁忌，絕對不可併用 |
| major | 橙 | 重大，可能危及生命 |
| moderate | 黃 | 中度，需調整劑量或監測 |
| minor | 灰 | 輕微，臨床意義有限 |
| none | 綠 | 未發現已知交互作用 |

---

### 4.6 SOAP 臨床筆記（`/pro/notes`）

**位置：** `src/app/(pro)/notes/`

| 頁面 | 功能 |
|------|------|
| `notes/page.tsx` | 筆記列表，支援搜尋、草稿/完成篩選 |
| `notes/new/page.tsx` | 新增筆記，30秒自動儲存草稿，可關聯病患 |
| `notes/[id]/page.tsx` | 編輯既有筆記，顯示最後儲存時間 |

**SOAPEditor 元件（`src/components/pro/SOAPEditor.tsx`）：**
- 四格分區：S（主觀）、O（客觀）、A（評估）、P（計畫）
- A/P 段落提供「AI 輔助」按鈕，將 S+O 送至 Gemini 生成建議
- 即時字數計算
- 自動調整文字區高度

---

### 4.7 管理後台（`/pro/admin`）

**位置：** `src/app/(pro)/admin/`

僅 `pro_role = 'admin'` 用戶可進入，頁面進入時再次驗證角色。

#### 藥物資料庫管理（`admin/medications/page.tsx`）

操作對象：Supabase `medications` 資料表

| 功能 | 說明 |
|------|------|
| 查看 | 搜尋、排序所有藥物記錄 |
| 新增 | 表單填入藥物完整資訊（中英文名、學名、分類、用途、副作用、劑量、交互作用） |
| 編輯 | 列內直接點擊欄位修改（inline editing） |
| 刪除 | 確認對話後刪除（需二次確認）|

藥物資料欄位：
```
name_zh / name_en / generic_name / category
uses_zh / side_effects_zh / common_dosage / warnings_zh
interactions[] / prescription_required
```

#### 醫療參考值資料庫管理（`admin/references/page.tsx`）

操作對象：Supabase `medical_references` 資料表

- 所有與 `src/lib/referenceRanges.ts` 相同的欄位
- **「從本地同步」功能**：將程式碼中的 `REFERENCE_RANGES` 陣列 upsert 到資料庫，初始化或重設資料時使用
- 可修改危急值閾值（`warning_high` / `warning_low`）

#### 健康記錄總覽（`admin/records/page.tsx`）

唯讀介面，用於監控平台使用狀況：
- 按類型（手動/掃描）和日期範圍篩選
- 用戶 ID 自動遮罩（只顯示前 8 碼 + 後 4 碼）
- 點擊展開查看完整 JSON 數據與 AI 分析結果
- 分頁瀏覽（每頁 25 筆）

---

### 4.8 數據分析（`/pro/analytics`）

**位置：** `src/app/(pro)/analytics/page.tsx`

統計資料透過 `/api/pro/analytics` 從 Supabase 聚合計算，以純 SVG 橫條圖呈現（無第三方圖表庫）：

| 圖表 | 資料來源 | 說明 |
|------|---------|------|
| 統計卡片 | `profiles`, `health_records` | 總用戶數、總記錄數、手動/掃描各佔比 |
| 近期記錄量 | `health_records` | 過去 8 週每週記錄筆數趨勢 |
| 病患性別分布 | `doctor_patients` | 醫師管理的病患性別比例 |
| 記錄類型佔比 | `health_records` | 手動輸入 vs 掃描記錄的比例長條 |
| 藥物資料庫分類 | `medications` | 各分類藥物數量 |

---

### 4.9 臨床報告列印

**位置：** `src/lib/pro/reportExport.ts` + `src/components/pro/PrintReportButton.tsx`

`generateClinicalReportHTML()` 產生完整的自包含 HTML 字串，包含：
- 病患基本資料卡片（姓名、年齡、性別、血型、過敏史、慢性病）
- SOAP 四段落（S/O/A/P）
- 客觀數據表格（所有輸入的檢驗值）
- ICD-10 診斷碼色塊
- AI 臨床輔助分析框
- 醫師簽名區（姓名 + 所屬機構）
- 列印日期與免責說明

`printReport()` 開啟新視窗並觸發瀏覽器列印對話框。

---

## 5. 資料庫設計

### 5.1 資料表結構

#### `profiles`（用戶資料，延伸自 Supabase auth.users）
```sql
id              uuid PRIMARY KEY (= auth.users.id)
name            text
is_pro          boolean DEFAULT false       -- Pro 功能開關
pro_role        text DEFAULT 'doctor'       -- 'doctor' | 'admin'
institution     text                        -- 所屬醫療機構
license_number  text                        -- 醫師執照號碼
```

#### `doctor_patients`（醫師管理的病患）
```sql
id                 uuid PRIMARY KEY
doctor_id          uuid → auth.users(id)    -- 管理此病患的醫師
full_name          text NOT NULL
date_of_birth      date
sex                text                     -- 'M' | 'F' | 'Other'
id_number          text                     -- 身分證（介面遮罩顯示）
phone / email      text
blood_type         text
allergies          text[]                   -- 過敏史陣列
chronic_conditions text[]                   -- 慢性病陣列
notes              text
created_at / updated_at  timestamptz
```

#### `clinical_records`（就診臨床記錄）
```sql
id               uuid PRIMARY KEY
patient_id       uuid → doctor_patients(id)
doctor_id        uuid → auth.users(id)
visit_date       date DEFAULT today
chief_complaint  text
subjective       text                       -- SOAP S
objective        jsonb                      -- SOAP O：檢驗數值 key-value
assessment       text                       -- SOAP A
plan             text                       -- SOAP P
icd10_codes      text[]                     -- 診斷碼陣列
ai_analysis      text                       -- Gemini 分析結果
created_at       timestamptz
```

#### `soap_notes`（獨立 SOAP 筆記草稿）
```sql
id          uuid PRIMARY KEY
doctor_id   uuid → auth.users(id)
patient_id  uuid → doctor_patients(id)     -- 可為 NULL（不綁定病患）
title       text
subjective / objective / assessment / plan  text
draft       boolean DEFAULT true
created_at / updated_at  timestamptz
```

#### `medications`（藥物資料庫）
```sql
id                    uuid PRIMARY KEY
name_zh / name_en     text NOT NULL
generic_name          text
category              text
uses_zh / uses_en     text
side_effects_zh       text
common_dosage         text
warnings_zh           text
interactions          text[]               -- 交互作用藥物名稱陣列
prescription_required boolean DEFAULT true
source                text
updated_at            timestamptz
```

#### `medical_references`（醫療參考值）
```sql
id              uuid PRIMARY KEY
key             text UNIQUE              -- 對應 referenceRanges.ts 的 key
label_zh / label_en  text NOT NULL
unit            text NOT NULL
explanation_zh  text NOT NULL
normal_general / normal_male / normal_female  jsonb   -- {min, max}
warning_high / warning_low  numeric      -- 危急值閾值
category        text                     -- blood/liver/kidney/metabolism/vitals/body/thyroid/tumor
source          text
updated_at      timestamptz
```

### 5.2 Row Level Security (RLS) 政策

| 資料表 | 讀取 | 寫入 |
|--------|------|------|
| `profiles` | 本人 | 本人 |
| `doctor_patients` | `doctor_id = auth.uid()` | `doctor_id = auth.uid()` |
| `clinical_records` | `doctor_id = auth.uid()` | `doctor_id = auth.uid()` |
| `soap_notes` | `doctor_id = auth.uid()` | `doctor_id = auth.uid()` |
| `medications` | 所有人 | 僅 `is_pro=true AND pro_role='admin'` |
| `medical_references` | 所有人 | 僅 `is_pro=true AND pro_role='admin'` |
| `health_records` | `user_id = auth.uid()` 或 `is_pro=true` | `user_id = auth.uid()` |

---

## 6. API 路由說明

所有 Pro API 位於 `src/app/api/pro/`，每個路由均需通過身份驗證與 Pro 資格驗證。

### `POST /api/pro/gemini-clinical`

**功能：** 以臨床醫師助手模式呼叫 Gemini AI

**請求 Body：**
```json
{
  "type": "clinical",
  "patientContext": "Patient: 王大明, Sex: M, Age: 58, Chronic: 高血壓, Allergies: 青黴素",
  "labData": "Fasting Glucose: 138 mg/dL, HbA1c: 7.2%, LDL-C: 145 mg/dL",
  "symptoms": "多尿、口渴、視力模糊",
  "soapDraft": "S: 病患主訴近三個月體重下降 5 公斤\nO: FG 138, HbA1c 7.2%"
}
```

**System Prompt 特色：** 使用完整醫學術語，提供鑑別診斷、建議檢查、治療考量，無一般用戶免責聲明。

---

### `POST /api/pro/drug-interactions`

**功能：** 多藥物交互作用分析

**請求 Body：**
```json
{
  "drugs": ["Warfarin", "Aspirin", "Omeprazole"],
  "patientId": "optional-uuid"
}
```

**回應：**
```json
{
  "pairs": [
    {
      "drugA": "Warfarin",
      "drugB": "Aspirin",
      "severity": "major",
      "description": "Concurrent use significantly increases bleeding risk..."
    }
  ],
  "aiNarrative": "完整的 Gemini 臨床藥物交互作用分析..."
}
```

---

### `GET /api/pro/analytics`

**功能：** 取得平台統計數據（需 `is_pro=true`）

**回應欄位：** `totalUsers`, `totalRecords`, `totalManual`, `totalScan`, `weeklyVolume[]`, `sexDistribution[]`, `topMedicationCategories[]`

---

### `POST/PUT/DELETE /api/pro/admin`

**功能：** 資料庫 CRUD（需 `pro_role='admin'`）

**操作對象：** `medications` 或 `medical_references` 資料表（白名單限制）

**請求 Body（POST）：**
```json
{
  "table": "medications",
  "row": { "name_zh": "阿斯匹林", "name_en": "Aspirin", ... },
  "upsert": false
}
```

---

## 7. 目錄結構

```
exclinclac/                          # 專案根目錄
├── src/
│   ├── app/
│   │   ├── (pro)/                   # Pro 功能路由群組
│   │   │   ├── layout.tsx           # Pro 版面（含 ProAuthGuard）
│   │   │   ├── pro.css              # Pro 深藍 CSS 變數體系
│   │   │   ├── page.tsx             # redirect("/pro/dashboard")
│   │   │   ├── dashboard/           # 總覽儀表板
│   │   │   ├── patients/
│   │   │   │   ├── page.tsx         # 病患列表
│   │   │   │   ├── new/             # 新增病患
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx     # 病患詳情
│   │   │   │       └── records/new/ # 新增臨床記錄
│   │   │   ├── analysis/            # 臨床分析工具
│   │   │   ├── drugs/               # 藥物交互作用查詢
│   │   │   ├── notes/               # SOAP 筆記（列表/新增/編輯）
│   │   │   ├── admin/
│   │   │   │   ├── page.tsx         # 管理後台入口（需 admin 角色）
│   │   │   │   ├── medications/     # 藥物 CRUD
│   │   │   │   ├── references/      # 參考值 CRUD
│   │   │   │   └── records/         # 健康記錄唯讀總覽
│   │   │   └── analytics/           # 數據分析
│   │   ├── api/
│   │   │   └── pro/
│   │   │       ├── gemini-clinical/ # AI 臨床分析 API
│   │   │       ├── drug-interactions/ # 藥物交互作用 API
│   │   │       ├── analytics/       # 統計數據 API
│   │   │       └── admin/           # 資料庫管理 API
│   │   ├── auth/
│   │   │   ├── login/               # 登入頁（Pro 深藍風格）
│   │   │   ├── register/            # 申請帳號頁
│   │   │   └── callback/            # Email 驗證回調
│   │   ├── layout.tsx               # Root layout（極簡，class="dark"）
│   │   ├── page.tsx                 # redirect("/pro")
│   │   └── globals.css              # 全域 CSS 變數與基礎樣式
│   ├── components/
│   │   └── pro/
│   │       ├── ProAuthGuard.tsx     # 身份驗證守衛元件
│   │       ├── ProSidebar.tsx       # 左側導覽欄
│   │       ├── ProTopBar.tsx        # 頂部麵包屑導覽列
│   │       ├── ProStatCard.tsx      # 統計卡片元件
│   │       ├── AdminDataTable.tsx   # 通用 CRUD 資料表元件
│   │       ├── ClinicalMetricForm   # （內嵌於頁面，非獨立元件）
│   │       ├── ICD10Table.tsx       # ICD-10 候選碼表格（含複製）
│   │       ├── SOAPEditor.tsx       # SOAP 四格編輯器
│   │       ├── DrugTokenInput.tsx   # 藥物 Tag 輸入（自動補全）
│   │       ├── InteractionMatrix.tsx # 藥物交互作用三角矩陣
│   │       └── PrintReportButton.tsx # 列印報告按鈕
│   └── lib/
│       ├── pro/
│       │   ├── clinicalAnalysis.ts  # 臨床分析引擎（ICD-10, 鑑別診斷）
│       │   ├── drugInteractions.ts  # 藥物交互作用靜態表 + 檢查邏輯
│       │   ├── patientUtils.ts      # 病患工具函數（年齡計算等）
│       │   └── reportExport.ts      # 臨床報告 HTML 生成與列印
│       ├── referenceRanges.ts       # 30+ 項醫療參考值定義（本地資料庫）
│       ├── localAnalysis.ts         # 離線分析引擎
│       ├── supabase.ts              # Supabase 瀏覽器客戶端
│       └── supabase-server.ts       # Supabase 伺服器客戶端（SSR）
└── supabase/
    ├── health_records.sql           # 健康記錄資料表建立腳本
    ├── medications.sql              # 藥物 + 參考值資料表建立腳本
    ├── seed_medications.sql         # 30+ 種藥物初始資料
    └── pro_schema.sql               # Pro 功能新增資料表與 RLS 政策
```

---

## 8. 環境設定與安裝

### 8.1 前置需求

- Node.js 18.0 以上
- npm 9.0 以上
- Supabase 帳號（免費方案即可）
- Google AI Studio 帳號（取得 Gemini API Key）

### 8.2 Supabase 設定

**步驟一：建立 Supabase 專案**
1. 至 [supabase.com](https://supabase.com) 建立新專案
2. 記錄以下資訊（設定頁 → API）：
   - `Project URL`（即 `NEXT_PUBLIC_SUPABASE_URL`）
   - `anon` public key（即 `NEXT_PUBLIC_SUPABASE_ANON_KEY`）
   - `service_role` secret key（即 `SUPABASE_SERVICE_ROLE_KEY`，勿公開）

**步驟二：執行 SQL 腳本（依序）**

在 Supabase Dashboard → SQL Editor 中依序執行：
```
1. supabase/health_records.sql
2. supabase/medications.sql
3. supabase/seed_medications.sql    （可選：初始藥物資料）
4. supabase/pro_schema.sql
```

**步驟三：建立 profiles 觸發器**

確認 Supabase 已建立 `profiles` 資料表的 `on_auth_user_created` 觸發器（通常預設已建立）。若無，執行：
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (new.id, new.raw_user_meta_data->>'name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**步驟四：開通管理員帳號**

先正常申請帳號完成 Email 驗證後，在 SQL Editor 執行：
```sql
-- 查詢自己的 auth uid
SELECT id, email FROM auth.users WHERE email = 'your@email.com';

-- 開通 Pro 管理員權限
UPDATE profiles
SET is_pro = true, pro_role = 'admin', institution = '您的醫療機構'
WHERE id = '<auth-uid-from-above>';
```

### 8.3 Gemini API Key

1. 至 [Google AI Studio](https://aistudio.google.com) 建立 API Key
2. 免費方案限制：每分鐘 15 次請求、每日 1500 次請求（Gemini 2.5 Flash）

### 8.4 建立環境變數

在專案根目錄建立 `.env.local`：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase Service Role（僅限伺服器端使用，勿前綴 NEXT_PUBLIC_）
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Gemini AI
GEMINI_API_KEY=AIzaSy...
```

> ⚠️ **安全提示：** `.env.local` 已列入 `.gitignore`，切勿提交至版本控制系統。`SUPABASE_SERVICE_ROLE_KEY` 擁有繞過 RLS 的完整資料庫存取權限，僅可在伺服器端 API Routes 中使用。

### 8.5 安裝依賴

```bash
npm install
```

---

## 9. 本機測試步驟

### 9.1 啟動開發伺服器

```bash
npm run dev
```

開啟瀏覽器訪問 [http://localhost:3000](http://localhost:3000)，會自動重定向至 `/pro`，未登入則跳轉至 `/auth/login`。

### 9.2 測試流程（建議順序）

#### 第一步：帳號建立與開通
1. 訪問 `http://localhost:3000/auth/register`
2. 填入姓名、電子郵件、密碼（8字元以上）
3. 檢查信箱點擊驗證連結
4. 在 Supabase SQL Editor 執行開通指令（見 8.2 步驟四）
5. 訪問 `http://localhost:3000/auth/login` 登入

#### 第二步：基本功能測試
```
登入後自動進入 /pro/dashboard
→ 查看統計卡片（初始均為 0）

→ /pro/patients/new 新增測試病患
   填入：姓名「測試病患甲」、出生日期、性別男
   新增慢性病：高血壓、糖尿病
   新增過敏：青黴素

→ /pro/patients 確認病患列表出現

→ 點擊病患 → /pro/patients/[id]
   點擊「新增記錄」→ /pro/patients/[id]/records/new
   輸入數值：
     glucose: 145, hba1c: 7.8, systolic: 155, diastolic: 95
   觀察右側即時出現：
     ✓ ICD-10 候選碼（E11, I10）
     ✓ 鑑別診斷（第2型糖尿病、高血壓）
   點擊「AI 輔助」生成 SOAP A/P
   點擊「儲存記錄」
```

#### 第三步：藥物交互作用測試
```
→ /pro/drugs
   在輸入框輸入「Warfarin」→ 新增
   輸入「阿斯匹林」→ 新增
   觀察矩陣出現橙色「重大」交互作用
   點擊格子查看詳情
   點擊「取得 AI 詳細交互作用分析」
```

#### 第四步：管理後台測試（需 admin 角色）
```
→ /pro/admin/medications
   點擊「新增」→ 填入藥物資料 → 儲存
   找到剛新增的記錄 → 點擊編輯圖示 → 修改 → 確認
   點擊刪除圖示 → 確認刪除

→ /pro/admin/references
   點擊「從本地同步」將 referenceRanges.ts 資料寫入 DB
   確認資料表出現 30+ 筆參考值

→ /pro/analytics
   查看各項統計圖表
```

#### 第五步：SOAP 筆記測試
```
→ /pro/notes/new
   設定標題「測試筆記」
   在 S 欄輸入：「病患主訴頭痛、頸部僵硬三天」
   在 O 欄輸入：「體溫 38.5°C，血壓 145/90」
   點擊 A 欄的「AI 輔助」按鈕
   等待 AI 生成評估與計畫建議
   儲存為草稿或完成
```

### 9.3 常見問題排查

| 問題 | 可能原因 | 解決方式 |
|------|---------|---------|
| 登入後跳回 `/auth/login` | `profiles.is_pro` 未設為 true | 執行 SQL 開通指令 |
| AI 按鈕無反應 | `GEMINI_API_KEY` 未設定 | 檢查 `.env.local` |
| 資料庫操作報錯 403 | RLS 政策問題 | 確認 `pro_schema.sql` 已完整執行 |
| 管理後台報錯 403 | `pro_role` 非 admin | 執行 SQL 設定 `pro_role='admin'` |
| 統計數據顯示錯誤 | `SUPABASE_SERVICE_ROLE_KEY` 未設定 | 使用 anon key 時某些聚合查詢可能受 RLS 限制 |
| 藥物搜尋無結果 | medications 資料表為空 | 執行 `seed_medications.sql` |

### 9.4 建置與生產環境測試

```bash
# 建置
npm run build

# 本機模擬生產環境
npm run start
```

---

## 10. 部署說明

本專案使用 **Netlify** 部署，設定檔位於 `netlify.toml`。

### 10.1 Netlify 部署步驟

1. 將專案推送至 GitHub 倉庫
2. 在 Netlify 連結 GitHub 倉庫
3. 在 Netlify → Site Settings → Environment Variables 設定：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`
4. Netlify 自動偵測 `netlify.toml` 並完成建置

### 10.2 Supabase Auth 回調 URL 設定

在 Supabase Dashboard → Authentication → URL Configuration 新增：
```
https://your-site.netlify.app/auth/callback
```

### 10.3 CI/CD 自動同步（可選）

`.github/workflows/sync-references.yml` 設定每月自動將 `referenceRanges.ts` 的資料同步至 Supabase 的 `medical_references` 資料表。

需在 GitHub Repository Secrets 中設定：
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## 11. 安全性設計

### 11.1 API 安全

| 機制 | 實作位置 | 說明 |
|------|---------|------|
| Pro 資格驗證 | 所有 `/api/pro/*` 路由 | 每次請求均查詢 `profiles.is_pro` |
| 管理員角色驗證 | `/api/pro/admin` | 額外確認 `pro_role = 'admin'` |
| 速率限制 | `/api/pro/gemini-clinical` | 每 IP 每分鐘限 30 次（記憶體計數） |
| 輸入長度限制 | Gemini 相關 API | 最大 8000 字元 |
| 白名單資料表 | `/api/pro/admin` | 僅允許操作 `medications`, `medical_references` |

### 11.2 金鑰管理

| 金鑰 | 存放位置 | 說明 |
|------|---------|------|
| `GEMINI_API_KEY` | 環境變數（伺服器端） | 永遠不暴露至瀏覽器 |
| `SUPABASE_SERVICE_ROLE_KEY` | 環境變數（伺服器端） | 僅在 API Routes 中使用 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 可前端使用 | 受 RLS 保護，安全公開 |

### 11.3 資料隱私

- 病患身分證號在 UI 層遮罩顯示（`A123****789`）
- 健康記錄總覽中的用戶 ID 遮罩（`xxxxxxxx...xxxx`）
- 所有病患資料受 RLS 保護，醫師只能存取自己建立的病患

---

## 授權

本專案為學術研究用途，未設定開源授權。使用前請確認符合相關法規（個人資料保護法、醫療法等）。

---

*ExClinCalc Pro — 以 AI 增強臨床決策，以嚴謹設計保護病患隱私*
