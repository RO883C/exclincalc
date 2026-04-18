# 功能清單

---

## Pro 層頁面地圖

| 路由 | 功能 | 最低角色 |
|------|------|---------|
| `/pro` | 儀表板，快速入口 | 任意 Pro |
| `/pro/encounter` | 門診診療流程（7步驟 SOAP） | doctor |
| `/pro/patients` | 病患列表（搜尋/篩選） | doctor |
| `/pro/patients/new` | 新增病患 | doctor |
| `/pro/patients/[id]` | 病患詳情（病歷、趨勢圖） | doctor |
| `/pro/references` | 臨床參考資料庫 | 任意 Pro |
| `/pro/exam` | 檢驗工作台 | doctor |
| `/pro/pharmacy` | 藥師工作台 | pharmacist |
| `/pro/nursing` | 護理師工作台 | nurse |
| `/pro/analytics` | 數據分析（5 指標） | 任意 Pro |
| `/pro/profile` | 個人資料（Email/密碼修改） | 任意 Pro |
| `/pro/settings` | 系統設定（雲端同步） | 任意 Pro |
| `/pro/admin` | 管理後台入口 | admin |
| `/pro/admin/users` | 帳號管理（角色分組/摺疊/USER分類） | admin |
| `/pro/admin/records` | 全平台記錄管理 | admin |
| `/pro/admin/medications` | 藥物資料庫維護 | admin |
| `/pro/admin/references` | 醫療參考值維護 | admin |

---

## 門診診療流程（Encounter）7 步驟

```
步驟 1 主訴    → 17 種主訴模板，自動載入對應模板
步驟 2 問診    → OPQRST + 系統回顧（ROS 三態：未詢問/有/無）
步驟 3 生命徵象 → BP、HR、RR、體溫、SpO₂、BMI 自動計算
步驟 4 身體檢查 → 依主訴預選系統，預設發現 + 自由文字
步驟 5 選擇檢查 → 台灣健保套組，輸入數值即時判讀
步驟 6 診斷    → 建議 ICD-10 + 自由輸入
步驟 7 計畫    → 處方/衛教/轉介建議 + 備註
```

---

## 數據分析 5 指標（論文用）

| 指標 | 資料來源 | 說明 |
|------|---------|------|
| A 帳號數 | `profiles` | Pro 用戶總數 |
| B 病患記錄 | `doctor_patients` | 醫師管理病患總數 |
| C 藥物資料庫 | `medications` | 藥物筆數 |
| D 醫療參考值 | `medical_references` | 參考值條目數 |
| E 診斷準確率 | `clinical_records.diagnosis_accuracy` | (正確×1 + 部分×0.5) / 總回饋數 × 100% |

---

## ✅ 已完成功能

### Pro 層
- [x] Pro 佈局（側欄 + 角色保護 ProAuthGuard）
- [x] ProSidebar 依角色顯示專屬導航（藥師/護理師專屬區塊）
- [x] 門診診療流程（7 步驟完整 SOAP）
- [x] 17 種主訴模板（clinicalFlow.ts）
- [x] 多選主訴 + 動態模板同步
- [x] 互動式系統回顧（ROS 三態切換）
- [x] 病患管理（列表、新增、詳情）
- [x] 健康趨勢圖表（純 SVG，正常值色帶、異常紅點、%變化）
- [x] 病患名稱自動補完（門診頁）
- [x] 角色系統（6 種角色 + 層級保護）
- [x] 帳號管理（角色分組摺疊 + USER 一般用戶分類）
- [x] 數據分析（5 指標 + Gemini AI 摘要）
- [x] 管理後台（記錄/藥物/參考值管理）
- [x] 診斷準確率回饋（正確/部分/有誤 + E 指標計算）
- [x] 臨床參考資料庫（書籍/指引/文章/網站/影音）
- [x] 參考資料庫：重複偵測 + 版本更新檢查
- [x] 個人資料：Email 變更 + 密碼修改（直接 updateUser，無需舊密碼）
- [x] 系統設定雲端同步（profiles.settings jsonb）
- [x] 藥師工作台
- [x] 護理師工作台
- [x] Admin 稽核記錄（audit_logs）

### 技術修正
- [x] 藥物互動字串改單向匹配（避免 "statin" 誤配 "simvastatin"）
- [x] Encounter 存檔加 try-catch + 可見錯誤提示
- [x] Encounter / Exam 頁加 beforeunload 離頁提示
- [x] Dashboard visibilitychange 自動刷新
- [x] verifyAdmin() 支援 super_admin
- [x] 角色下拉選單 fixed 定位（跳脫 table overflow）
- [x] 帳號管理 PATCH 改用 upsert
- [x] 註冊改用 service role API（跳過 email 驗證，不影響 ClinCalc）

### 基礎設施
- [x] complete_setup.sql（單一檔案完整 DB 設定）
- [x] /api/ping 健康檢查 endpoint
- [x] GitHub Actions keep-alive（每 3 天 ping Supabase）
- [x] 帳號管理 USER 群組（is_pro = false 的 ClinCalc 用戶）

---

## ⏳ 待完成

- [ ] **遷移到 Cloudflare Pages**（當前 Netlify）
  - 安裝 `@cloudflare/next-on-pages`
  - 設定 `wrangler.toml`
  - 驗證 API routes 相容性
- [ ] 英文版翻譯補齊（i18n.ts，低優先）
- [ ] 自訂 Supabase 驗證信件範本（需 Dashboard 手動設定）
- [ ] ClinCalc（consumer 層）對應功能更新
