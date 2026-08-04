-- Documentos adicionales del paciente (pruebas, evaluaciones, etc.) que el
-- terapeuta puede cargar desde la ficha: PDF, Word o fotos.
create table public.paciente_documentos (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references public.pacientes (id) on delete cascade,
  storage_path text not null,
  nombre_archivo text not null,
  tipo_mime text,
  tamano_bytes bigint,
  creado_por uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

alter table public.paciente_documentos enable row level security;

create policy "paciente_documentos_all_own_terapeuta"
on public.paciente_documentos for all
using (exists (select 1 from public.pacientes p where p.id = paciente_id and p.terapeuta_id = auth.uid()))
with check (exists (select 1 from public.pacientes p where p.id = paciente_id and p.terapeuta_id = auth.uid()));

create index paciente_documentos_paciente_id_idx on public.paciente_documentos (paciente_id);

-- ============================================================
-- Storage: bucket privado para estos documentos.
-- ============================================================
insert into storage.buckets (id, name, public)
values ('paciente-documentos', 'paciente-documentos', false)
on conflict (id) do nothing;

create policy "paciente_documentos_storage_select_terapeuta"
on storage.objects for select
using (bucket_id = 'paciente-documentos' and public.is_terapeuta());

create policy "paciente_documentos_storage_insert_terapeuta"
on storage.objects for insert
with check (bucket_id = 'paciente-documentos' and public.is_terapeuta());

create policy "paciente_documentos_storage_delete_terapeuta"
on storage.objects for delete
using (bucket_id = 'paciente-documentos' and public.is_terapeuta());
