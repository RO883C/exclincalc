# ClinCalc 精準計算臨床決策平台 — 專案內部文件 (Internal Map)

> 版本：2026-03 ｜ 技術棧：Next.js + TypeScript + Supabase + Google Gemini API + Netlify
>
> 本文件供開發者快速定位功能與檔案，同時作為論文撰寫參考。**IM.md 本身不上 Git。**

---

## 一、系統定位與目標

ClinCalc 是一個雙層架構的醫療健康資訊平台：

| 層次 | 使用族群 | 主要功能 |
|------|---------|---------|
| **Consumer 層**（`/`） | 一般民眾 | 健康自查、體檢數值分析、藥物查詢、報告掃描 |
| **Pro 層**（`/pro`） | 醫師、藥師、護理師等醫事人員 | 電子門診記錄、病患管理、SOAP 病歷、臨床決策輔助 |

### 核心設計原則

1. **離線優先（Offline-first）**：本地參考值資料庫 + 本地分析引擎，無需網路即可執行基本分析
2. **AI 輔助（AI-assisted）**：Google Gemini API 提供深度解讀，為補充層而非必要依賴
3. **資料主權**：未登入用戶資料存 localStorage，登入後可一鍵同步至 Supabase 雲端
4. **免責優先**：所有分析頁面強制顯示免責聲明，AI 輸出明確標示非醫療診斷
5. **角色授權**：Pro 模組依角色（醫師、藥師、護理師、行政、管理員、超級管理員）分配功能與資料存取權

---

## 二、整體架構

```
使用者瀏覽器
  ↓
Next.js App Router（Netlify Edge）
  ├── Client Components → Supabase JS SDK（anon key，RLS 保護）
  ├── Server API Routes /api/* → 伺服器端邏輯（Gemini API key 不洩露）
  └── Static Assets（本地醫療參考值、臨床決策庫）
                    ↓
           Supabase PostgreSQL
           ├── auth.users           ← Supabase Auth
           ├── profiles             ← 用戶個人資料 + Pro 角色
           ├── health_records       ← 民眾健康記錄
           ├── medications          ← 藥物資料庫
           ├── medical_references   ← 醫療參考值
           ├── doctor_patients      ← 醫師管理的病患
           ├── clinical_records     ← SOAP 門診病歷
           ├── soap_notes           ← SOAP 草稿
           └── drug_interaction_checks ← 藥物交互作用記錄
```

---

## 三、專案目錄結構

