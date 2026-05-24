
create table public.classes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
alter table public.classes enable row level security;
create policy "own classes select" on public.classes for select using (auth.uid() = user_id);
create policy "own classes insert" on public.classes for insert with check (auth.uid() = user_id);
create policy "own classes update" on public.classes for update using (auth.uid() = user_id);
create policy "own classes delete" on public.classes for delete using (auth.uid() = user_id);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  status text not null default '',
  order_index int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.students enable row level security;
create policy "own students select" on public.students for select using (auth.uid() = user_id);
create policy "own students insert" on public.students for insert with check (auth.uid() = user_id);
create policy "own students update" on public.students for update using (auth.uid() = user_id);
create policy "own students delete" on public.students for delete using (auth.uid() = user_id);
create index on public.students(class_id);
