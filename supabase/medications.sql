-- 藥物資料表
create table if not exists medications (
  id uuid default gen_random_uuid() primary key,
  name_zh text not null,
  name_en text not null,
  generic_name text,
  category text not null,
  uses_zh text not null,
  uses_en text,
  side_effects_zh text,
  common_dosage text,
  warnings_zh text,
  interactions text[],
  prescription_required boolean default true,
  source text default 'manual',
  updated_at timestamptz default now()
);

-- 公開讀取（藥物資訊是通用知識）
alter table medications enable row level security;
create policy "Anyone can read medications" on medications for select using (true);

-- 醫療參考值資料表（可替換本地 referenceRanges.ts）
create table if not exists medical_references (
  id uuid default gen_random_uuid() primary key,
  key text unique not null,
  label_zh text not null,
  label_en text not null,
  unit text not null,
  explanation_zh text not null,
  normal_general jsonb,
  normal_male jsonb,
  normal_female jsonb,
  warning_high numeric,
  warning_low numeric,
  category text not null,
  source text,
  updated_at timestamptz default now()
);

alter table medical_references enable row level security;
create policy "Anyone can read references" on medical_references for select using (true);