```
exclinclac/
├── src/
│   ├── app/
│   │   ├── (pro)/pro/              ← Pro 模組頁面（需登入 + is_pro）
│   │   │   ├── layout.tsx          ← Pro 側欄 + 導航
│   │   │   ├── page.tsx            ← Pro 首頁（儀表板）
│   │   │   ├── encounter/          ← 門診診療流程（7步驟）
│   │   │   ├── patients/           ← 病患管理（列表、新增、詳情）
│   │   │   ├── analytics/          ← 數據分析儀表板（A/B/C/D/E 5 項指標）
│   │   │   ├── references/         ← 臨床參考資料庫（書籍/指引/文章，重複偵測）
│   │   │   ├── exam/               ← 檢驗工作台
│   │   │   ├── profile/            ← 個人資料（Email 變更、密碼修改）
│   │   │   ├── settings/           ← 系統偏好設定（localStorage 本機儲存）
│   │   │   └── admin/
│   │   │       ├── page.tsx        ← 管理員後台首頁
│   │   │       ├── users/          ← 帳號管理（角色、授權）
│   │   │       ├── records/        ← 全平台記錄管理
│   │   │       ├── medications/    ← 藥物資料庫管理
│   │   │       └── references/     ← 醫療參考資料管理
│   │   ├── api/
│   │   │   ├── gemini/             ← Gemini AI 代理
│   │   │   └── pro/
│   │   │       ├── analytics/      ← 統計資料 API
│   │   │       ├── admin/users/    ← 帳號管理 CRUD API
│   │   │       ├── gemini-clinical/← 臨床 AI 分析
│   │   │       └── drug-interactions/ ← 藥物交互作用檢查
│   │   ├── page.tsx                ← 首頁 Landing
│   │   ├── dashboard/              ← 一般用戶首頁
│   │   ├── check/                  ← 健康自查（簡單 / 詳細）
│   │   ├── scan/                   ← 圖片掃描 + OCR
│   │   ├── records/                ← 健康記錄歷史
│   │   ├── meds/                   ← 藥物查詢
│   │   ├── profile/                ← 個人設定
│   │   └── auth/                   ← 登入 / 註冊 / Callback
│   ├── components/
│   │   ├── pro/
│   │   │   ├── ProStatCard.tsx     ← 統計卡片
│   │   │   └── AdminDataTable.tsx  ← 管理員資料表格（含 modal 編輯）
│   │   ├── Navbar.tsx
│   │   └── DisclaimerModal.tsx
│   └── lib/
│       ├── pro/
│       │   ├── clinicalFlow.ts     ← 台灣家醫科臨床流程資料庫
│       │   └── taiwanFamilyMedicine.ts ← 台灣健保檢驗套組 + 規則引擎
│       ├── supabase.ts             ← Supabase 瀏覽器端
│       ├── supabase-server.ts      ← Supabase 伺服器端
│       ├── referenceRanges.ts      ← 醫療參考值（本地 JSON）
│       ├── localAnalysis.ts        ← 本地即時分析引擎
│       ├── healthStore.ts          ← localStorage + Supabase 雙層讀寫
│       └── i18n.ts                 ← 中英翻譯
├── supabase/
│   ├── health_records.sql          ← 基礎資料表
│   ├── medications.sql             ← 藥物 + 參考值資料表
│   ├── pro_schema.sql              ← Pro 模組所有資料表
│   └── seed_medications.sql        ← 藥物種子資料
└── IM.md                           ← 本文件（不上 Git）
```

---

## 四、Consumer 層頁面地圖

| 路由 | 功能說明 | 需登入 |
|------|---------|--------|
| `/` | 首頁 Landing，功能介紹 + CTA | 否 |
| `/dashboard` | 登入後首頁，四大功能入口 | 是 |
| `/check` | 健康自查入口（簡單 / 詳細選擇） | 否 |
| `/check/simple` | 簡單自查：症狀勾選 + AI 緊急度四級評估 | 否 |
| `/check/detail` | 詳細分析：30+ 體檢數值 + 本地即時分析 + AI 深度解讀 | 否 |
| `/scan` | 掃描報告：圖片 OCR / 相機 / 醫療翻譯 | 否 |
| `/records` | 健康記錄歷史（localStorage + 雲端） | 否 |
| `/meds` | 藥物查詢 | 否 |
| `/profile` | 個人設定 | 是 |
| `/auth/login` | 登入 | — |
| `/auth/register` | 註冊 | — |

---

## 五、Pro 層頁面地圖

所有 Pro 頁面需要 `is_pro = true`，部分功能需特定角色。

### 醫師功能

| 路由 | 功能說明 | 最低角色 |
|------|---------|---------|
| `/pro` | Pro 首頁儀表板，快速入口卡片 | 任意 Pro |
| `/pro/encounter` | **門診診療流程**（7 步驟見下方） | doctor |
| `/pro/patients` | 病患列表（搜尋、篩選） | doctor |
| `/pro/patients/new` | 新增病患 | doctor |
| `/pro/patients/[id]` | 病患詳情（病歷、SOAP 記錄、列印） | doctor |
| `/pro/references` | 醫療文獻/教科書資料庫 | 任意 Pro |
| `/pro/exam` | 檢驗工作台（輸入數值、即時判讀、NHI 規則） | doctor |
| `/pro/analytics` | 數據分析儀表板 | 任意 Pro |
| `/pro/profile` | 個人資料（Email 變更、密碼修改） | 任意 Pro |
| `/pro/settings` | 系統偏好設定（導覽、顯示、臨床預設） | 任意 Pro |

### 管理員功能

