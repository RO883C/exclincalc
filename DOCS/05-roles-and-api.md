# 角色系統 & API 文件

---

## 角色層級

| 角色 | 代碼 | 顏色 | 說明 |
|------|------|------|------|
| 超級管理員 | `super_admin` | 紫 👑 | 唯一可修改/刪除 admin，可指派所有角色 |
| 管理員 | `admin` | 藍 🛡️ | 可管理非 admin 帳號 |
| 醫師 | `doctor` | 綠 🩺 | 完整門診功能 |
| 藥劑師 | `pharmacist` | 黃 💊 | 藥師工作台 + 藥物查詢 |
| 護理師 | `nurse` | 粉 🏥 | 護理工作台 + 病患讀取 |
| 行政人員 | `admin_staff` | 灰 📋 | 行政功能 |
| 一般用戶 | （無 pro_role） | 灰 👤 | ClinCalc 用戶，is_pro=false，無法登入 Pro |

### 授權規則
- `super_admin` 帳號不可被任何人刪除或修改角色
- 用戶不能修改自己的角色
- `admin` 只能管理 doctor / pharmacist / nurse / admin_staff
- `super_admin` 角色只有現任 super_admin 才能指派

---

## 帳號管理 UI 邏輯

`/pro/admin/users`：
- 按角色分組（super_admin → admin → doctor → pharmacist → nurse → admin_staff → 一般用戶）
- 每組可摺疊
- 一般用戶（is_pro=false）單獨列在最下方，只有「授予Pro」和「刪除」兩個操作

---

## API Routes

### `GET /api/ping`
健康檢查，查詢 `medical_references` LIMIT 1。  
回傳：`{ ok: true, supabase: "online", latency_ms: number }`

---

### `POST /api/auth/register`
使用 service role key 建立帳號（跳過 email 驗證信）。

```ts
Body: { email: string, password: string, name: string }
```

---

### `GET /api/pro/admin/users`
列出所有用戶 + 統計。需 admin / super_admin 角色。

```ts
Response: {
  users: UserRow[],
  currentUserId: string,
  currentRole: string
}
```

### `PATCH /api/pro/admin/users`
更新用戶 profile（is_pro / pro_role / institution）。

```ts
Body: { userId: string, updates: { is_pro?, pro_role?, institution? } }
```

### `POST /api/pro/admin/users`
重設密碼。

```ts
Body: { action: "reset_password", userId: string, newPassword: string }
```

### `DELETE /api/pro/admin/users`
刪除帳號。

```ts
Body: { userId: string }
```

---

### `GET /api/pro/analytics`
平台統計數據（5 指標）。需 is_pro。

---

### `POST /api/pro/gemini-clinical`
臨床 AI 分析。需 is_pro。

---

### `POST /api/pro/drug-interactions`
藥物交互作用檢查。需 is_pro。

---

## 樣式系統（Pro CSS 變數）

定義於 `src/app/(pro)/pro.css`：

| 變數 | 用途 |
|------|------|
| `--pro-bg` | 主背景 |
| `--pro-surface` / `--pro-card` | 卡片背景 |
| `--pro-sidebar` | 側欄背景 |
| `--pro-border` | 邊框色 |
| `--pro-text` / `--pro-text-muted` | 主文字 / 次要文字 |
| `--pro-accent` / `--pro-accent-dim` | 強調藍 |
| `--pro-danger` / `--pro-danger-dim` | 紅色警示 |
| `--pro-success` / `--pro-warning` | 成功綠 / 警告黃 |

共用 Class：`pro-card` / `pro-btn-primary` / `pro-btn-ghost` / `pro-input` / `pro-table` / `pro-badge`
