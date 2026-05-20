create table if not exists public.app_settings (
  key   text primary key,
  value text,
  updated_at timestamptz default now()
);

insert into public.app_settings (key, value)
values ('email_aprobador', 'alexander.castro@soltranes.com')
on conflict (key) do nothing;

alter table public.app_settings enable row level security;

create policy "admin_read_settings" on public.app_settings
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "admin_write_settings" on public.app_settings
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