| 路由 | 功能說明 | 最低角色 |
|------|---------|---------|
| `/pro/admin` | 管理後台入口 | admin |
| `/pro/admin/users` | 帳號管理（授權、角色、刪除、重設密碼） | admin |
| `/pro/admin/records` | 全平台記錄管理 | admin |
| `/pro/admin/medications` | 藥物資料庫維護（含 source 來源欄位） | admin |
| `/pro/admin/references` | 醫療參考資料維護（來源可顯示為連結） | admin |

---

## 六、門診診療流程（Encounter）

路由：`/pro/encounter`

模擬台灣家醫科門診的標準化七步驟流程：

```
步驟 1 主訴（Complaint）
  → 多選主訴（COMPLAINT_TEMPLATES 17種）
  → 選擇後自動載入對應問診模板、檢驗套組建議、紅旗警示

步驟 2 問診（History）
  → OPQRST 系統性問診（依主訴動態調整問題）
  → 系統回顧（ROS）互動式三態切換：未詢問 / 有(+) / 無(−)

步驟 3 生命徵象（Vitals）
  → BP（收縮/舒張）、HR、RR、體溫、SpO₂、體重、身高
  → 自動計算 BMI

步驟 4 身體檢查（Physical Exam）
  → 依主訴預選系統（胸腔、腹部、神經系統等）
  → 各系統預設發現 + 自由文字備註

步驟 5 選擇檢查（Labs）
  → 台灣健保常見檢驗套組（血液常規、生化、尿液等）
  → 依主訴自動勾選建議套組
  → 可直接輸入數值，Taiwan Rules 引擎即時判讀

步驟 6 診斷（Diagnosis）
  → 依主訴建議 ICD-10 診斷碼清單
  → 可多選（主診斷 + 次診斷）+ 自由輸入

步驟 7 計畫（Plan）
  → 處方建議（依診斷動態篩選匹配藥物類別，★ 標示最相關）
  → 衛教材料選擇
  → 轉介建議（依紅旗症狀）
  → 自由備註
```

**儲存邏輯**：
- 病患姓名 → 寫入 `doctor_patients`（不存在時自動建立）
- 診療記錄 → 寫入 `clinical_records`（SOAP 格式）
  - `chief_complaint`：主訴
  - `subjective`：問診答案 + ROS 陽性/陰性
  - `objective`：生命徵象 + PE 發現 + 檢驗數值（jsonb）
  - `assessment`：診斷清單 + ICD-10
  - `plan`：處方 + 衛教 + 轉介 + 備註

---

## 七、臨床流程資料庫（`src/lib/pro/`）

### `clinicalFlow.ts`

提供 17 種常見主訴的完整臨床模板：

| 主訴 | 代表症狀 |
|-----|---------|
| 胸痛 | 心電圖指征、ACS 紅旗、心臟評估問題 |
| 頭痛 | SHNOUT 問診、神經警示 |
| 糖尿病/血糖問題 | 血糖管理問題、HbA1c 套組 |
| 高血壓/血壓問題 | 器官損傷評估 |
| 腹痛 | 急腹症紅旗、分區定位 |
| 感冒/上呼吸道感染 | 病程問診、細菌vs病毒區分 |
| 發燒 | 發燒特徵、感染灶評估 |
| 咳嗽 | 痰的特性、氣流阻塞問診 |
| 腹瀉/腸胃炎 | 水便次數、脫水評估 |
| 皮膚問題/皮疹 | 形態描述、接觸史 |
| 腰背痛 | 紅旗症狀（馬尾症候群）、活動度評估 |
| 泌尿道症狀 | 排尿困難、感染症狀 |
| 失眠/睡眠障礙 | 睡眠衛生評估、焦慮篩檢 |
| 心悸/心律不整 | 發作特性、Wolff-Parkinson-White 評估 |
| 呼吸困難 | 呼吸費力度、SpO₂ 判讀 |
| 貧血/疲勞 | 貧血類型問診、缺鐵評估 |
| 關節痛/痛風 | 發作部位、痛風特徵 |

