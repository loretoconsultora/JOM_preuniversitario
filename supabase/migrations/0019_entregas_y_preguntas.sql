-- Entregas de alumno para Tareas (evidencia en archivo, respuesta de
-- texto tipo "foro/actividad", preguntas embebidas con autocalificación)
-- y soporte de preguntas abiertas (texto libre, sin autocalificar) en
-- Exámenes, además de en Tareas.

-- ============================================================
-- examen_preguntas / examen_intentos: preguntas abiertas
-- ============================================================
alter table public.examen_preguntas add column tipo text not null default 'multiple'
  check (tipo in ('multiple', 'abierta'));
alter table public.examen_preguntas alter column opciones drop not null;
alter table public.examen_preguntas alter column respuesta_correcta drop not null;
alter table public.examen_preguntas add constraint examen_preguntas_multiple_completa
  check (tipo <> 'multiple' or (opciones is not null and respuesta_correcta is not null));

-- calificacion puede quedar null si el examen es 100% preguntas abiertas
-- (pendiente de revisión manual del docente, no hay nada que autocalificar).
alter table public.examen_intentos alter column calificacion drop not null;

-- ============================================================
-- tareas: bandera para pedir respuesta de texto (tipo "foro"/actividad)
-- ============================================================
alter table public.tareas add column pide_respuesta_texto boolean not null default false;

-- ============================================================
-- tarea_entregas: una fila por (tarea, alumno). Contiene la respuesta de
-- texto si la tarea la pide; la evidencia en archivo va aparte.
-- ============================================================
create table public.tarea_entregas (
  id uuid primary key default gen_random_uuid(),
  tarea_id uuid not null references public.tareas (id) on delete cascade,
  alumno_id uuid not null references public.profiles (id) on delete cascade,
  respuesta_texto text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tarea_id, alumno_id)
);

alter table public.tarea_entregas enable row level security;

create policy "tarea_entregas_all_own"
on public.tarea_entregas for all
using (alumno_id = auth.uid())
with check (alumno_id = auth.uid());

create policy "tarea_entregas_select_staff"
on public.tarea_entregas for select
using (public.is_staff());

create index tarea_entregas_tarea_id_idx on public.tarea_entregas (tarea_id);

-- ============================================================
-- tarea_entrega_archivos: evidencia en archivo subida por el alumno.
-- ============================================================
create table public.tarea_entrega_archivos (
  id uuid primary key default gen_random_uuid(),
  entrega_id uuid not null references public.tarea_entregas (id) on delete cascade,
  storage_path text not null,
  nombre_archivo text not null,
  tipo_mime text,
  tamano_bytes bigint,
  created_at timestamptz not null default now()
);

alter table public.tarea_entrega_archivos enable row level security;

create policy "tarea_entrega_archivos_all_own"
on public.tarea_entrega_archivos for all
using (exists (select 1 from public.tarea_entregas e where e.id = entrega_id and e.alumno_id = auth.uid()))
with check (exists (select 1 from public.tarea_entregas e where e.id = entrega_id and e.alumno_id = auth.uid()));

create policy "tarea_entrega_archivos_select_staff"
on public.tarea_entrega_archivos for select
using (public.is_staff());

create index tarea_entrega_archivos_entrega_id_idx on public.tarea_entrega_archivos (entrega_id);

-- ============================================================
-- Storage: bucket privado para la evidencia de los alumnos. Cada quien
-- solo puede subir/leer/borrar dentro de su propia carpeta (su user id);
-- el staff puede leer todo.
-- ============================================================
insert into storage.buckets (id, name, public)
values ('tareas-entregas', 'tareas-entregas', false)
on conflict (id) do nothing;

create policy "tareas_entregas_select_own_or_staff"
on storage.objects for select
using (bucket_id = 'tareas-entregas' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_staff()));

create policy "tareas_entregas_insert_own"
on storage.objects for insert
with check (bucket_id = 'tareas-entregas' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "tareas_entregas_delete_own"
on storage.objects for delete
using (bucket_id = 'tareas-entregas' and (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================
-- tarea_preguntas: preguntas opcionales dentro de una tarea, opción
-- múltiple (autocalifica) o abierta (texto libre, revisión manual).
-- Mismo patrón que examen_preguntas.
-- ============================================================
create table public.tarea_preguntas (
  id uuid primary key default gen_random_uuid(),
  tarea_id uuid not null references public.tareas (id) on delete cascade,
  orden int not null default 0,
  tipo text not null default 'multiple' check (tipo in ('multiple', 'abierta')),
  enunciado text not null,
  opciones jsonb,
  respuesta_correcta int,
  created_at timestamptz not null default now(),
  constraint tarea_preguntas_multiple_completa
    check (tipo <> 'multiple' or (opciones is not null and respuesta_correcta is not null))
);

alter table public.tarea_preguntas enable row level security;

-- Solo el staff puede leerlas directamente (incluye la respuesta
-- correcta); el alumno recibe las preguntas sin la respuesta correcta a
-- través de un server action con service role.
create policy "tarea_preguntas_select_staff"
on public.tarea_preguntas for select
using (public.is_staff());

create policy "tarea_preguntas_insert_docente"
on public.tarea_preguntas for insert
with check (
  exists (select 1 from public.tareas t where t.id = tarea_id and public.materia_gestionable(t.materia_id))
);

create policy "tarea_preguntas_delete_docente"
on public.tarea_preguntas for delete
using (
  exists (select 1 from public.tareas t where t.id = tarea_id and public.materia_gestionable(t.materia_id))
);

create index tarea_preguntas_tarea_id_idx on public.tarea_preguntas (tarea_id);

-- ============================================================
-- tarea_intentos: intento autocalificado de las preguntas de una tarea
-- (solo cuenta la porción de opción múltiple; calificacion queda null
-- si la tarea es 100% preguntas abiertas). Sin policy de insert para el
-- rol autenticado normal — solo el server action con service role puede
-- crear uno.
-- ============================================================
create table public.tarea_intentos (
  id uuid primary key default gen_random_uuid(),
  tarea_id uuid not null references public.tareas (id) on delete cascade,
  alumno_id uuid not null references public.profiles (id) on delete cascade,
  respuestas jsonb not null,
  aciertos int not null,
  total int not null,
  calificacion numeric(5, 2),
  created_at timestamptz not null default now(),
  unique (tarea_id, alumno_id)
);

alter table public.tarea_intentos enable row level security;

create policy "tarea_intentos_select_own_or_staff"
on public.tarea_intentos for select
using (alumno_id = auth.uid() or public.is_staff());

create index tarea_intentos_tarea_id_idx on public.tarea_intentos (tarea_id);
