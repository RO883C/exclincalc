-- 健康記錄資料表
create table if not exists health_records (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null check (type in ('manual', 'scan')),
  data jsonb default '{}',
  ai_analysis text,
  created_at timestamptz default now()
);

-- 用戶只能操作自己的記錄
alter table health_records enable row level security;
drop policy if exists "Users can manage own records" on health_records;
create policy "Users can manage own records" on health_records
  for all using (auth.uid() = user_id);
