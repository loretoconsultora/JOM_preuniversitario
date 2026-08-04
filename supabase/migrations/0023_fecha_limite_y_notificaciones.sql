-- Fecha y hora límite de entrega para tareas: si no se especifica hora, se
-- asume 23:59 de fecha_entrega (ver src/lib/fecha-limite-tarea.ts). Pasada
-- la hora límite, el alumno ya no puede cargar ni editar su entrega —
-- validado en las server actions de tareas/entrega-actions.ts.
alter table public.tareas add column hora_limite time;

-- Evita reenviar el correo de aviso a los docentes cada vez que el alumno
-- edita su entrega (archivo nuevo, texto actualizado): solo se notifica la
-- primera vez que hay algo que revisar para esa tarea.
alter table public.tarea_entregas add column notificado boolean not null default false;

-- Los cuestionarios de opción múltiple (en tareas o exámenes) ya se
-- autocalifican; ahora también generan su fila en Calificaciones en
-- automático, para que no haya que capturarla a mano. examen_id es el
-- equivalente de tarea_id para ese caso.
alter table public.calificaciones add column examen_id uuid references public.examenes (id) on delete set null;
create index calificaciones_examen_id_idx on public.calificaciones (examen_id);