每個模板包含：
- `hpiQuestions[]`：OPQRST 問診題目（text/select/multiselect/scale 四種格式）
- `rosPositives[]`：需詢問的系統回顧項目
- `labPackages[]`：建議檢驗套組 ID
- `commonDx[]`：常見診斷 + ICD-10 代碼
- `redFlags[]`：需立即注意的警示症狀
- `icon`：UI 顯示用 emoji

### `taiwanFamilyMedicine.ts`

台灣家醫科專用：

- **`EXAM_PACKAGES[]`**：16 種台灣健保常用檢驗套組（血液常規、生化八項、肝功能、腎功能等）
- **`runTaiwanRules(labValues)`**：台灣本地化判讀規則引擎，輸出異常發現列表

---

## 八、資料庫結構

### 表格一覽

| 表格 | 說明 | RLS | SQL 來源 |
|------|------|-----|---------|
| `auth.users` | Supabase Auth 帳號 | Supabase 管理 | 自動 |
| `profiles` | 個人資料 + Pro 角色 | 本人讀寫 | 介面建立 |
| `health_records` | 民眾健康記錄 | 本人讀寫 | `health_records.sql` |
| `medications` | 藥物資料庫 | 所有人可讀 | `medications.sql` |
| `medical_references` | 醫療參考值 | 所有人可讀 | `medications.sql` |
| `doctor_patients` | 醫師管理的病患資料 | 僅本醫師讀寫 | `pro_schema.sql` |
| `clinical_records` | SOAP 門診病歷（含診斷準確率欄位） | 僅本醫師讀寫 | `pro_schema.sql` |
| `soap_notes` | SOAP 草稿 | 僅本醫師讀寫 | `pro_schema.sql` |
| `drug_interaction_checks` | 藥物交互作用記錄 | 僅本醫師讀寫 | `pro_schema.sql` |
| `pro_resources` | 臨床參考資料庫（書籍/指引/文章） | 本人讀寫 | `pro_schema.sql` |

### 欄位詳細

**`profiles`**（Pro 擴展欄位）
```
is_pro          boolean   default false
pro_role        text      default 'doctor'
                          CHECK: doctor | admin | super_admin |
                                 pharmacist | nurse | admin_staff
institution     text      所屬機構
license_number  text      執照號碼
```

**`doctor_patients`**
```
id                uuid      PK
doctor_id         uuid      FK → auth.users
full_name         text      NOT NULL
date_of_birth     date
sex               text      M | F | Other
id_number         text      身分證字號
nhi_number        text      健保卡號（migration: add_nhi_number.sql）
phone             text
email             text
blood_type        text      A+|A-|B+|B-|AB+|AB-|O+|O-
allergies         text[]    過敏原清單
chronic_conditions text[]   慢性疾病清單
notes             text
created_at        timestamptz
```

**`clinical_records`**（SOAP 格式）
```
id                  uuid      PK
patient_id          uuid      FK → doctor_patients（可為 null，匿名診療）
doctor_id           uuid      FK → auth.users  NOT NULL
visit_date          date      NOT NULL  default current_date
chief_complaint     text      主訴
subjective          text      問診記錄（HPI + ROS）
objective           jsonb     客觀資料：{ vitals, bmi, pe, labs }
assessment          text      診斷（含 ICD-10）
plan                text      計畫（處方、衛教、轉介）
icd10_codes         text[]    ICD-10 代碼陣列
ai_analysis         text      AI 分析結果
diagnosis_accuracy  text      診斷準確率回饋：correct | partial | incorrect | null
created_at          timestamptz
```

**`pro_resources`**（臨床參考資料庫）
```
id          uuid      PK
title       text      NOT NULL
author      text
year        text
category    text      書籍|指引|文章|網站|影音
cover_url   text      封面圖片 URL（可用 Open Library）
url         text      外部連結
description text
source      text      來源機構/期刊
tags        text[]    標籤
is_public   boolean   公開/個人可見
created_by  uuid      FK → auth.users
created_at  timestamptz
```

---

## 九、角色授權系統

### 角色層級（由高到低）

