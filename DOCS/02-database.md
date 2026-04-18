# 資料庫文件

> Supabase 專案：RO883C's Org（clincalc）  
> 區域：ap-northeast-1（東京）  
> 執行設定：`supabase/complete_setup.sql`（唯一需要跑的檔案）

---

## 初始化步驟（新環境）

1. Supabase Dashboard → SQL Editor → New query
2. 貼入 `supabase/complete_setup.sql` 全部內容 → Run
3. 設定超級管理員：

```sql
-- 方式一：帳號已存在
UPDATE profiles SET is_pro = true, pro_role = 'super_admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'your@email.com');

-- 方式二：帳號不存在（UPSERT）
INSERT INTO profiles (id, email, is_pro, pro_role)
SELECT id, email, true, 'super_admin'
FROM auth.users WHERE email = 'your@email.com'
ON CONFLICT (id) DO UPDATE SET is_pro = true, pro_role = 'super_admin';
```

4. 執行種子資料（可選）：
   - `supabase/seed_medications.sql` — 31 筆藥物資料
   - `supabase/seed_resources.sql` — 18 筆臨床指引（含 ADA 2026）

---

## 資料表一覽

| 表格 | 說明 | RLS |
|------|------|-----|
| `auth.users` | Supabase Auth 帳號 | Supabase 管理 |
| `profiles` | 個人資料 + Pro 角色 + 設定 | 本人讀寫；admin 可讀全部 |
| `health_records` | 民眾健康記錄 | 本人讀寫；Pro 可讀全部 |
| `medications` | 藥物資料庫 | 所有人可讀；admin 可寫 |
| `medical_references` | 醫療參考值 | 所有人可讀；admin 可寫 |
| `doctor_patients` | 醫師管理的病患 | 本醫師讀寫；護理師/admin 可讀 |
| `clinical_records` | SOAP 門診病歷 | 本醫師讀寫；護理師/admin 可讀 |
| `soap_notes` | SOAP 草稿 | 本醫師讀寫 |
| `drug_interaction_checks` | 藥物交互作用查詢記錄 | 本醫師/藥師讀寫 |
| `pro_resources` | 臨床參考資料庫 | 公開可讀；本人讀寫；admin 全管 |
| `audit_logs` | 管理員操作稽核 | admin 可讀；service role 寫入 |

---

## 重要欄位

### `profiles`
```sql
id              uuid    PK, FK → auth.users
email           text
name            text
is_pro          boolean default false
pro_role        text    default 'doctor'
                        CHECK: doctor | admin | super_admin |
                               pharmacist | nurse | admin_staff
institution     text
license_number  text
settings        jsonb   default '{}'   -- UI 設定（雲端同步）
created_at      timestamptz
updated_at      timestamptz
```

### `doctor_patients`
```sql
id                  uuid PK
doctor_id           uuid FK → auth.users
full_name           text NOT NULL
date_of_birth       date
sex                 text  M | F | Other
id_number           text  身分證
nhi_number          text  健保卡號
phone / email       text
blood_type          text  A+|A-|B+|B-|AB+|AB-|O+|O-
allergies           text[]
chronic_conditions  text[]
notes               text
```

### `clinical_records`（SOAP）
```sql
id                  uuid PK
patient_id          uuid FK → doctor_patients（可 null）
doctor_id           uuid FK → auth.users
visit_date          date
chief_complaint     text
subjective          text   問診 + ROS
objective           jsonb  { vitals, bmi, pe, labs }
assessment          text   診斷 + ICD-10
plan                text   處方/衛教/轉介
icd10_codes         text[]
ai_analysis         text
diagnosis_accuracy  text   correct | partial | incorrect | null
```

---

## Auth Trigger

用戶註冊時自動建立 profile：

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'handle_new_user error: %', SQLERRM;
  RETURN NEW;
END;
$$;
```

---

## 常見問題排查

**Q: 登入後顯示「此帳號尚未取得醫師權限」**  
→ 執行 UPDATE profiles SET is_pro = true ... 設定帳號

**Q: 註冊時「Database error saving new user」**  
→ `complete_setup.sql` 未執行，或 profiles 表缺少 email 欄位  
→ `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text;`

**Q: RLS 查詢不到自己的 profile**  
→ 重設 RLS policies：
```sql
DO $$ DECLARE r RECORD;
BEGIN FOR r IN SELECT policyname FROM pg_policies WHERE tablename='profiles' AND schemaname='public'
  LOOP EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON profiles'; END LOOP;
END $$;
CREATE POLICY "read_own_profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE USING (auth.uid() = id);
```
