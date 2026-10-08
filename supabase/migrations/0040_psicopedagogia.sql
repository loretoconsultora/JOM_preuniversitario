-- Nuevo rol "psicopedagogia" (ej. Raquel): acompañamiento psicopedagógico
-- individual (función ejecutiva / hábitos de aprendizaje), distinto del
-- rol docente (clases grupales) que la misma persona puede seguir
-- teniendo en simultáneo, y categorizado aparte de "terapeuta" por pedido
-- explícito de la dirección: aunque la lógica de uso es la misma
-- (casos → sesiones 1:1 → notas de avance), institucionalmente debe
-- quedar identificado como psicopedagogía, no como psicoterapia.
--
-- Los campos específicos que necesita capturar este rol todavía no están
-- definidos (pendiente una conversación con la persona que lo va a usar),
-- así que esta migración clona el modelo mínimo de terapia (casos,
-- sesiones, notas) para no bloquear el arranque; se podrá ampliar después
-- sin tener que rehacer la base. Privacidad: igual que terapeuta — 100%
-- privado del profesional dueño, la directora NO ve el contenido clínico,
-- solo un listado acotado (nombre/activo) para supervisión, igual que ya
-- existe para pacientes vía pacientes_directorio_salud().

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('alumno', 'docente', 'directora', 'terapeuta', 'coach_vocacional', 'psicopedagogia'));

create or replace function public.is_psicopedagogia()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and (role = 'psicopedagogia' or 'psicopedagogia' = any(roles))
  );
$$;

-- ============================================================
-- psicopedagogia_casos
-- ============================================================
create table public.psicopedagogia_casos (
  id uuid primary key default gen_random_uuid(),
  profesional_id uuid not null references public.profiles (id) on delete cascade,
  alumno_id uuid references public.profiles (id) on delete set null,
  nombre text not null,
  motivo text,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.psicopedagogia_casos enable row level security;

create policy "psicopedagogia_casos_all_own_profesional"
on public.psicopedagogia_casos for all
using (profesional_id = auth.uid())
with check (profesional_id = auth.uid());

create index psicopedagogia_casos_profesional_id_idx on public.psicopedagogia_casos (profesional_id);

-- ============================================================
-- psicopedagogia_sesiones (mismo patrón que paciente_sesiones)
-- ============================================================
create table public.psicopedagogia_sesiones (
  id uuid primary key default gen_random_uuid(),
  caso_id uuid not null references public.psicopedagogia_casos (id) on delete cascade,
  fecha date not null,
  hora time,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'asistio', 'no_asistio', 'reagendada')),
  nota text,
  reagendada_a_id uuid references public.psicopedagogia_sesiones (id) on delete set null,
  creado_por uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

alter table public.psicopedagogia_sesiones enable row level security;

create policy "psicopedagogia_sesiones_all_own_profesional"
on public.psicopedagogia_sesiones for all
using (exists (select 1 from public.psicopedagogia_casos c where c.id = caso_id and c.profesional_id = auth.uid()))
with check (exists (select 1 from public.psicopedagogia_casos c where c.id = caso_id and c.profesional_id = auth.uid()));

create index psicopedagogia_sesiones_caso_id_idx on public.psicopedagogia_sesiones (caso_id);
create index psicopedagogia_sesiones_fecha_idx on public.psicopedagogia_sesiones (fecha);

-- ============================================================
-- psicopedagogia_notas (bitácora, mismo patrón que paciente_notas)
-- ============================================================
create table public.psicopedagogia_notas (
  id uuid primary key default gen_random_uuid(),
  caso_id uuid not null references public.psicopedagogia_casos (id) on delete cascade,
  contenido text not null,
  creado_por uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

alter table public.psicopedagogia_notas enable row level security;

create policy "psicopedagogia_notas_all_own_profesional"
on public.psicopedagogia_notas for all
using (exists (select 1 from public.psicopedagogia_casos c where c.id = caso_id and c.profesional_id = auth.uid()))
with check (exists (select 1 from public.psicopedagogia_casos c where c.id = caso_id and c.profesional_id = auth.uid()));

create index psicopedagogia_notas_caso_id_idx on public.psicopedagogia_notas (caso_id);

-- Vista acotada para la directora: igual criterio que
-- pacientes_directorio_salud() — solo lo indispensable para supervisión
-- (quién está en seguimiento y si sigue activo), sin contenido clínico.
create or replace function public.psicopedagogia_directorio()
returns table (id uuid, nombre text, activo boolean, profesional_id uuid)
language sql
security definer
set search_path = public
stable
as $$
  select c.id, c.nombre, c.activo, c.profesional_id
  from public.psicopedagogia_casos c
  where public.is_directora()
  order by c.nombre;
$$;
