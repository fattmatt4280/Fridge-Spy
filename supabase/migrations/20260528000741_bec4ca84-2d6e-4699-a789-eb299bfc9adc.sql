-- Role enum
do $$ begin
  create type public.app_role as enum ('admin', 'user');
exception when duplicate_object then null; end $$;

-- user_roles table
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

alter table public.user_roles enable row level security;

drop policy if exists "user_roles select own" on public.user_roles;
create policy "user_roles select own"
  on public.user_roles for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "user_roles service role all" on public.user_roles;
create policy "user_roles service role all"
  on public.user_roles for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- has_role helper
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

-- Seed admin
insert into public.user_roles (user_id, role)
select id, 'admin'::public.app_role
from auth.users
where lower(email) = lower('Dreamtattocompany@gmail.com')
on conflict (user_id, role) do nothing;