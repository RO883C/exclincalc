# 開發紀錄 & 注意事項

> 本文件記錄重要決策、踩過的坑、以及跨 session 需要記住的事項。

---

## 重要帳號資訊

| 項目 | 內容 |
|------|------|
| GitHub | RO883C（已從 yu8812 轉移） |
| Supabase | RO883C's Org（已從個人帳號轉移） |
| 測試超管 | `00@test.com` / `000000`，pro_role = super_admin |
| ExClinCalc URL | https://exclincalc.netlify.app |
| ClinCalc URL | https://clincalc.netlify.app |

---

## 兩個 App 共用 Supabase 的架構

```
ExClinCalc (Pro)          ClinCalc (Consumer)
  ↓ 註冊                    ↓ 註冊
  API route /api/auth/      直接 signUp()
  register（service role）  → 寄確認信
  → 不寄信，直接建帳號
  → is_pro = false（預設）
  → 管理員設 is_pro = true 才能進入
         ↓
    同一個 Supabase
         ↓
  ProAuthGuard 檢查 is_pro  → false 就擋住
```

**同一 email 只能有一個帳號。**  
ClinCalc 用戶（is_pro=false）在 ExClinCalc 帳號管理頁顯示為「一般用戶」群組。

---

## 已知注意事項

### Supabase RLS
- profiles 表的 RLS policies 曾有問題（遞歸查詢）
- 如果用戶登入後被踢回（`?error=unauthorized`），先跑診斷 SQL：
  ```sql
  SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles';
  ```
- 快速修復：刪除所有 policies 重建（見 02-database.md）

### 藥物交互作用字串匹配
- 使用**單向匹配**（`a.includes(pair.a)`）
- 不可改回雙向，否則 "statin" 會誤配 "simvastatin" pair

### 密碼修改
- 使用 `supabase.auth.updateUser({ password })` 直接改
- **不需要**輸入舊密碼（Supabase session 已驗證身份）
- 不要加回 `signInWithPassword` re-auth

### 管理員 API 的 PATCH
- 用 `upsert({ id, ...updates }, { onConflict: 'id' })`
- 不要用 `update(...).eq('id', ...) + count` 判斷是否新增，Supabase 的 count 恆為 null

### Gemini API Key
- 存於 `.env.local`（不上 Git，在 `.gitignore` 的 `.env*` 規則中）
- 若意外暴露：Google AI Studio → Manage API Keys → 刪除舊 key → 新建

---

## 近期重要改動（本 session）

| 日期 | 改動 |
|------|------|
| 2026-04 | 帳號管理頁：角色分組摺疊 + USER 群組 |
| 2026-04 | 註冊改用 service role API，跳過 email 驗證信 |
| 2026-04 | 新增 /api/ping + GitHub Actions keep-alive（每 3 天）|
| 2026-04 | GitHub 轉移至 RO883C，Supabase 轉移至 RO883C's Org |
| 2026-04 | Supabase RLS 重設（profiles 表）|
| 2026-04 | profiles 表補充 email 欄位（trigger 需要） |
| 2026-04 | handle_new_user trigger 加 EXCEPTION 處理，防止 trigger 失敗阻斷註冊 |
| 2026-04 | Supabase Site URL 改為 exclincalc.netlify.app |

---

## 下一步計劃

1. **Cloudflare Pages 遷移**（詳見 04-deployment.md）
   - 每個 API route 加 `export const runtime = 'edge'`
   - 安裝 `@cloudflare/next-on-pages`
   - 建立 `wrangler.toml`

2. **移動專案資料夾**
   - 把 ExClinCalc 和 ClinCalc 放入同一父目錄
   - Git remote 不受影響
   - 更新 Claude Code 工作目錄

3. **種子資料**（可選）
   - 執行 `supabase/seed_medications.sql`
   - 執行 `supabase/seed_resources.sql`
