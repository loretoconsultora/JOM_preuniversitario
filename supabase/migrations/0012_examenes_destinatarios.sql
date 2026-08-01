-- Exámenes personalizados: el docente puede dejar un examen abierto a todos
-- los alumnos (comportamiento por defecto, sin filas en examen_alumnos) o
-- restringirlo a un grupo específico.

create table public.examen_alumnos (
  id uuid primary key default gen_random_uuid(),
  examen_id uuid not null references public.examenes (id) on delete cascade,
  alumno_id uuid not null references public.profiles (id) on delete cascade,
  unique (examen_id, alumno_id)
);

alter table public.examen_alumnos enable row level security;

create policy "examen_alumnos_select_own_or_staff"
on public.examen_alumnos for select
using (alumno_id = auth.uid() or public.is_staff());

create policy "examen_alumnos_insert_docente"
on public.examen_alumnos for insert
with check (public.is_docente());

create policy "examen_alumnos_delete_docente"
on public.examen_alumnos for delete
using (public.is_docente());

create index examen_alumnos_examen_id_idx on public.examen_alumnos (examen_id);
create index examen_alumnos_alumno_id_idx on public.examen_alumnos (alumno_id);

-- SECURITY DEFINER: evalúa la visibilidad ignorando el RLS de examen_alumnos,
-- para que la comprobación vea la lista completa de destinatarios y no solo
-- la fila del propio alumno (si no, un examen personalizado para otros
-- alumnos se vería incorrectamente como "abierto a todos").
create or replace function public.examen_visible_para_usuario(examen uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    public.is_staff()
    or not exists (select 1 from public.examen_alumnos where examen_id = examen)
    or exists (select 1 from public.examen_alumnos where examen_id = examen and alumno_id = auth.uid());
$$;

drop policy "examenes_select_authenticated" on public.examenes;

create policy "examenes_select_visible"
on public.examenes for select
using (public.examen_visible_para_usuario(id));
