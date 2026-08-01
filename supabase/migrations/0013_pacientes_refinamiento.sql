-- Refinamiento del módulo de terapia:
-- - motivo_referencia (texto libre) se reemplaza por motivos (arreglo de
--   etiquetas), para poder mostrarlas como chips de colores.
-- - nota (texto único en la ficha) se reemplaza por una bitácora de notas
--   con historial (paciente_notas), en vez de un solo campo editable.

alter table public.pacientes add column motivos text[] not null default '{}';

update public.pacientes
set motivos = array[motivo_referencia]
where motivo_referencia is not null and btrim(motivo_referencia) <> '';

alter table public.pacientes drop column motivo_referencia;

-- ============================================================
-- paciente_notas
-- ============================================================
create table public.paciente_notas (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references public.pacientes (id) on delete cascade,
  contenido text not null,
  creado_por uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

alter table public.paciente_notas enable row level security;

create policy "paciente_notas_all_own_terapeuta"
on public.paciente_notas for all
using (exists (select 1 from public.pacientes p where p.id = paciente_id and p.terapeuta_id = auth.uid()))
with check (exists (select 1 from public.pacientes p where p.id = paciente_id and p.terapeuta_id = auth.uid()));

create index paciente_notas_paciente_id_idx on public.paciente_notas (paciente_id);

-- Migra la nota inicial existente (si la había) como la primera entrada
-- del historial, para no perder lo que ya se había capturado.
insert into public.paciente_notas (paciente_id, contenido, creado_por)
select id, nota, terapeuta_id from public.pacientes
where nota is not null and btrim(nota) <> '';

alter table public.pacientes drop column nota;
