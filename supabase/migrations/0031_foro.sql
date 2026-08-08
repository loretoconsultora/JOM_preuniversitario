-- Foro / Comunidad por materia: cualquier alumno (o docente/directora)
-- puede publicar texto, un link y/o un archivo adjunto, y cualquiera
-- puede comentar. Pensado para el "Showcase final + Foro comunidad" de
-- Productividad con IA, pero queda disponible para cualquier materia.
--
-- Visibilidad: igual que temas/tareas/examenes/recursos ya en el
-- proyecto, el select es "cualquier autenticado" (auth.uid() is not
-- null) — filtrar a "mis materias" es responsabilidad de la app, no de
-- RLS, siguiendo el mismo patrón ya establecido en todo el temario.

create table public.foro_publicaciones (
  id uuid primary key default gen_random_uuid(),
  materia_id uuid not null references public.materias (id) on delete cascade,
  autor_id uuid not null references public.profiles (id),
  texto text,
  link text,
  storage_path text,
  nombre_archivo text,
  tipo_mime text,
  tamano_bytes bigint,
  created_at timestamptz not null default now(),
  constraint foro_publicaciones_tiene_contenido check (
    texto is not null or link is not null or storage_path is not null
  )
);

alter table public.foro_publicaciones enable row level security;

create policy "foro_publicaciones_select_authenticated"
on public.foro_publicaciones for select
using (auth.uid() is not null);

create policy "foro_publicaciones_insert_own"
on public.foro_publicaciones for insert
with check (autor_id = auth.uid());

create policy "foro_publicaciones_delete_own_or_staff"
on public.foro_publicaciones for delete
using (autor_id = auth.uid() or public.materia_gestionable(materia_id));

create index foro_publicaciones_materia_id_idx on public.foro_publicaciones (materia_id);

-- ============================================================
-- foro_comentarios: comentarios de cualquiera en una publicación.
-- ============================================================
create table public.foro_comentarios (
  id uuid primary key default gen_random_uuid(),
  publicacion_id uuid not null references public.foro_publicaciones (id) on delete cascade,
  autor_id uuid not null references public.profiles (id),
  texto text not null,
  created_at timestamptz not null default now()
);

alter table public.foro_comentarios enable row level security;

create policy "foro_comentarios_select_authenticated"
on public.foro_comentarios for select
using (auth.uid() is not null);

create policy "foro_comentarios_insert_own"
on public.foro_comentarios for insert
with check (autor_id = auth.uid());

create policy "foro_comentarios_delete_own_or_staff"
on public.foro_comentarios for delete
using (
  autor_id = auth.uid()
  or exists (
    select 1 from public.foro_publicaciones p
    where p.id = publicacion_id and public.materia_gestionable(p.materia_id)
  )
);

create index foro_comentarios_publicacion_id_idx on public.foro_comentarios (publicacion_id);

-- ============================================================
-- Storage: bucket privado para los archivos adjuntos del foro. Cualquier
-- autenticado puede verlos (es contenido de clase, no privado por
-- alumno); solo el propio autor puede subir a su carpeta.
-- ============================================================
insert into storage.buckets (id, name, public)
values ('foro-adjuntos', 'foro-adjuntos', false)
on conflict (id) do nothing;

create policy "foro_adjuntos_select_authenticated"
on storage.objects for select
using (bucket_id = 'foro-adjuntos' and auth.uid() is not null);

create policy "foro_adjuntos_insert_own"
on storage.objects for insert
with check (bucket_id = 'foro-adjuntos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "foro_adjuntos_delete_own_or_staff"
on storage.objects for delete
using (
  bucket_id = 'foro-adjuntos'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_staff())
);
