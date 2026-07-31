-- Adjuntos (archivos/imágenes) para tareas

create table public.tarea_archivos (
  id uuid primary key default gen_random_uuid(),
  tarea_id uuid not null references public.tareas (id) on delete cascade,
  storage_path text not null,
  nombre_archivo text not null,
  tipo_mime text,
  tamano_bytes bigint,
  creado_por uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

alter table public.tarea_archivos enable row level security;

create policy "tarea_archivos_select_authenticated"
on public.tarea_archivos for select
using (auth.uid() is not null);

create policy "tarea_archivos_insert_docente"
on public.tarea_archivos for insert
with check (public.is_docente());

create policy "tarea_archivos_delete_docente"
on public.tarea_archivos for delete
using (public.is_docente());

create index tarea_archivos_tarea_id_idx on public.tarea_archivos (tarea_id);

-- ============================================================
-- Storage: bucket privado para los adjuntos
-- ============================================================
insert into storage.buckets (id, name, public)
values ('tareas-adjuntos', 'tareas-adjuntos', false)
on conflict (id) do nothing;

create policy "tareas_adjuntos_select_authenticated"
on storage.objects for select
using (bucket_id = 'tareas-adjuntos' and auth.uid() is not null);

create policy "tareas_adjuntos_insert_docente"
on storage.objects for insert
with check (bucket_id = 'tareas-adjuntos' and public.is_docente());

create policy "tareas_adjuntos_delete_docente"
on storage.objects for delete
using (bucket_id = 'tareas-adjuntos' and public.is_docente());
