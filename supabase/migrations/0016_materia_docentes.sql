-- Acota el acceso de un docente a materias específicas, SIN crear un rol
-- nuevo. Un docente SIN filas en materia_docentes conserva acceso total
-- (comportamiento actual: docente "administrador"). Un docente CON filas
-- queda limitado a escribir contenido solo en esas materias.

create table public.materia_docentes (
  materia_id uuid not null references public.materias (id) on delete cascade,
  docente_id uuid not null references public.profiles (id) on delete cascade,
  primary key (materia_id, docente_id)
);

alter table public.materia_docentes enable row level security;

create policy "materia_docentes_select_staff"
on public.materia_docentes for select
using (public.is_staff());

-- Las asignaciones se gestionan desde server actions con la service role
-- key (mismo patrón que la creación de cuentas de docente/terapeuta), así
-- que no hace falta una policy de escritura para el rol autenticado normal.

create or replace function public.tiene_materias_asignadas(docente uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.materia_docentes where docente_id = docente);
$$;

-- true si el docente autenticado puede crear/editar contenido de esa
-- materia: docente sin asignaciones (acceso total) o docente asignado
-- justo a esa materia. Si materia es null (ej. un recurso general sin
-- materia), solo el docente sin restricciones puede gestionarlo.
create or replace function public.materia_gestionable(materia uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.is_docente() and (
    not public.tiene_materias_asignadas(auth.uid())
    or (materia is not null and exists (
      select 1 from public.materia_docentes
      where docente_id = auth.uid() and materia_id = materia
    ))
  );
$$;

-- ============================================================
-- materias
-- ============================================================
drop policy "materias_update_docente" on public.materias;
create policy "materias_update_docente"
on public.materias for update
using (public.materia_gestionable(id))
with check (public.materia_gestionable(id));

-- ============================================================
-- tareas / calificaciones
-- ============================================================
drop policy "tareas_insert_docente" on public.tareas;
create policy "tareas_insert_docente"
on public.tareas for insert
with check (public.materia_gestionable(materia_id));

drop policy "tareas_update_docente" on public.tareas;
create policy "tareas_update_docente"
on public.tareas for update
using (public.materia_gestionable(materia_id))
with check (public.materia_gestionable(materia_id));

drop policy "tareas_delete_docente" on public.tareas;
create policy "tareas_delete_docente"
on public.tareas for delete
using (public.materia_gestionable(materia_id));

drop policy "calificaciones_insert_docente" on public.calificaciones;
create policy "calificaciones_insert_docente"
on public.calificaciones for insert
with check (public.materia_gestionable(materia_id));

drop policy "calificaciones_update_docente" on public.calificaciones;
create policy "calificaciones_update_docente"
on public.calificaciones for update
using (public.materia_gestionable(materia_id))
with check (public.materia_gestionable(materia_id));

drop policy "calificaciones_delete_docente" on public.calificaciones;
create policy "calificaciones_delete_docente"
on public.calificaciones for delete
using (public.materia_gestionable(materia_id));

drop policy "tarea_archivos_insert_docente" on public.tarea_archivos;
create policy "tarea_archivos_insert_docente"
on public.tarea_archivos for insert
with check (
  exists (select 1 from public.tareas t where t.id = tarea_id and public.materia_gestionable(t.materia_id))
);

drop policy "tarea_archivos_delete_docente" on public.tarea_archivos;
create policy "tarea_archivos_delete_docente"
on public.tarea_archivos for delete
using (
  exists (select 1 from public.tareas t where t.id = tarea_id and public.materia_gestionable(t.materia_id))
);

-- ============================================================
-- exámenes
-- ============================================================
drop policy "examenes_insert_docente" on public.examenes;
create policy "examenes_insert_docente"
on public.examenes for insert
with check (public.materia_gestionable(materia_id));

drop policy "examenes_delete_docente" on public.examenes;
create policy "examenes_delete_docente"
on public.examenes for delete
using (public.materia_gestionable(materia_id));

drop policy "examen_preguntas_insert_docente" on public.examen_preguntas;
create policy "examen_preguntas_insert_docente"
on public.examen_preguntas for insert
with check (
  exists (select 1 from public.examenes e where e.id = examen_id and public.materia_gestionable(e.materia_id))
);

drop policy "examen_preguntas_delete_docente" on public.examen_preguntas;
create policy "examen_preguntas_delete_docente"
on public.examen_preguntas for delete
using (
  exists (select 1 from public.examenes e where e.id = examen_id and public.materia_gestionable(e.materia_id))
);

drop policy "examen_alumnos_insert_docente" on public.examen_alumnos;
create policy "examen_alumnos_insert_docente"
on public.examen_alumnos for insert
with check (
  exists (select 1 from public.examenes e where e.id = examen_id and public.materia_gestionable(e.materia_id))
);

drop policy "examen_alumnos_delete_docente" on public.examen_alumnos;
create policy "examen_alumnos_delete_docente"
on public.examen_alumnos for delete
using (
  exists (select 1 from public.examenes e where e.id = examen_id and public.materia_gestionable(e.materia_id))
);

-- ============================================================
-- recursos
-- ============================================================
drop policy "recursos_insert_docente" on public.recursos;
create policy "recursos_insert_docente"
on public.recursos for insert
with check (public.materia_gestionable(materia_id));

drop policy "recursos_delete_docente" on public.recursos;
create policy "recursos_delete_docente"
on public.recursos for delete
using (public.materia_gestionable(materia_id));

-- ============================================================
-- temario: temas / tema_archivos / subtemas / subtema_ejercicios / subtema_videos
-- ============================================================
drop policy "temas_insert_docente" on public.temas;
create policy "temas_insert_docente"
on public.temas for insert
with check (public.materia_gestionable(materia_id));

drop policy "temas_update_docente" on public.temas;
create policy "temas_update_docente"
on public.temas for update
using (public.materia_gestionable(materia_id))
with check (public.materia_gestionable(materia_id));

drop policy "temas_delete_docente" on public.temas;
create policy "temas_delete_docente"
on public.temas for delete
using (public.materia_gestionable(materia_id));

drop policy "tema_archivos_insert_docente" on public.tema_archivos;
create policy "tema_archivos_insert_docente"
on public.tema_archivos for insert
with check (
  exists (select 1 from public.temas t where t.id = tema_id and public.materia_gestionable(t.materia_id))
);

drop policy "tema_archivos_delete_docente" on public.tema_archivos;
create policy "tema_archivos_delete_docente"
on public.tema_archivos for delete
using (
  exists (select 1 from public.temas t where t.id = tema_id and public.materia_gestionable(t.materia_id))
);

drop policy "subtemas_insert_docente" on public.subtemas;
create policy "subtemas_insert_docente"
on public.subtemas for insert
with check (
  exists (select 1 from public.temas t where t.id = tema_id and public.materia_gestionable(t.materia_id))
);

drop policy "subtemas_delete_docente" on public.subtemas;
create policy "subtemas_delete_docente"
on public.subtemas for delete
using (
  exists (select 1 from public.temas t where t.id = tema_id and public.materia_gestionable(t.materia_id))
);

drop policy "subtema_ejercicios_insert_docente" on public.subtema_ejercicios;
create policy "subtema_ejercicios_insert_docente"
on public.subtema_ejercicios for insert
with check (
  exists (
    select 1 from public.subtemas s
    join public.temas t on t.id = s.tema_id
    where s.id = subtema_id and public.materia_gestionable(t.materia_id)
  )
);

drop policy "subtema_ejercicios_delete_docente" on public.subtema_ejercicios;
create policy "subtema_ejercicios_delete_docente"
on public.subtema_ejercicios for delete
using (
  exists (
    select 1 from public.subtemas s
    join public.temas t on t.id = s.tema_id
    where s.id = subtema_id and public.materia_gestionable(t.materia_id)
  )
);

drop policy "subtema_videos_insert_docente" on public.subtema_videos;
create policy "subtema_videos_insert_docente"
on public.subtema_videos for insert
with check (
  exists (
    select 1 from public.subtemas s
    join public.temas t on t.id = s.tema_id
    where s.id = subtema_id and public.materia_gestionable(t.materia_id)
  )
);

drop policy "subtema_videos_delete_docente" on public.subtema_videos;
create policy "subtema_videos_delete_docente"
on public.subtema_videos for delete
using (
  exists (
    select 1 from public.subtemas s
    join public.temas t on t.id = s.tema_id
    where s.id = subtema_id and public.materia_gestionable(t.materia_id)
  )
);
