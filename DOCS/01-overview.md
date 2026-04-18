# ExClinCalc — 系統總覽

> 技術棧：Next.js 16 · TypeScript · Supabase · Google Gemini API  
> 部署：Netlify（exclincalc.netlify.app）→ 計劃遷移至 Cloudflare Pages

---

## 系統定位

ExClinCalc 是 ClinCalc 平台的 **Pro 層**，供醫事人員使用的臨床決策系統。

| 層次 | App | 網址 | 用途 |
|------|-----|------|------|
| **Pro 層** | ExClinCalc | exclincalc.netlify.app | 醫師/藥師/護理師 臨床工作 |
| **Consumer 層** | ClinCalc | clincalc.netlify.app | 一般民眾健康自查 |

兩個 App 共用同一個 Supabase 專案。

---

## 核心設計原則

1. **離線優先** — 本地參考值資料庫，無網路可執行基本分析
2. **AI 輔助** — Google Gemini 提供深度解讀，為補充層非必要依賴
3. **資料主權** — 未登入資料存 localStorage，登入後同步至 Supabase
4. **免責優先** — 所有分析頁面強制免責聲明，AI 輸出明確標示非診斷
5. **角色授權** — 6 種角色依功能分配資料存取權

---

## 架構圖

```
瀏覽器
  ↓
Next.js App Router（Netlify Edge）
  ├── Client Components → Supabase JS SDK（anon key + RLS）
  ├── Server API Routes /api/* → Gemini / Service Role 操作
  └── 靜態資產（本地醫療參考值、臨床決策庫）
                    ↓
         Supabase PostgreSQL（RO883C's Org）
         ├── auth.users           ← Supabase Auth
         ├── profiles             ← 用戶資料 + Pro 角色
         ├── health_records       ← 民眾健康記錄
         ├── medications          ← 藥物資料庫
         ├── medical_references   ← 醫療參考值
         ├── doctor_patients      ← 醫師管理的病患
         ├── clinical_records     ← SOAP 門診病歷
         ├── soap_notes           ← SOAP 草稿
         ├── drug_interaction_checks ← 藥物交互作用記錄
         ├── pro_resources        ← 臨床參考資料庫
         └── audit_logs           ← 管理員操作稽核
```

---

## 目錄結構

```
exclincalc/
├── DOCS/                       ← 本文件目錄
├── src/
│   ├── app/
│   │   ├── (pro)/pro/          ← Pro 模組頁面（需 is_pro = true）
│   │   │   ├── dashboard/      ← 儀表板
│   │   │   ├── encounter/      ← 門診診療流程（7步驟 SOAP）
│   │   │   ├── patients/       ← 病患管理
│   │   │   ├── analytics/      ← 數據分析
│   │   │   ├── references/     ← 臨床參考資料庫
│   │   │   ├── exam/           ← 檢驗工作台
│   │   │   ├── pharmacy/       ← 藥師工作台
│   │   │   ├── nursing/        ← 護理師工作台
│   │   │   ├── profile/        ← 個人資料
│   │   │   ├── settings/       ← 系統設定（雲端同步）
│   │   │   └── admin/          ← 管理後台
│   │   ├── api/
│   │   │   ├── auth/register/  ← 註冊 API（service role，跳過 email 驗證）
│   │   │   ├── ping/           ← 健康檢查（Supabase keep-alive）
│   │   │   ├── gemini/         ← Gemini AI 代理
│   │   │   └── pro/            ← Pro 功能 API
│   │   └── auth/               ← 登入 / 註冊 / Callback
│   ├── components/pro/         ← Pro 共用元件
│   └── lib/
│       ├── pro/                ← 臨床流程資料庫
│       ├── supabase.ts         ← Browser client
│       ├── supabase-server.ts  ← Server client（cookies）
│       ├── referenceRanges.ts  ← 醫療參考值（本地）
│       └── localAnalysis.ts    ← 離線分析引擎
├── supabase/
│   └── complete_setup.sql      ← 完整 DB 設定（單一檔案執行）
├── scripts/                    ← 開發輔助腳本
├── .github/workflows/
│   └── keep-alive.yml          ← 每 3 天自動 ping Supabase
└── README.md
```
