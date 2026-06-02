
-- Roles
create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "users read own roles" on public.user_roles
  for select to authenticated using (auth.uid() = user_id);
create policy "admins read all roles" on public.user_roles
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;

alter table public.profiles enable row level security;

create policy "users read own profile" on public.profiles
  for select to authenticated using (auth.uid() = id);
create policy "admins read all profiles" on public.profiles
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "admins update profiles" on public.profiles
  for update to authenticated using (public.has_role(auth.uid(), 'admin'));

-- is_approved helper
create or replace function public.is_approved(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select approved from public.profiles where id = _user_id), false)
$$;

-- Auto-create profile + auto-admin for the owner email
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  is_owner boolean := lower(new.email) = lower('S3904844@mkhb.moe.gov.sa');
begin
  insert into public.profiles (id, email, approved)
  values (new.id, new.email, is_owner);

  if is_owner then
    insert into public.user_roles (user_id, role) values (new.id, 'admin')
    on conflict do nothing;
  end if;

  insert into public.user_roles (user_id, role) values (new.id, 'user')
  on conflict do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill any existing users
insert into public.profiles (id, email, approved)
select u.id, u.email, lower(u.email) = lower('S3904844@mkhb.moe.gov.sa')
from auth.users u
on conflict (id) do nothing;

insert into public.user_roles (user_id, role)
select u.id, 'admin'::public.app_role from auth.users u
where lower(u.email) = lower('S3904844@mkhb.moe.gov.sa')
on conflict do nothing;

insert into public.user_roles (user_id, role)
select u.id, 'user'::public.app_role from auth.users u
on conflict do nothing;

-- Gate existing tables behind approval
drop policy if exists "own classes select" on public.classes;
drop policy if exists "own classes insert" on public.classes;
drop policy if exists "own classes update" on public.classes;
drop policy if exists "own classes delete" on public.classes;

create policy "approved own classes select" on public.classes
  for select to authenticated using (auth.uid() = user_id and public.is_approved(auth.uid()));
create policy "approved own classes insert" on public.classes
  for insert to authenticated with check (auth.uid() = user_id and public.is_approved(auth.uid()));
create policy "approved own classes update" on public.classes
  for update to authenticated using (auth.uid() = user_id and public.is_approved(auth.uid()));
create policy "approved own classes delete" on public.classes
  for delete to authenticated using (auth.uid() = user_id and public.is_approved(auth.uid()));

drop policy if exists "own students select" on public.students;
drop policy if exists "own students insert" on public.students;
drop policy if exists "own students update" on public.students;
drop policy if exists "own students delete" on public.students;

create policy "approved own students select" on public.students
  for select to authenticated using (auth.uid() = user_id and public.is_approved(auth.uid()));
create policy "approved own students insert" on public.students
  for insert to authenticated with check (auth.uid() = user_id and public.is_approved(auth.uid()));
create policy "approved own students update" on public.students
  for update to authenticated using (auth.uid() = user_id and public.is_approved(auth.uid()));
create policy "approved own students delete" on public.students
  for delete to authenticated using (auth.uid() = user_id and public.is_approved(auth.uid()));

drop policy if exists "own events select" on public.student_events;
drop policy if exists "own events insert" on public.student_events;
drop policy if exists "own events delete" on public.student_events;

create policy "approved own events select" on public.student_events
  for select to authenticated using (auth.uid() = user_id and public.is_approved(auth.uid()));
create policy "approved own events insert" on public.student_events
  for insert to authenticated with check (auth.uid() = user_id and public.is_approved(auth.uid()));
create policy "approved own events delete" on public.student_events
  for delete to authenticated using (auth.uid() = user_id and public.is_approved(auth.uid()));