| 角色 | 代碼 | 說明 | 顏色 |
|------|------|------|------|
| 超級管理員 | `super_admin` | 唯一可修改/刪除 admin 帳號，可指派所有角色 | 紫色 |
| 管理員 | `admin` | 可管理 doctor/pharmacist/nurse/admin_staff | 藍色 |
| 醫師 | `doctor` | 完整門診功能 | 綠色 |
| 藥劑師 | `pharmacist` | 藥物相關功能 | 黃色 |
| 護理師 | `nurse` | 護理相關功能 | 粉色 |
| 行政人員 | `admin_staff` | 行政功能 | 灰色 |

### 授權規則

- `super_admin` 帳號不可被 admin 修改或刪除
- 用戶不能修改自己的角色
- admin 只能修改非 admin、非 super_admin 的帳號
- `super_admin` 角色只有當前 super_admin 才能指派

### 初始設置（Supabase SQL Editor 執行）

```sql
-- 指派超級管理員
UPDATE profiles SET is_pro = true, pro_role = 'super_admin'
  WHERE id = (SELECT id FROM auth.users WHERE email = '00@test.com');

-- 指派一般管理員
UPDATE profiles SET is_pro = true, pro_role = 'admin'
  WHERE id = (SELECT id FROM auth.users WHERE email = 'your@email.com');
```

---

## 十、API 路由

| 路由 | 方法 | 功能 | 授權 |
|------|------|------|------|
| `/api/gemini` | POST | Gemini AI 代理（分析/翻譯/掃描） | — |
| `/api/pro/analytics` | GET | 平台統計數據 | is_pro |
| `/api/pro/admin/users` | GET | 所有用戶列表 + 統計 | admin |
| `/api/pro/admin/users` | PATCH | 更新用戶角色/授權 | admin |
| `/api/pro/admin/users` | POST | 重設密碼 | admin |
| `/api/pro/admin/users` | DELETE | 刪除帳號 | admin |
| `/api/pro/gemini-clinical` | POST | 臨床 AI 分析 | is_pro |
| `/api/pro/drug-interactions` | POST | 藥物交互作用檢查 | is_pro |

---

## 十一、數據分析儀表板（`/pro/analytics`）

統計卡片（對應論文中的指標）：

| 指標 | 說明 | 資料來源 |
|------|------|---------|
| 帳號數 | 所有 Pro 用戶總數 | `profiles` 表 count |
| 病患記錄 | 醫師管理的病患總數 | `doctor_patients` 表 count |
| 藥物資料庫 | 藥物記錄總筆數 | `medications` 表 count |
| 醫療參考值 | 參考值條目總數 | `medical_references` 表 count |
| 診斷準確率（E指標） | 加權準確率公式：(正確×1 + 部分×0.5) / 總回饋數 × 100% | `clinical_records.diagnosis_accuracy` |

**E 指標計算公式**：
```
accuracy = (correct_count + partial_count × 0.5) / total_feedback × 100
```
- 醫師在病歷詳情頁點擊 ✓正確 / △部分正確 / ✗診斷有誤 進行標記
- 統計分布：綠色（正確）/ 黃色（部分）/ 紅色（有誤）堆疊條狀圖

圖表：
- 近 8 週健康記錄量趨勢（`health_records` 按週統計）
- 病患性別分布（`doctor_patients.sex`）
- 記錄類型佔比（手動 vs 掃描）
- 診斷回饋分布（正確/部分/有誤三色比例）
- 藥物資料庫分類分布（`medications.category`）

---

## 十二、Consumer 層核心功能

### 健康自查系統

**簡單自查** (`/check/simple`)：
- 症狀快選（25 個常見症狀 chip）
- 自由描述 + 持續時間 + 不適程度滑桿
- 基本生命徵象（年齡/性別/體溫/血壓/心跳/BMI）
- Gemini AI 緊急度四級評估（🔴立即就醫 / 🟠盡快就診 / 🟡一般門診 / 🟢自我觀察）

**詳細分析** (`/check/detail`)：
- 30+ 醫療數值輸入（7 大分類）
- 即時本地分析（`localAnalysis.ts`，離線可用）
- AI 深度解讀

### 本地分析引擎（`localAnalysis.ts`）

