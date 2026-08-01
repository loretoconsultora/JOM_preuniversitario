-- Módulo de acompañamiento socioemocional / terapia.
-- Nuevo rol "terapeuta": todo el contenido clínico (pacientes, sesiones,
-- notas, evaluaciones) es privado — solo el terapeuta dueño del paciente
-- puede verlo o editarlo. Docente puede crear cuentas de terapeuta (igual
-- que hoy crea cuentas de alumno) pero no ve el contenido clínico.

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('alumno', 'docente', 'directora', 'terapeuta'));

create or replace function public.is_terapeuta()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'terapeuta'
  );
$$;

-- El terapeuta necesita poder ver el roster de alumnos para vincular
-- opcionalmente un paciente a una cuenta de alumno existente.
create policy "profiles_select_alumnos_for_terapeuta"
on public.profiles for select
using (role = 'alumno' and public.is_terapeuta());

-- ============================================================
-- pacientes
-- ============================================================
create table public.pacientes (
  id uuid primary key default gen_random_uuid(),
  terapeuta_id uuid not null references public.profiles (id) on delete cascade,
  alumno_id uuid references public.profiles (id) on delete set null,
  nombre text not null,
  motivo_referencia text,
  nota text,
  fecha_alta date not null default current_date,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.pacientes enable row level security;

create policy "pacientes_all_own_terapeuta"
on public.pacientes for all
using (terapeuta_id = auth.uid())
with check (terapeuta_id = auth.uid());

create index pacientes_terapeuta_id_idx on public.pacientes (terapeuta_id);

-- ============================================================
-- paciente_sesiones (agendamiento + control de asistencia)
-- ============================================================
create table public.paciente_sesiones (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references public.pacientes (id) on delete cascade,
  fecha date not null,
  hora time,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'asistio', 'no_asistio', 'reagendada')),
  nota text,
  reagendada_a_id uuid references public.paciente_sesiones (id) on delete set null,
  creado_por uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

alter table public.paciente_sesiones enable row level security;

create policy "paciente_sesiones_all_own_terapeuta"
on public.paciente_sesiones for all
using (exists (select 1 from public.pacientes p where p.id = paciente_id and p.terapeuta_id = auth.uid()))
with check (exists (select 1 from public.pacientes p where p.id = paciente_id and p.terapeuta_id = auth.uid()));

create index paciente_sesiones_paciente_id_idx on public.paciente_sesiones (paciente_id);
create index paciente_sesiones_fecha_idx on public.paciente_sesiones (fecha);

-- ============================================================
-- habilidades (catálogo compartido entre terapeutas, escala fija 1-5)
-- ============================================================
create table public.habilidades (
  id uuid primary key default gen_random_uuid(),
  nombre text unique not null,
  creado_por uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

alter table public.habilidades enable row level security;

create policy "habilidades_select_terapeuta"
on public.habilidades for select
using (public.is_terapeuta());

create policy "habilidades_insert_terapeuta"
on public.habilidades for insert
with check (public.is_terapeuta());

create policy "habilidades_delete_terapeuta"
on public.habilidades for delete
using (public.is_terapeuta());

-- ============================================================
-- evaluaciones_habilidades (una por paciente por periodo ~mensual)
-- ============================================================
create table public.evaluaciones_habilidades (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references public.pacientes (id) on delete cascade,
  numero_periodo int not null default 1,
  conclusiones text,
  creado_por uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

alter table public.evaluaciones_habilidades enable row level security;

create policy "evaluaciones_habilidades_all_own_terapeuta"
on public.evaluaciones_habilidades for all
using (exists (select 1 from public.pacientes p where p.id = paciente_id and p.terapeuta_id = auth.uid()))
with check (exists (select 1 from public.pacientes p where p.id = paciente_id and p.terapeuta_id = auth.uid()));

create index evaluaciones_habilidades_paciente_id_idx on public.evaluaciones_habilidades (paciente_id);

create table public.evaluacion_habilidad_calificaciones (
  id uuid primary key default gen_random_uuid(),
  evaluacion_id uuid not null references public.evaluaciones_habilidades (id) on delete cascade,
  habilidad_id uuid not null references public.habilidades (id) on delete cascade,
  calificacion smallint not null check (calificacion between 1 and 5)
);

alter table public.evaluacion_habilidad_calificaciones enable row level security;

create policy "evaluacion_habilidad_calificaciones_all_own_terapeuta"
on public.evaluacion_habilidad_calificaciones for all
using (
  exists (
    select 1 from public.evaluaciones_habilidades e
    join public.pacientes p on p.id = e.paciente_id
    where e.id = evaluacion_id and p.terapeuta_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.evaluaciones_habilidades e
    join public.pacientes p on p.id = e.paciente_id
    where e.id = evaluacion_id and p.terapeuta_id = auth.uid()
  )
);

create index evaluacion_habilidad_calificaciones_evaluacion_id_idx on public.evaluacion_habilidad_calificaciones (evaluacion_id);
