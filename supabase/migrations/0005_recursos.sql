-- Recursos generales (archivos o links) con seguimiento de "visto" por alumno.

create table public.recursos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  tipo text not null check (tipo in ('archivo', 'enlace')),
  materia_id uuid references public.materias (id),
  storage_path text,
  nombre_archivo text,
  tipo_mime text,
  tamano_bytes bigint,
  url text,
  creado_por uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  constraint recursos_tipo_consistente check (
    (tipo = 'archivo' and storage_path is not null and url is null)
    or (tipo = 'enlace' and url is not null and storage_path is null)
  )
);

alter table public.recursos enable row level security;

create policy "recursos_select_authenticated"
on public.recursos for select
using (auth.uid() is not null);

create policy "recursos_insert_docente"
on public.recursos for insert
with check (public.is_docente());

create policy "recursos_delete_docente"
on public.recursos for delete
using (public.is_docente());

create index recursos_materia_id_idx on public.recursos (materia_id);

-- ============================================================
-- Vistas: registra la primera vez que cada alumno abre un recurso.
-- El alumno solo puede insertar/leer las suyas; staff lee todas.
-- ============================================================
create table public.recurso_vistas (
  id uuid primary key default gen_random_uuid(),
  recurso_id uuid not null references public.recursos (id) on delete cascade,
  alumno_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (recurso_id, alumno_id)
);

alter table public.recurso_vistas enable row level security;

create policy "recurso_vistas_select_own_or_staff"
on public.recurso_vistas for select
using (alumno_id = auth.uid() or public.is_staff());

create policy "recurso_vistas_insert_own"
on public.recurso_vistas for insert
with check (alumno_id = auth.uid());

create index recurso_vistas_recurso_id_idx on public.recurso_vistas (recurso_id);

-- ============================================================
-- Storage: bucket privado para los recursos tipo "archivo".
-- ============================================================
insert into storage.buckets (id, name, public)
values ('recursos-adjuntos', 'recursos-adjuntos', false)
on conflict (id) do nothing;

create policy "recursos_adjuntos_select_authenticated"
on storage.objects for select
using (bucket_id = 'recursos-adjuntos' and auth.uid() is not null);

create policy "recursos_adjuntos_insert_docente"
on storage.objects for insert
with check (bucket_id = 'recursos-adjuntos' and public.is_docente());

create policy "recursos_adjuntos_delete_docente"
on storage.objects for delete
using (bucket_id = 'recursos-adjuntos' and public.is_docente());
