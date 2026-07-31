-- Temario: módulos (temas) y subtemas por materia, al estilo Brightspace/Khan
-- Academy. Cada tema puede llevar archivos/presentaciones; cada subtema
-- puede llevar botones a ejercicios externos y videos de YouTube embebidos.

create table public.temas (
  id uuid primary key default gen_random_uuid(),
  materia_id uuid not null references public.materias (id),
  titulo text not null,
  descripcion text,
  orden int not null default 0,
  creado_por uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

alter table public.temas enable row level security;

create policy "temas_select_authenticated"
on public.temas for select
using (auth.uid() is not null);

create policy "temas_insert_docente"
on public.temas for insert
with check (public.is_docente());

create policy "temas_update_docente"
on public.temas for update
using (public.is_docente())
with check (public.is_docente());

create policy "temas_delete_docente"
on public.temas for delete
using (public.is_docente());

create index temas_materia_id_idx on public.temas (materia_id);

-- ============================================================
-- Archivos/presentaciones al inicio de cada tema.
-- ============================================================
create table public.tema_archivos (
  id uuid primary key default gen_random_uuid(),
  tema_id uuid not null references public.temas (id) on delete cascade,
  storage_path text not null,
  nombre_archivo text not null,
  tipo_mime text,
  tamano_bytes bigint,
  creado_por uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

alter table public.tema_archivos enable row level security;

create policy "tema_archivos_select_authenticated"
on public.tema_archivos for select
using (auth.uid() is not null);

create policy "tema_archivos_insert_docente"
on public.tema_archivos for insert
with check (public.is_docente());

create policy "tema_archivos_delete_docente"
on public.tema_archivos for delete
using (public.is_docente());

create index tema_archivos_tema_id_idx on public.tema_archivos (tema_id);

-- ============================================================
-- Subtemas dentro de cada tema.
-- ============================================================
create table public.subtemas (
  id uuid primary key default gen_random_uuid(),
  tema_id uuid not null references public.temas (id) on delete cascade,
  titulo text not null,
  detalle text,
  orden int not null default 0,
  creado_por uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

alter table public.subtemas enable row level security;

create policy "subtemas_select_authenticated"
on public.subtemas for select
using (auth.uid() is not null);

create policy "subtemas_insert_docente"
on public.subtemas for insert
with check (public.is_docente());

create policy "subtemas_delete_docente"
on public.subtemas for delete
using (public.is_docente());

create index subtemas_tema_id_idx on public.subtemas (tema_id);

-- ============================================================
-- Botones directos a ejercicios (links externos) por subtema.
-- ============================================================
create table public.subtema_ejercicios (
  id uuid primary key default gen_random_uuid(),
  subtema_id uuid not null references public.subtemas (id) on delete cascade,
  titulo text not null,
  url text not null,
  orden int not null default 0
);

alter table public.subtema_ejercicios enable row level security;

create policy "subtema_ejercicios_select_authenticated"
on public.subtema_ejercicios for select
using (auth.uid() is not null);

create policy "subtema_ejercicios_insert_docente"
on public.subtema_ejercicios for insert
with check (public.is_docente());

create policy "subtema_ejercicios_delete_docente"
on public.subtema_ejercicios for delete
using (public.is_docente());

create index subtema_ejercicios_subtema_id_idx on public.subtema_ejercicios (subtema_id);

-- ============================================================
-- Videos de YouTube embebidos por subtema.
-- ============================================================
create table public.subtema_videos (
  id uuid primary key default gen_random_uuid(),
  subtema_id uuid not null references public.subtemas (id) on delete cascade,
  titulo text,
  youtube_url text not null,
  orden int not null default 0
);

alter table public.subtema_videos enable row level security;

create policy "subtema_videos_select_authenticated"
on public.subtema_videos for select
using (auth.uid() is not null);

create policy "subtema_videos_insert_docente"
on public.subtema_videos for insert
with check (public.is_docente());

create policy "subtema_videos_delete_docente"
on public.subtema_videos for delete
using (public.is_docente());

create index subtema_videos_subtema_id_idx on public.subtema_videos (subtema_id);

-- ============================================================
-- Storage: bucket privado para los adjuntos de temas.
-- ============================================================
insert into storage.buckets (id, name, public)
values ('temario-adjuntos', 'temario-adjuntos', false)
on conflict (id) do nothing;

create policy "temario_adjuntos_select_authenticated"
on storage.objects for select
using (bucket_id = 'temario-adjuntos' and auth.uid() is not null);

create policy "temario_adjuntos_insert_docente"
on storage.objects for insert
with check (bucket_id = 'temario-adjuntos' and public.is_docente());

create policy "temario_adjuntos_delete_docente"
on storage.objects for delete
using (bucket_id = 'temario-adjuntos' and public.is_docente());
