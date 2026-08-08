-- Fecha/hora de apertura y de cierre para Exámenes, igual que Tareas ya
-- tiene fecha_entrega/hora_limite. Ambas son opcionales e independientes:
-- sin apertura, el examen está disponible desde que se crea; sin cierre,
-- nunca se cierra. Aplica a cualquier materia y a cualquier docente que
-- cree un examen (no es exclusivo de Productividad con IA).

alter table public.examenes add column fecha_apertura date;
alter table public.examenes add column hora_apertura time;
alter table public.examenes add column fecha_cierre date;
alter table public.examenes add column hora_cierre time;

alter table public.examenes add constraint examenes_apertura_antes_cierre
  check (
    fecha_apertura is null or fecha_cierre is null or fecha_cierre >= fecha_apertura
  );
