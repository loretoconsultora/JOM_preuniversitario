-- JOM Preuniversitario — esquema inicial
-- Roles: alumno, docente (super administrador / profesora), directora (fundación, solo lectura)

-- ============================================================
-- profiles
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'alumno' check (role in ('alumno', 'docente', 'directora')),
  nombre_completo text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Funciones auxiliares (SECURITY DEFINER para poder consultar profiles
-- dentro de las policies de la propia tabla profiles sin recursión infinita).
create or replace function public.is_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('docente', 'directora')
  );
$$;

create or replace function public.is_docente()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'docente'
  );
$$;

create policy "profiles_select_own_or_staff"
on public.profiles for select
using (id = auth.uid() or public.is_staff());

-- Crea automáticamente el perfil cuando se crea un usuario en auth.users.
-- El rol y nombre se toman de user_metadata (raw_user_meta_data), pasado
-- al crear el usuario (signup normal o supabase.auth.admin.createUser).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, nombre_completo)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'role', 'alumno'),
    coalesce(new.raw_user_meta_data ->> 'nombre_completo', new.email)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- materias
-- ============================================================
create table public.materias (
  id uuid primary key default gen_random_uuid(),
  nombre text unique not null
);

alter table public.materias enable row level security;

create policy "materias_select_authenticated"
on public.materias for select
using (auth.uid() is not null);

insert into public.materias (nombre) values
  ('Química'),
  ('Física'),
  ('Matemáticas');

-- ============================================================
-- tareas
-- ============================================================
create table public.tareas (
  id uuid primary key default gen_random_uuid(),
  materia_id uuid not null references public.materias (id) on delete cascade,
  titulo text not null,
  descripcion text,
  fecha_entrega date,
  creado_por uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

alter table public.tareas enable row level security;

create policy "tareas_select_authenticated"
on public.tareas for select
using (auth.uid() is not null);

create policy "tareas_insert_docente"
on public.tareas for insert
with check (public.is_docente());

create policy "tareas_update_docente"
on public.tareas for update
using (public.is_docente())
with check (public.is_docente());

create policy "tareas_delete_docente"
on public.tareas for delete
using (public.is_docente());

-- ============================================================
-- evaluaciones
-- ============================================================
create table public.evaluaciones (
  id uuid primary key default gen_random_uuid(),
  alumno_id uuid not null references public.profiles (id) on delete cascade,
  materia_id uuid not null references public.materias (id) on delete cascade,
  titulo text not null,
  calificacion numeric(5, 2),
  comentario text,
  fecha date not null default current_date,
  creado_por uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

alter table public.evaluaciones enable row level security;

create policy "evaluaciones_select_own_or_staff"
on public.evaluaciones for select
using (alumno_id = auth.uid() or public.is_staff());

create policy "evaluaciones_insert_docente"
on public.evaluaciones for insert
with check (public.is_docente());

create policy "evaluaciones_update_docente"
on public.evaluaciones for update
using (public.is_docente())
with check (public.is_docente());

create policy "evaluaciones_delete_docente"
on public.evaluaciones for delete
using (public.is_docente());

-- ============================================================
-- índices
-- ============================================================
create index tareas_materia_id_idx on public.tareas (materia_id);
create index evaluaciones_alumno_id_idx on public.evaluaciones (alumno_id);
create index evaluaciones_materia_id_idx on public.evaluaciones (materia_id);
