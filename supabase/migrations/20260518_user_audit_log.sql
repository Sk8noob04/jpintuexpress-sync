-- Tabla de auditoría de cambios en usuarios (F3)
create table if not exists public.user_audit_log (
  id          uuid primary key default gen_random_uuid(),
  admin_id    uuid references public.profiles(id) on delete set null,
  usuario_id  uuid references public.profiles(id) on delete set null,
  accion      text not null,
  detalles    jsonb default '{}'::jsonb,
  created_at  timestamptz default now() not null
);

-- Index para consultas por fecha y por usuario
create index if not exists user_audit_log_created_at_idx  on public.user_audit_log(created_at desc);
create index if not exists user_audit_log_usuario_id_idx  on public.user_audit_log(usuario_id);

-- RLS: solo el servicio (service_role) puede insertar; admins pueden leer via service_role key
alter table public.user_audit_log enable row level security;

-- Admins autenticados pueden leer
create policy "admin_read_audit" on public.user_audit_log
  for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
