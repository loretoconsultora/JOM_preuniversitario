-- Notificaciones in-app para el alumno: le avisa cuando el docente lo
-- calificó en una tarea o examen (mismo patrón que notificaciones_docente).
create table public.notificaciones_alumno (
  id uuid primary key default gen_random_uuid(),
  alumno_id uuid not null references public.profiles (id) on delete cascade,
  mensaje text not null,
  materia_id uuid references public.materias (id) on delete set null,
  tarea_id uuid references public.tareas (id) on delete cascade,
  examen_id uuid references public.examenes (id) on delete cascade,
  leida boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notificaciones_alumno enable row level security;

create policy "notificaciones_alumno_select_own"
on public.notificaciones_alumno for select
using (alumno_id = auth.uid());

create policy "notificaciones_alumno_update_own"
on public.notificaciones_alumno for update
using (alumno_id = auth.uid())
with check (alumno_id = auth.uid());

-- A diferencia de notificaciones_docente (insertada con service role desde
-- server actions que corren con la sesión del alumno), esta se inserta
-- desde crearCalificacion/actualizarCalificacion, que ya corren con la
-- sesión normal del docente — solo hace falta permitirle el insert.
create policy "notificaciones_alumno_insert_docente"
on public.notificaciones_alumno for insert
with check (public.is_docente());

create index notificaciones_alumno_alumno_id_idx on public.notificaciones_alumno (alumno_id, created_at desc);