完全離線，不消耗 API 配額：
- 輸入：數值 Map + 性別
- 輸出：異常項目清單、統計（正常/偏高/偏低）、風險標誌、建議
- 資料庫 30+ 項指標，覆蓋 8 大分類（血液、肝、腎、代謝、生命徵象、體位、甲狀腺、腫瘤指標）

### Gemini API 代理（`/api/gemini`）

| 模式 | 用途 |
|------|------|
| `analyze` | 健康數據分析 |
| `translate` | 醫療文字翻譯（中↔英）|
| `scan` | 圖片 OCR（體檢報告、藥袋）|

安全機制：Rate limiting（每 IP 每分鐘 20 次）、Retry（503 時重試 2 次）

---

## 十三、環境變數

| 變數 | 說明 | 類型 |
|------|------|------|
| `GEMINI_API_KEY` | Google Gemini API Key | Server only |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 專案 URL | Client + Server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key | Client + Server |
| `SUPABASE_SERVICE_ROLE_KEY` | Service Role Key（管理員功能用）| Server only |

---

## 十四、樣式系統

Pro 模組使用獨立 CSS 變數（`--pro-*` 前綴），定義於全域 CSS：

| 變數 | 用途 |
|------|------|
| `--pro-bg` | 主背景 |
| `--pro-surface` | 卡片背景 |
| `--pro-sidebar` | 側欄背景 |
| `--pro-border` | 邊框色 |
| `--pro-text` / `--pro-text-muted` | 文字 / 次要文字 |
| `--pro-accent` / `--pro-accent-dim` | 強調色 / 淡強調 |
| `--pro-danger` / `--pro-danger-dim` | 危險色 |
| `--pro-success` / `--pro-warning` | 成功 / 警告 |

共用 Pro Class：
- `pro-card`：卡片容器
- `pro-btn-primary` / `pro-btn-ghost`：按鈕
- `pro-input`：輸入框
- `pro-table`：資料表格
- `pro-badge`：標籤徽章

---

## 十五、部署與開發

```bash
# 開發
cd D:\exclinclac\exclincalc
npm run dev          # http://localhost:3000
npx tsc --noEmit     # TypeScript 型別檢查

# 部署平台：Netlify（Free tier）
# GitHub 倉庫：yu8812/ClinCalc，main branch
# 自動部署：Push 到 main → Netlify build（約 2~3 分鐘）
```

---

## 十六、待開發 / 已知問題

### 待實作
- [ ] 英文版翻譯補齊（i18n.ts 擴充，低優先）
- [ ] 自定義 Supabase 驗證信件範本（需在 Supabase Dashboard 手動設定，無法透過程式碼修改）

### 已完成
- [x] 健康趨勢圖表（多次記錄的數值趨勢）— 純 SVG 折線圖，顯示於病患頁右欄，含正常值綠色色帶、異常紅點、百分比變化
- [x] **Supabase 完整設定** — `complete_setup.sql` 整合所有表、RLS、trigger、index，含 profiles 建表、on_auth_user_created trigger、護理師讀取 doctor_patients policy、audit_logs 表、settings jsonb 欄位
- [x] **Bug 修正批次** — profile 密碼修改移除 signInWithPassword re-auth；藥物互動字串改單向匹配；encounter 存檔加 try-catch 顯示錯誤；encounter/exam 加 beforeunload 離頁提示
- [x] **Settings 雲端同步** — 設定寫入 profiles.settings jsonb，登入後從 Supabase 載入（fallback localStorage）
- [x] **Dashboard 自動刷新** — visibilitychange 事件觸發重新查詢
- [x] **Admin 稽核記錄** — audit_logs 表 + API route 在角色變更、刪帳號、密碼重設時自動寫入

**Consumer 層**
- [x] 首頁 + 免責聲明
- [x] 深色/淺色主題 + 中英雙語
- [x] Supabase Auth（Email 登入/註冊/驗證）
- [x] 簡單自查（症狀 + AI 緊急度）
- [x] 詳細分析（30+ 項 + 本地引擎 + AI 深度）
- [x] 圖片掃描 + 相機 + 醫療翻譯
- [x] 健康記錄（localStorage + 雲端 + 遷移）
- [x] 藥物查詢

