-- Evaluaciones de orientación vocacional: mismo patrón que las
-- evaluaciones de habilidades de terapeuta (catálogo de atributos +
-- calificación 1-5 por evaluación), pero con una diferencia clave: en
-- terapeuta la evaluación se habilita por ciclo mensual; acá se habilita
-- por SESIÓN individual, una vez que esa cita queda "asistio" (puede
-- haber sesiones con o sin evaluación, no es obligatorio evaluar todas).
--
-- A diferencia de terapia (módulo privado), acá la directora sí tiene
-- acceso completo, igual que al resto de orientación vocacional. El
-- alumno no tiene acceso: es una herramienta de trabajo de la coach.

-- ============================================================
-- orientacion_atributos (catálogo compartido, igual patrón que "habilidades")
-- ============================================================
create table public.orientacion_atributos (
  id uuid primary key default gen_random_uuid(),
  nombre text unique not null,
  creado_por uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

alter table public.orientacion_atributos enable row level security;

create policy "orientacion_atributos_select_coach_o_directora"
on public.orientacion_atributos for select
using (public.is_coach_vocacional() or public.is_directora());

create policy "orientacion_atributos_insert_coach"
on public.orientacion_atributos for insert
with check (public.is_coach_vocacional());

create policy "orientacion_atributos_update_coach"
on public.orientacion_atributos for update
using (public.is_coach_vocacional());

create policy "orientacion_atributos_delete_coach"
on public.orientacion_atributos for delete
using (public.is_coach_vocacional());

-- ============================================================
-- orientacion_evaluaciones (una por sesión como máximo)
-- ============================================================
create table public.orientacion_evaluaciones (
  id uuid primary key default gen_random_uuid(),
  orientado_id uuid not null references public.orientados (id) on delete cascade,
  sesion_id uuid not null unique references public.orientacion_sesiones (id) on delete cascade,
  conclusiones text,
  creado_por uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

alter table public.orientacion_evaluaciones enable row level security;

create policy "orientacion_evaluaciones_all_own_coach"
on public.orientacion_evaluaciones for all
using (exists (select 1 from public.orientados o where o.id = orientado_id and o.coach_id = auth.uid()))
with check (exists (select 1 from public.orientados o where o.id = orientado_id and o.coach_id = auth.uid()));

create policy "orientacion_evaluaciones_select_directora"
on public.orientacion_evaluaciones for select
using (public.is_directora());

create index orientacion_evaluaciones_orientado_id_idx on public.orientacion_evaluaciones (orientado_id);

-- ============================================================
-- orientacion_evaluacion_calificaciones
-- ============================================================
create table public.orientacion_evaluacion_calificaciones (
  id uuid primary key default gen_random_uuid(),
  evaluacion_id uuid not null references public.orientacion_evaluaciones (id) on delete cascade,
  atributo_id uuid not null references public.orientacion_atributos (id) on delete cascade,
  calificacion smallint not null check (calificacion between 1 and 5)
);

alter table public.orientacion_evaluacion_calificaciones enable row level security;

create policy "orientacion_evaluacion_calificaciones_all_own_coach"
on public.orientacion_evaluacion_calificaciones for all
using (
  exists (
    select 1 from public.orientacion_evaluaciones e
    join public.orientados o on o.id = e.orientado_id
    where e.id = evaluacion_id and o.coach_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.orientacion_evaluaciones e
    join public.orientados o on o.id = e.orientado_id
    where e.id = evaluacion_id and o.coach_id = auth.uid()
  )
);

create policy "orientacion_evaluacion_calificaciones_select_directora"
on public.orientacion_evaluacion_calificaciones for select
using (public.is_directora());

create index orientacion_evaluacion_calificaciones_evaluacion_id_idx on public.orientacion_evaluacion_calificaciones (evaluacion_id);
