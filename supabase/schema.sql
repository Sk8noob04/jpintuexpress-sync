-- =====================================================================
-- JPINTUEXPRESS — SCHEMA DE SOLICITUDES DE COMPRA
-- =====================================================================
-- Pegar este archivo completo en:
--   Supabase Dashboard > SQL Editor > New Query
-- y presionar "Run".
--
-- Es IDEMPOTENTE: se puede ejecutar varias veces sin romper nada.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. EXTENSIONES
-- ---------------------------------------------------------------------
create extension if not exists "uuid-ossp";


-- ---------------------------------------------------------------------
-- 2. TIPOS ENUM
-- ---------------------------------------------------------------------
-- Roles del sistema. Si en el futuro agregas un rol nuevo (ej: "auditor"),
-- usas: alter type user_role add value 'auditor';
do $$ begin
  create type user_role as enum ('solicitante', 'aprobador', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type solicitud_estado as enum ('pendiente', 'aprobada', 'rechazada');
exception when duplicate_object then null; end $$;


-- ---------------------------------------------------------------------
-- 3. TABLAS
-- ---------------------------------------------------------------------

-- 3.1 PROFILES — datos extendidos del usuario.
-- Supabase Auth maneja auth.users (email, password hash, etc.).
-- Nosotros NUNCA tocamos auth.users directamente.
-- profiles vive en public, vinculada 1-a-1 con auth.users por id.
create table if not exists public.profiles (
  id                       uuid primary key references auth.users(id) on delete cascade,
  nombre_completo          text not null,
  email                    text not null,
  role                     user_role not null default 'solicitante',
  debe_cambiar_password    boolean not null default true,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

-- 3.2 LINEAS — catálogo gestionado por admin.
-- Usamos `activa` como soft-delete: nunca borramos, solo desactivamos.
-- Razón: si una solicitud antigua referencia una línea, no la podemos perder.
create table if not exists public.lineas (
  id           uuid primary key default uuid_generate_v4(),
  nombre       text not null unique,
  activa       boolean not null default true,
  created_at   timestamptz not null default now()
);

-- 3.3 ACTIVOS — catálogo de activos, cada uno pertenece a UNA línea.
create table if not exists public.activos (
  id           uuid primary key default uuid_generate_v4(),
  nombre       text not null,
  linea_id     uuid not null references public.lineas(id) on delete restrict,
  activo       boolean not null default true,
  created_at   timestamptz not null default now(),
  unique (nombre, linea_id)  -- no se puede repetir un activo dentro de la misma línea
);

-- 3.4 SOLICITUDES — la tabla principal del negocio.
create table if not exists public.solicitudes (
  id                       uuid primary key default uuid_generate_v4(),
  solicitante_id           uuid not null references public.profiles(id) on delete restrict,
  motivo                   text not null check (length(motivo) >= 10),
  costo_estimado           numeric(12, 2) not null check (costo_estimado >= 0),
  linea_id                 uuid not null references public.lineas(id) on delete restrict,
  activo_id                uuid not null references public.activos(id) on delete restrict,
  estado                   solicitud_estado not null default 'pendiente',
  comentario_aprobador     text,
  aprobador_id             uuid references public.profiles(id) on delete set null,
  imagen_url               text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);


-- ---------------------------------------------------------------------
-- 4. ÍNDICES
-- ---------------------------------------------------------------------
-- Aceleran las queries más comunes que vamos a hacer.
create index if not exists idx_solicitudes_solicitante on public.solicitudes(solicitante_id);
create index if not exists idx_solicitudes_estado      on public.solicitudes(estado);
create index if not exists idx_solicitudes_created_at  on public.solicitudes(created_at desc);
create index if not exists idx_activos_linea           on public.activos(linea_id);


-- ---------------------------------------------------------------------
-- 5. FUNCIONES HELPER
-- ---------------------------------------------------------------------

-- 5.1 Obtener el rol del usuario autenticado.
-- IMPORTANTE: SECURITY DEFINER hace que esta función bypasse las RLS
-- de profiles. Sin esto, las políticas que consultan profiles se
-- llamarían a sí mismas en bucle infinito (recursión RLS).
create or replace function public.get_user_role()
returns user_role
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- 5.2 Auto-crear profile al registrarse un usuario.
-- Cuando admin crea un usuario en Supabase Auth, este trigger
-- crea automáticamente la fila en profiles.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, nombre_completo, role, debe_cambiar_password)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nombre_completo', new.email),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'solicitante'),
    true
  );
  return new;
