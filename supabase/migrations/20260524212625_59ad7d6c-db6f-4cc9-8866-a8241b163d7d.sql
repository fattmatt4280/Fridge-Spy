
create table public.scan_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  period_start timestamptz not null,
  period_end timestamptz not null,
  used int not null default 0,
  bonus int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, period_start)
);

create index idx_scan_usage_user on public.scan_usage(user_id, period_start desc);

alter table public.scan_usage enable row level security;

create policy "scan_usage select own"
  on public.scan_usage for select
  using (auth.uid() = user_id);

create policy "scan_usage service role all"
  on public.scan_usage for all
  using (auth.role() = 'service_role');

create trigger scan_usage_set_updated_at
  before update on public.scan_usage
  for each row execute function public.set_updated_at();
