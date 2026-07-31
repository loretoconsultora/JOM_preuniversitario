-- Vincula tareas y exámenes a un tema del Temario (opcional), para que cada
-- tema muestre ordenados los ejercicios/evaluaciones que le corresponden.
-- Es solo un índice organizativo: no cambia dónde se revisan calificaciones
-- ni agrega entrega de archivos por parte del alumno.

alter table public.tareas add column tema_id uuid references public.temas (id) on delete set null;
alter table public.examenes add column tema_id uuid references public.temas (id) on delete set null;

create index tareas_tema_id_idx on public.tareas (tema_id);
create index examenes_tema_id_idx on public.examenes (tema_id);