end;
$$;

-- 5.3 Auto-actualizar el campo updated_at.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 5.4 Proteger campos inmutables de solicitudes.
-- Después de crear una solicitud, sus datos originales NO se modifican.
-- Lo único que cambia: estado, comentario_aprobador, aprobador_id, imagen_url.
create or replace function public.solicitudes_check_immutable()
returns trigger
language plpgsql
as $$
begin
  if new.solicitante_id  is distinct from old.solicitante_id
     or new.motivo       is distinct from old.motivo
     or new.costo_estimado is distinct from old.costo_estimado
     or new.linea_id     is distinct from old.linea_id
     or new.activo_id    is distinct from old.activo_id
     or new.created_at   is distinct from old.created_at then
    raise exception 'No se pueden modificar los datos originales de una solicitud';
  end if;
  return new;
end;
$$;


-- ---------------------------------------------------------------------
-- 6. TRIGGERS
-- ---------------------------------------------------------------------

-- 6.1 Crear profile automáticamente al registrar un usuario en auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 6.2 updated_at automático en profiles
drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- 6.3 updated_at automático + check de inmutabilidad en solicitudes
drop trigger if exists trg_solicitudes_updated_at on public.solicitudes;
create trigger trg_solicitudes_updated_at
  before update on public.solicitudes
  for each row execute function public.set_updated_at();

drop trigger if exists trg_solicitudes_immutable on public.solicitudes;
create trigger trg_solicitudes_immutable
  before update on public.solicitudes
  for each row execute function public.solicitudes_check_immutable();


-- ---------------------------------------------------------------------
-- 7. ACTIVAR ROW LEVEL SECURITY (RLS)
-- ---------------------------------------------------------------------
-- Sin esto, cualquier usuario autenticado podría leer/modificar TODO.
-- Con RLS habilitado, las únicas operaciones permitidas son las que
-- explícitamente autorizamos en las políticas (sección 8).
alter table public.profiles    enable row level security;
alter table public.lineas      enable row level security;
alter table public.activos     enable row level security;
alter table public.solicitudes enable row level security;


-- ---------------------------------------------------------------------
-- 8. POLÍTICAS RLS
-- ---------------------------------------------------------------------

-- 8.1 PROFILES -------------------------------------------------------
-- SELECT: usuario ve su propio perfil; aprobador y admin ven todos
-- (aprobador necesita ver el nombre del solicitante en cada solicitud).
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (
    auth.uid() = id
    or public.get_user_role() in ('admin', 'aprobador')
  );

-- UPDATE (usuario): puede actualizar su propio perfil EXCEPTO el rol.
-- Esto evita que un solicitante se promueva a admin desde la UI.
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select role from public.profiles where id = auth.uid())
  );

-- UPDATE (admin): puede modificar cualquier perfil.
drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin on public.profiles
  for update to authenticated
  using (public.get_user_role() = 'admin')
  with check (public.get_user_role() = 'admin');


-- 8.2 LINEAS ---------------------------------------------------------
-- Todos pueden leer (necesario para los selectores en el formulario).
drop policy if exists lineas_select on public.lineas;
create policy lineas_select on public.lineas
  for select to authenticated using (true);

-- Solo admin modifica.
drop policy if exists lineas_insert_admin on public.lineas;
create policy lineas_insert_admin on public.lineas
  for insert to authenticated
  with check (public.get_user_role() = 'admin');

drop policy if exists lineas_update_admin on public.lineas;
create policy lineas_update_admin on public.lineas
  for update to authenticated
  using (public.get_user_role() = 'admin')
  with check (public.get_user_role() = 'admin');

