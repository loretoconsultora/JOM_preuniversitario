-- Notas/observaciones por alumno en cada clase (puntualidad,
-- participación, etc.), pedido de la transcripción de Ali y Laura.
-- Texto libre, una nota por alumno por sesión (se sobreescribe si se
-- edita, no es un historial de múltiples entradas). Se guarda en una
-- tabla separada de clase_asistencias (no una columna ahí) para que el
-- alumno NO pueda verla: clase_asistencias ya le da SELECT de su propia
-- fila (para ver si se le marcó presente), y RLS no filtra por columna,
-- así que una columna "nota" ahí quedaría expuesta a su propia lectura.

create table public.clase_notas_alumno (
  sesion_id uuid not null references public.clase_sesiones (id) on delete cascade,
  alumno_id uuid not null references public.profiles (id) on delete cascade,
  nota text not null,
  creado_por uuid not null references public.profiles (id),
  updated_at timestamptz not null default now(),
  primary key (sesion_id, alumno_id)
);

alter table public.clase_notas_alumno enable row level security;

-- Igual que clase_sesiones: cualquier docente o la directora puede leer
-- (no se acota a "su" materia para lectura, mismo criterio ya usado);
-- solo el docente de esa materia puede escribir.
create policy "clase_notas_alumno_select_staff"
on public.clase_notas_alumno for select
using (public.is_staff());

create policy "clase_notas_alumno_insert_docente"
on public.clase_notas_alumno for insert
with check (
  exists (select 1 from public.clase_sesiones s where s.id = sesion_id and public.materia_gestionable(s.materia_id))
);

create policy "clase_notas_alumno_update_docente"
on public.clase_notas_alumno for update
using (
  exists (select 1 from public.clase_sesiones s where s.id = sesion_id and public.materia_gestionable(s.materia_id))
)
with check (
  exists (select 1 from public.clase_sesiones s where s.id = sesion_id and public.materia_gestionable(s.materia_id))
);

create policy "clase_notas_alumno_delete_docente"
on public.clase_notas_alumno for delete
using (
  exists (select 1 from public.clase_sesiones s where s.id = sesion_id and public.materia_gestionable(s.materia_id))
);

create index clase_notas_alumno_sesion_id_idx on public.clase_notas_alumno (sesion_id);
