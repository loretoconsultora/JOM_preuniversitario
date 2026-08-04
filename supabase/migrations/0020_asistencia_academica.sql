-- Asistencia académica por clase (distinta de la asistencia de terapia):
-- cada docente registra, por sesión de clase de su materia, quién asistió
-- y quién faltó. Directora/área administrativa ve el reporte agregado de
-- cumplimiento por alumno, para transparencia. Pedido de Sofia Razo Soto
-- en la capacitación del 4 ago 2026.

create table public.clase_sesiones (
  id uuid primary key default gen_random_uuid(),
  materia_id uuid not null references public.materias (id) on delete cascade,
  fecha date not null,
  nota text,
  creado_por uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

alter table public.clase_sesiones enable row level security;

create policy "clase_sesiones_select_staff"
on public.clase_sesiones for select
using (public.is_staff());

create policy "clase_sesiones_insert_docente"
on public.clase_sesiones for insert
with check (public.materia_gestionable(materia_id));

create policy "clase_sesiones_update_docente"
on public.clase_sesiones for update
using (public.materia_gestionable(materia_id))
with check (public.materia_gestionable(materia_id));

create policy "clase_sesiones_delete_docente"
on public.clase_sesiones for delete
using (public.materia_gestionable(materia_id));

create index clase_sesiones_materia_id_idx on public.clase_sesiones (materia_id);

-- ============================================================
-- clase_asistencias: quién asistió en cada sesión (una fila por alumno,
-- para poder contar tanto presentes como ausentes).
-- ============================================================
create table public.clase_asistencias (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references public.clase_sesiones (id) on delete cascade,
  alumno_id uuid not null references public.profiles (id) on delete cascade,
  presente boolean not null default false,
  unique (sesion_id, alumno_id)
);

alter table public.clase_asistencias enable row level security;

create policy "clase_asistencias_select_own_or_staff"
on public.clase_asistencias for select
using (alumno_id = auth.uid() or public.is_staff());

create policy "clase_asistencias_insert_docente"
on public.clase_asistencias for insert
with check (
  exists (select 1 from public.clase_sesiones s where s.id = sesion_id and public.materia_gestionable(s.materia_id))
);

create policy "clase_asistencias_update_docente"
on public.clase_asistencias for update
using (
  exists (select 1 from public.clase_sesiones s where s.id = sesion_id and public.materia_gestionable(s.materia_id))
)
with check (
  exists (select 1 from public.clase_sesiones s where s.id = sesion_id and public.materia_gestionable(s.materia_id))
);

create policy "clase_asistencias_delete_docente"
on public.clase_asistencias for delete
using (
  exists (select 1 from public.clase_sesiones s where s.id = sesion_id and public.materia_gestionable(s.materia_id))
);

create index clase_asistencias_sesion_id_idx on public.clase_asistencias (sesion_id);
create index clase_asistencias_alumno_id_idx on public.clase_asistencias (alumno_id);

-- ============================================================
-- materia_alumnos: inscripción de un alumno a una materia. No todos los
-- alumnos toman todas las materias — un docente inscribe a los suyos
-- (mismo criterio que materia_docentes: sin filas = comportamiento
-- actual sin acotar, el alumno ve todas las materias; con al menos una
-- inscripción, solo ve esas). Se gestiona desde Asistencia académica.
-- ============================================================
create table public.materia_alumnos (
  materia_id uuid not null references public.materias (id) on delete cascade,
  alumno_id uuid not null references public.profiles (id) on delete cascade,
  inscrito_por uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  primary key (materia_id, alumno_id)
);

alter table public.materia_alumnos enable row level security;

create policy "materia_alumnos_select_own_or_staff"
on public.materia_alumnos for select
using (alumno_id = auth.uid() or public.is_staff());

create policy "materia_alumnos_insert_docente"
on public.materia_alumnos for insert
with check (public.materia_gestionable(materia_id));

create policy "materia_alumnos_delete_docente"
on public.materia_alumnos for delete
using (public.materia_gestionable(materia_id));

create index materia_alumnos_alumno_id_idx on public.materia_alumnos (alumno_id);

-- ============================================================
-- materia_vistas: registra cuándo un alumno abrió por última vez el
-- temario de cada materia, para ordenar "Mis materias" por actividad
-- reciente.
-- ============================================================
create table public.materia_vistas (
  alumno_id uuid not null references public.profiles (id) on delete cascade,
  materia_id uuid not null references public.materias (id) on delete cascade,
  last_viewed_at timestamptz not null default now(),
  primary key (alumno_id, materia_id)
);

alter table public.materia_vistas enable row level security;

create policy "materia_vistas_all_own"
on public.materia_vistas for all
using (alumno_id = auth.uid())
with check (alumno_id = auth.uid());

create policy "materia_vistas_select_staff"
on public.materia_vistas for select
using (public.is_staff());