**Pro 層 — 功能**
- [x] Pro 佈局（側欄 + 角色保護）
- [x] 門診診療流程（7 步驟完整 SOAP）
- [x] 17 種主訴模板（clinicalFlow.ts）
- [x] 多選主訴 + 動態模板同步
- [x] 互動式系統回顧（ROS 三態切換：未詢問/有/無）
- [x] 病患管理（列表、新增、詳情）
- [x] 病患名稱自動補完（門診頁）
- [x] 角色系統（6 種角色 + super_admin 層級保護）
- [x] 帳號管理（授權、角色、重設密碼、刪除）
- [x] 數據分析（帳號/病患/藥物/參考值 + E 診斷準確率）
- [x] 管理員後台（記錄、藥物、參考值管理）
- [x] E 指標：診斷準確率（clinical_records.diagnosis_accuracy）
- [x] 診斷回饋按鈕（病歷詳情 + 摺疊列頭部徽章）
- [x] 臨床參考資料庫（pro_resources，書籍/指引/文章/網站/影音）
- [x] 參考資料庫：重複偵測 + 一鍵清除重複
- [x] 參考資料庫：封面圖片失敗時行內編輯
- [x] 個人資料：Email 變更（Supabase 寄送確認信）
- [x] 系統設定頁面（/pro/settings，localStorage）
- [x] 藥物資料庫：依處方/OTC 排序 + source 來源欄位
- [x] 醫療參考值：來源欄位可顯示為可點擊連結
- [x] 臨床參考資料庫：合訂本（清單）檢視，非書籍資源依類別分組顯示
- [x] 臨床參考資料庫：來源欄位可點擊飛至連結（resource.url）
- [x] 臨床參考資料庫：版本更新檢查（KNOWN_UPDATES registry，src/lib/pro/resourceUpdates.ts）
- [x] 臨床參考資料庫：重複偵測 + 一鍵清除；封面失敗行內編輯
- [x] 藥物交互作用：從病患病歷匯入處方清單（解析 plan 欄位 處方：xxx 格式）
- [x] 藥物交互作用：批量輸入（多行/逗號分隔）
- [x] 數據分析：統計卡片可點擊導航至對應管理頁面
- [x] 管理員後台 records：改讀 clinical_records（Pro SOAP），原錯讀 health_records（Consumer）
- [x] 帳號管理：修正 PATCH upsert（原 update+count+insert 模式在 Supabase 中 count 恆為 null）
- [x] 病患資料：新增健保卡號（nhi_number）欄位（已合入 pro_schema.sql，無需另執行 migration）
- [x] 個人資料：Email 變更
- [x] 系統設定：ProSettingsApplier 在 layout 套用 fontSize / compactMode（localStorage → CSS）
- [x] ADA 2025 → ADA 2026（seed_resources.sql）
- [x] 藥物資料庫 source 種子資料補充（seed_medications.sql 全部 31 筆加入來源欄位）
- [x] Analytics 頁 AI 摘要分析按鈕（Gemini 解讀平台統計，紫色漸層按鈕，結果可關閉）
- [x] 藥師工作台（/pro/pharmacy）：藥物查詢、仿單詳情、交互作用快速入口，依 Rx/OTC 篩選
- [x] 護理師工作台（/pro/nursing）：病患列表、生命徵象快速記錄、過敏/慢性病警示、即時異常提醒
- [x] ProSidebar 依角色顯示專屬導航（藥師見藥師工作台、護理師見護理工作台，黃/粉色分區標籤）

**Pro 層 — 技術修正**
- [x] verifyAdmin() 支援 super_admin 角色（原只支援 admin）
- [x] 門診頁病患儲存修正（正確寫入 doctor_patients）
- [x] 角色下拉選單 fixed 定位（跳脫 table overflow: hidden）
- [x] Pro 佈局固定高度（.pro-main overflow:auto，底部導覽永遠可見）
- [x] seed_resources.sql：18 筆台灣/國際臨床指引種子資料（含 ADA 2026）
