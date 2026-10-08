-- Nuevo rol "coach_vocacional": acompañamiento de orientación vocacional
-- (decisión de carrera/universidad). A diferencia del módulo de terapia
-- (100% privado), aquí el alumno vinculado SÍ puede ver su propio plan,
-- resultados de tests, notas y sesiones — no es información clínica.
-- Directora tiene lectura completa de todo el módulo (igual criterio de
-- supervisión que ya existe en la plataforma, aplicado aquí sin
-- restricción porque el contenido no es confidencial para el alumno).

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('alumno', 'docente', 'directora', 'terapeuta', 'coach_vocacional'));

create or replace function public.is_coach_vocacional()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and (role = 'coach_vocacional' or 'coach_vocacional' = any(roles))
  );
$$;

-- ============================================================
-- orientados (el "caso": un alumno en proceso de orientación vocacional)
-- ============================================================
create table public.orientados (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles (id) on delete cascade,
  alumno_id uuid references public.profiles (id) on delete set null,
  nombre text not null,
  objetivo text,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.orientados enable row level security;

create policy "orientados_all_own_coach"
on public.orientados for all
using (coach_id = auth.uid())
with check (coach_id = auth.uid());

create policy "orientados_select_own_alumno"
on public.orientados for select
using (alumno_id = auth.uid());

create policy "orientados_select_directora"
on public.orientados for select
using (public.is_directora());

create index orientados_coach_id_idx on public.orientados (coach_id);
create index orientados_alumno_id_idx on public.orientados (alumno_id);

-- ============================================================
-- orientacion_sesiones (sesiones 1:1, mismo patrón que paciente_sesiones)
-- ============================================================
create table public.orientacion_sesiones (
  id uuid primary key default gen_random_uuid(),
  orientado_id uuid not null references public.orientados (id) on delete cascade,
  fecha date not null,
  hora time,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'asistio', 'no_asistio', 'reagendada')),
  nota text,
  reagendada_a_id uuid references public.orientacion_sesiones (id) on delete set null,
  creado_por uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

alter table public.orientacion_sesiones enable row level security;

create policy "orientacion_sesiones_all_own_coach"
on public.orientacion_sesiones for all
using (exists (select 1 from public.orientados o where o.id = orientado_id and o.coach_id = auth.uid()))
with check (exists (select 1 from public.orientados o where o.id = orientado_id and o.coach_id = auth.uid()));

create policy "orientacion_sesiones_select_own_alumno"
on public.orientacion_sesiones for select
using (exists (select 1 from public.orientados o where o.id = orientado_id and o.alumno_id = auth.uid()));

create policy "orientacion_sesiones_select_directora"
on public.orientacion_sesiones for select
using (public.is_directora());

create index orientacion_sesiones_orientado_id_idx on public.orientacion_sesiones (orientado_id);
create index orientacion_sesiones_fecha_idx on public.orientacion_sesiones (fecha);

