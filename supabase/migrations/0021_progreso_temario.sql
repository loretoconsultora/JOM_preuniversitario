-- Progreso real de un alumno por materia: a diferencia del indicador de
-- "temas con contenido" (que mide si el docente ya cargó material), esto
-- mide si el alumno ya interactuó con ese material — abrió el archivo
-- adjunto de un tema, entregó/presentó una tarea vinculada a ese tema, o
-- respondió un examen vinculado a ese tema. tarea_entregas/tarea_intentos
-- y examen_intentos ya existen para tareas/exámenes; solo falta registrar
-- cuándo un alumno abre un archivo adjunto del temario (mismo patrón que
-- recurso_vistas).
create table public.tema_archivo_vistas (
  id uuid primary key default gen_random_uuid(),
  archivo_id uuid not null references public.tema_archivos (id) on delete cascade,
  alumno_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (archivo_id, alumno_id)
);

alter table public.tema_archivo_vistas enable row level security;

create policy "tema_archivo_vistas_select_own_or_staff"
on public.tema_archivo_vistas for select
using (alumno_id = auth.uid() or public.is_staff());

create policy "tema_archivo_vistas_insert_own"
on public.tema_archivo_vistas for insert
with check (alumno_id = auth.uid());

create index tema_archivo_vistas_archivo_id_idx on public.tema_archivo_vistas (archivo_id);
create index tema_archivo_vistas_alumno_id_idx on public.tema_archivo_vistas (alumno_id);
