# TODO 清單

> 按優先級排列，完成後打勾並註記日期。

---

## 🔴 高優先

- [ ] **Cloudflare Pages 遷移**（取代 Netlify）
  - [ ] `npm install -D @cloudflare/next-on-pages wrangler`
  - [ ] 建立 `wrangler.toml`
  - [ ] 每個 API route 加 `export const runtime = 'edge'`
  - [ ] Cloudflare Dashboard 建立 Pages 專案，連接 RO883C/exclincalc
  - [ ] 貼入環境變數（4 個）
  - [ ] 更新 keep-alive.yml 的 URL
  - [ ] 更新 Supabase Redirect URLs

- [ ] **移動專案資料夾**
  - [ ] 建立統一父目錄（例如 `D:\Projects\`）
  - [ ] 移動 `D:\exclinclac\exclincalc` → `D:\Projects\exclincalc`
  - [ ] 移動 `D:\Clinclac` → `D:\Projects\clincalc`
  - [ ] 更新 Claude Code 工作目錄
  - [ ] 確認 `git remote -v` 正常（git 不受路徑影響）

---

## 🟡 中優先

- [ ] **ClinCalc（consumer 層）同步更新**
  - [ ] 確認 signUp 有加 `emailRedirectTo: window.location.origin + /auth/callback`
  - [ ] 確認 Redirect URLs 包含 `https://clincalc.netlify.app/auth/callback`

- [ ] **執行種子資料**（Supabase SQL Editor）
  - [ ] `supabase/seed_medications.sql`（31 筆藥物）
  - [ ] `supabase/seed_resources.sql`（18 筆臨床指引含 ADA 2026）

- [ ] **Supabase Email Templates 自訂**
  - [ ] Dashboard → Authentication → Email Templates
  - [ ] Confirm signup 改為醫療風格 HTML（見 DOCS/06-session-notes.md）
  - [ ] 設定寄件者名稱

---

## 🟢 低優先

- [ ] **英文版翻譯補齊**（`src/lib/i18n.ts`）
- [ ] **Custom SMTP 設定**（讓確認信從自訂 email 發出）
  - Supabase Dashboard → Settings → Auth → SMTP Settings
- [ ] **ClinCalc 帳號管理**對應 USER 群組顯示
- [ ] **Mobile 響應式優化**（目前 Pro 層主要為桌面版）

---

## ✅ 最近完成

- [x] 帳號管理按角色分組 + 摺疊 + USER 群組（2026-04）
- [x] 註冊改用 service role API，跳過 email 驗證（2026-04）
- [x] /api/ping + GitHub Actions keep-alive 每 3 天（2026-04）
- [x] GitHub 倉庫轉移至 RO883C（2026-04）
- [x] Supabase 轉移至 RO883C's Org（2026-04）
- [x] Supabase RLS 重設修復登入問題（2026-04）
- [x] DOCS/ 目錄建立（2026-04）
