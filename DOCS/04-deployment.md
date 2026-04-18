# 部署文件

---

## 目前狀態

| 項目 | 內容 |
|------|------|
| **GitHub** | RO883C/exclincalc（main branch） |
| **部署平台** | Netlify（exclincalc.netlify.app）|
| **計劃遷移** | Cloudflare Pages |
| **Supabase** | RO883C's Org，ap-northeast-1（東京） |

---

## 環境變數

以下變數需設定於部署平台（Netlify / Cloudflare）及本機 `.env.local`：

| 變數 | 說明 | 類型 |
|------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 專案 URL | Client + Server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key | Client + Server |
| `SUPABASE_SERVICE_ROLE_KEY` | Service Role Key | Server only |
| `GEMINI_API_KEY` | Google Gemini API Key | Server only |

---

## Git 操作

```bash
# 目前 remote
git remote -v
# origin  https://github.com/RO883C/exclincalc.git

# 推送
git add .
git commit -m "..."
git push origin main
```

---

## Cloudflare Pages 遷移指南（待執行）

### 為什麼可以遷移
- 所有 API routes 不使用 Node.js 專屬 API（無 fs / path / child_process）
- `@supabase/ssr` 相容 Edge Runtime
- Next.js 16 支援 Cloudflare Pages

### 遷移步驟

**Step 1 — 安裝套件**
```bash
npm install -D @cloudflare/next-on-pages wrangler
```

**Step 2 — 建立 `wrangler.toml`**
```toml
name = "exclincalc"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]
pages_build_output_dir = ".vercel/output/static"
```

**Step 3 — 更新 `next.config.ts`**
```ts
import { setupDevPlatform } from '@cloudflare/next-on-pages/next-dev';

if (process.env.NODE_ENV === 'development') {
  await setupDevPlatform();
}
```

**Step 4 — 在每個 API route 加入 Edge Runtime 聲明**
```ts
export const runtime = 'edge';
```
需要加的檔案：
- `src/app/api/auth/register/route.ts`
- `src/app/api/ping/route.ts`
- `src/app/api/pro/admin/users/route.ts`
- `src/app/api/pro/analytics/route.ts`
- `src/app/api/pro/drug-interactions/route.ts`
- `src/app/api/pro/gemini-clinical/route.ts`
- `src/app/api/pro/resources/check-updates/route.ts`
- `src/app/api/pro/admin/route.ts`

**Step 5 — Cloudflare Dashboard**
1. Pages → Create a project → Connect to Git → RO883C/exclincalc
2. Build command: `npx @cloudflare/next-on-pages`
3. Build output directory: `.vercel/output/static`
4. 貼入所有環境變數
5. Deploy

**Step 6 — 更新 GitHub Actions keep-alive**
```yaml
# .github/workflows/keep-alive.yml
# 改為新的 Cloudflare URL
run: curl -s https://exclincalc.pages.dev/api/ping
```

---

## Supabase URL Configuration

Dashboard → Authentication → URL Configuration：

| 設定 | 值 |
|------|---|
| Site URL | `https://exclincalc.netlify.app`（或遷移後的 CF URL）|
| Redirect URLs | `https://exclincalc.netlify.app/auth/callback` |
| | `https://clincalc.netlify.app/auth/callback` |
| | `http://localhost:3000/auth/callback` |

---

## Keep-Alive 機制

GitHub Actions 每 3 天自動 ping，防止 Supabase 免費版休眠：

```
.github/workflows/keep-alive.yml
→ GET https://exclincalc.netlify.app/api/ping
  → SELECT from medical_references LIMIT 1
    → Supabase 保持活躍
```

手動觸發：GitHub → Actions → Keep Alive → Run workflow

---

## 本機開發

```bash
cd D:\[父目錄]\exclincalc    # 更新為移動後的路徑
npm install
npm run dev                   # http://localhost:3000
npx tsc --noEmit              # TypeScript 型別檢查
```

確保 `.env.local` 存在（不上 Git）：
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
GEMINI_API_KEY=...
```