drop policy if exists lineas_delete_admin on public.lineas;
create policy lineas_delete_admin on public.lineas
  for delete to authenticated
  using (public.get_user_role() = 'admin');


-- 8.3 ACTIVOS (mismo patrón que lineas) -----------------------------
drop policy if exists activos_select on public.activos;
create policy activos_select on public.activos
  for select to authenticated using (true);

drop policy if exists activos_insert_admin on public.activos;
create policy activos_insert_admin on public.activos
  for insert to authenticated
  with check (public.get_user_role() = 'admin');

drop policy if exists activos_update_admin on public.activos;
create policy activos_update_admin on public.activos
  for update to authenticated
  using (public.get_user_role() = 'admin')
  with check (public.get_user_role() = 'admin');

drop policy if exists activos_delete_admin on public.activos;
create policy activos_delete_admin on public.activos
  for delete to authenticated
  using (public.get_user_role() = 'admin');


-- 8.4 SOLICITUDES ----------------------------------------------------
-- SELECT: solicitante ve solo las suyas; aprobador y admin ven todas.
drop policy if exists solicitudes_select on public.solicitudes;
create policy solicitudes_select on public.solicitudes
  for select to authenticated
  using (
    solicitante_id = auth.uid()
    or public.get_user_role() in ('aprobador', 'admin')
  );

-- INSERT: solo solicitante crea sus propias solicitudes en estado pendiente.
-- Nota: aquí forzamos que admin y aprobador NO puedan crear solicitudes.
drop policy if exists solicitudes_insert on public.solicitudes;
create policy solicitudes_insert on public.solicitudes
  for insert to authenticated
  with check (
    solicitante_id = auth.uid()
    and public.get_user_role() = 'solicitante'
    and estado = 'pendiente'
    and aprobador_id is null
    and comentario_aprobador is null
  );

-- UPDATE: solo aprobador, y solo si la solicitud sigue pendiente.
-- Esto cumple las dos reglas que pediste:
--   • admin no puede aprobar/rechazar (no es 'aprobador')
--   • nadie puede modificar solicitudes ya aprobadas/rechazadas
drop policy if exists solicitudes_update_aprobador on public.solicitudes;
create policy solicitudes_update_aprobador on public.solicitudes
  for update to authenticated
  using (
    public.get_user_role() = 'aprobador'
    and estado = 'pendiente'
  )
  with check (
    public.get_user_role() = 'aprobador'
    and estado in ('aprobada', 'rechazada')
    and aprobador_id = auth.uid()
  );

-- DELETE: NADIE. Las solicitudes son permanentes (auditoría).
-- Al no crear ninguna política DELETE, RLS bloquea todo intento de borrado.


-- ---------------------------------------------------------------------
-- 9. STORAGE — bucket para imágenes de solicitudes
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('solicitudes-imagenes', 'solicitudes-imagenes', true)
on conflict (id) do nothing;

-- Cualquiera autenticado puede subir imágenes
drop policy if exists "solicitudes_imagenes_upload" on storage.objects;
create policy "solicitudes_imagenes_upload"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'solicitudes-imagenes');

-- Cualquiera autenticado puede leer las imágenes
drop policy if exists "solicitudes_imagenes_select" on storage.objects;
create policy "solicitudes_imagenes_select"
  on storage.objects for select to authenticated
  using (bucket_id = 'solicitudes-imagenes');


-- ---------------------------------------------------------------------
-- 10. DATOS SEMILLA (opcional — descomentar y ajustar)
-- ---------------------------------------------------------------------
-- Cuando sepas las líneas reales de JPintuExpress, descomenta y ajusta:

-- insert into public.lineas (nombre) values
--   ('Pintura Industrial'),
--   ('Pintura Automotriz'),
--   ('Recubrimientos Especiales')
-- on conflict (nombre) do nothing;

-- insert into public.activos (nombre, linea_id)
-- select 'Compresor de aire', id from public.lineas where nombre = 'Pintura Industrial'
-- on conflict (nombre, linea_id) do nothing;

-- =====================================================================
-- FIN DEL SCHEMA
-- =====================================================================