-- ============================================================
-- orientacion_tests (resultados de tests vocacionales)
-- ============================================================
create table public.orientacion_tests (
  id uuid primary key default gen_random_uuid(),
  orientado_id uuid not null references public.orientados (id) on delete cascade,
  nombre_test text not null,
  resultado text,
  storage_path text,
  nombre_archivo text,
  tipo_mime text,
  tamano_bytes bigint,
  fecha date not null default current_date,
  creado_por uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

alter table public.orientacion_tests enable row level security;

create policy "orientacion_tests_all_own_coach"
on public.orientacion_tests for all
using (exists (select 1 from public.orientados o where o.id = orientado_id and o.coach_id = auth.uid()))
with check (exists (select 1 from public.orientados o where o.id = orientado_id and o.coach_id = auth.uid()));

create policy "orientacion_tests_select_own_alumno"
on public.orientacion_tests for select
using (exists (select 1 from public.orientados o where o.id = orientado_id and o.alumno_id = auth.uid()));

create policy "orientacion_tests_select_directora"
on public.orientacion_tests for select
using (public.is_directora());

create index orientacion_tests_orientado_id_idx on public.orientacion_tests (orientado_id);

-- ============================================================
-- orientacion_plan (documento vivo, una fila por orientado)
-- ============================================================
create table public.orientacion_plan (
  orientado_id uuid primary key references public.orientados (id) on delete cascade,
  metas text,
  carreras_interes text,
  universidades_interes text,
  proximos_pasos text,
  actualizado_por uuid references public.profiles (id),
  updated_at timestamptz not null default now()
);

alter table public.orientacion_plan enable row level security;

create policy "orientacion_plan_all_own_coach"
on public.orientacion_plan for all
using (exists (select 1 from public.orientados o where o.id = orientado_id and o.coach_id = auth.uid()))
with check (exists (select 1 from public.orientados o where o.id = orientado_id and o.coach_id = auth.uid()));

create policy "orientacion_plan_select_own_alumno"
on public.orientacion_plan for select
using (exists (select 1 from public.orientados o where o.id = orientado_id and o.alumno_id = auth.uid()));

create policy "orientacion_plan_select_directora"
on public.orientacion_plan for select
using (public.is_directora());

-- ============================================================
-- orientacion_notas (bitácora de notas sueltas, mismo patrón que paciente_notas)
-- ============================================================
create table public.orientacion_notas (
  id uuid primary key default gen_random_uuid(),
  orientado_id uuid not null references public.orientados (id) on delete cascade,
  contenido text not null,
  creado_por uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

alter table public.orientacion_notas enable row level security;

create policy "orientacion_notas_all_own_coach"
on public.orientacion_notas for all
using (exists (select 1 from public.orientados o where o.id = orientado_id and o.coach_id = auth.uid()))
with check (exists (select 1 from public.orientados o where o.id = orientado_id and o.coach_id = auth.uid()));

create policy "orientacion_notas_select_own_alumno"
on public.orientacion_notas for select
using (exists (select 1 from public.orientados o where o.id = orientado_id and o.alumno_id = auth.uid()));

create policy "orientacion_notas_select_directora"
on public.orientacion_notas for select
using (public.is_directora());

create index orientacion_notas_orientado_id_idx on public.orientacion_notas (orientado_id);

-- ============================================================
-- orientacion_recursos (biblioteca de la coach: general o por orientado)
-- orientado_id NULL = recurso general, visible a todos sus orientados.
-- orientado_id definido = adjunto puntual a un caso.
-- ============================================================
create table public.orientacion_recursos (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles (id) on delete cascade,
  orientado_id uuid references public.orientados (id) on delete cascade,
  titulo text not null,
  tipo text not null check (tipo in ('archivo', 'enlace')),
  storage_path text,
  nombre_archivo text,
  tipo_mime text,
  tamano_bytes bigint,
  url text,
  creado_por uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  constraint orientacion_recursos_tipo_consistente check (
    (tipo = 'archivo' and storage_path is not null and url is null)
    or (tipo = 'enlace' and url is not null and storage_path is null)
  )
);

alter table public.orientacion_recursos enable row level security;

create policy "orientacion_recursos_all_own_coach"
on public.orientacion_recursos for all
using (coach_id = auth.uid())
with check (coach_id = auth.uid());

-- El alumno ve los recursos generales de SU coach (orientado_id is null) y
-- los adjuntados puntualmente a su propio caso.
create policy "orientacion_recursos_select_own_alumno"
on public.orientacion_recursos for select
using (
  exists (
    select 1 from public.orientados o
    where o.alumno_id = auth.uid()
      and o.coach_id = orientacion_recursos.coach_id
      and (orientacion_recursos.orientado_id is null or orientacion_recursos.orientado_id = o.id)
  )
);

create policy "orientacion_recursos_select_directora"
on public.orientacion_recursos for select
using (public.is_directora());

create index orientacion_recursos_coach_id_idx on public.orientacion_recursos (coach_id);
create index orientacion_recursos_orientado_id_idx on public.orientacion_recursos (orientado_id);

-- ============================================================
-- Storage: buckets privados para tests y recursos de orientación.
-- A diferencia de paciente-documentos (100% privado del terapeuta), acá
-- también deben poder leer el alumno vinculado y la directora, así que la
-- política de SELECT es más amplia (igual trade-off que ya usa el resto de
-- la plataforma: la protección real está en que la app solo pide firmar
-- URLs de paths que ya filtró por RLS en las tablas).
-- ============================================================
insert into storage.buckets (id, name, public)
values ('orientacion-tests', 'orientacion-tests', false)
on conflict (id) do nothing;

create policy "orientacion_tests_storage_select"
on storage.objects for select
using (
  bucket_id = 'orientacion-tests' and (
    public.is_coach_vocacional()
    or public.is_directora()
    or exists (select 1 from public.orientados where alumno_id = auth.uid())
  )
);

create policy "orientacion_tests_storage_insert_coach"
on storage.objects for insert
with check (bucket_id = 'orientacion-tests' and public.is_coach_vocacional());

create policy "orientacion_tests_storage_delete_coach"
on storage.objects for delete
using (bucket_id = 'orientacion-tests' and public.is_coach_vocacional());

insert into storage.buckets (id, name, public)
values ('orientacion-recursos', 'orientacion-recursos', false)
on conflict (id) do nothing;

create policy "orientacion_recursos_storage_select"
on storage.objects for select
using (
  bucket_id = 'orientacion-recursos' and (
    public.is_coach_vocacional()
    or public.is_directora()
    or exists (select 1 from public.orientados where alumno_id = auth.uid())
  )
);

create policy "orientacion_recursos_storage_insert_coach"
on storage.objects for insert
with check (bucket_id = 'orientacion-recursos' and public.is_coach_vocacional());

create policy "orientacion_recursos_storage_delete_coach"
on storage.objects for delete
using (bucket_id = 'orientacion-recursos' and public.is_coach_vocacional());
