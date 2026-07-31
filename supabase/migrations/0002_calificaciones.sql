-- Renombra "evaluaciones" a "calificaciones" y permite vincularlas a una
-- tarea existente, para que el alumno vea en un solo lugar tanto sus notas
-- de examen como las calificaciones de sus tareas.

alter table public.evaluaciones rename to calificaciones;

alter index evaluaciones_alumno_id_idx rename to calificaciones_alumno_id_idx;
alter index evaluaciones_materia_id_idx rename to calificaciones_materia_id_idx;

alter policy "evaluaciones_select_own_or_staff" on public.calificaciones
  rename to "calificaciones_select_own_or_staff";
alter policy "evaluaciones_insert_docente" on public.calificaciones
  rename to "calificaciones_insert_docente";
alter policy "evaluaciones_update_docente" on public.calificaciones
  rename to "calificaciones_update_docente";
alter policy "evaluaciones_delete_docente" on public.calificaciones
  rename to "calificaciones_delete_docente";

-- Vínculo opcional a una tarea: si se califica una tarea puntual, se guarda
-- aquí en lugar de crear una "evaluación" totalmente aparte.
alter table public.calificaciones
  add column tarea_id uuid references public.tareas (id) on delete cascade;

create index calificaciones_tarea_id_idx on public.calificaciones (tarea_id);
