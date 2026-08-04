-- - paciente_notas gana "tipo" para distinguir notas generales de notas de
--   evaluación (las de sesión siguen viviendo en paciente_sesiones.nota).
-- - Nuevo módulo "paciente_salud": medicación y asistencia de salud
--   complementaria. Es una excepción acotada a la privacidad clínica: el
--   terapeuta dueño del paciente y la directora pueden ver/editar SOLO esta
--   tabla (ninguna otra tabla clínica se abre a directora).

alter table public.paciente_notas add column tipo text not null default 'general'
  check (tipo in ('general', 'evaluacion'));

create or replace function public.is_directora()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'directora'
  );
$$;

-- ============================================================
-- paciente_salud
-- ============================================================
create table public.paciente_salud (
  paciente_id uuid primary key references public.pacientes (id) on delete cascade,
  medicacion_toma boolean not null default false,
  medicacion_cual text,
  medicacion_dosis text,
  medicacion_desde date,
  asistencia_tipos text[] not null default '{}',
  asistencia_detalle text,
  actualizado_por uuid references public.profiles (id),
  updated_at timestamptz not null default now()
);

alter table public.paciente_salud enable row level security;

create policy "paciente_salud_all_own_terapeuta"
on public.paciente_salud for all
using (exists (select 1 from public.pacientes p where p.id = paciente_id and p.terapeuta_id = auth.uid()))
with check (exists (select 1 from public.pacientes p where p.id = paciente_id and p.terapeuta_id = auth.uid()));

create policy "paciente_salud_all_directora"
on public.paciente_salud for all
using (public.is_directora())
with check (public.is_directora());

-- La directora no tiene acceso a la tabla pacientes (motivos, notas, etc.
-- son clínicos y privados del terapeuta). Esta función le da únicamente lo
-- indispensable para la vista de seguimiento de salud: id, nombre y activo.
create or replace function public.pacientes_directorio_salud()
returns table (id uuid, nombre text, activo boolean)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, p.nombre, p.activo
  from public.pacientes p
  where public.is_directora()
  order by p.nombre;
$$;
