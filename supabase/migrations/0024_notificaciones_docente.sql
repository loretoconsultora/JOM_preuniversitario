-- Notificaciones in-app para docentes: complementa (o, mientras no se
-- configure RESEND_API_KEY, reemplaza) el aviso por correo de
-- src/lib/notificar-docentes.ts — así no depende de tener un dominio de
-- correo verificado para enterarse de que un alumno entregó algo.
create table public.notificaciones_docente (
  id uuid primary key default gen_random_uuid(),
  docente_id uuid not null references public.profiles (id) on delete cascade,
  mensaje text not null,
  materia_id uuid references public.materias (id) on delete set null,
  tarea_id uuid references public.tareas (id) on delete cascade,
  examen_id uuid references public.examenes (id) on delete cascade,
  leida boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notificaciones_docente enable row level security;

create policy "notificaciones_docente_select_own"
on public.notificaciones_docente for select
using (docente_id = auth.uid());

create policy "notificaciones_docente_update_own"
on public.notificaciones_docente for update
using (docente_id = auth.uid())
with check (docente_id = auth.uid());

-- Se insertan desde server actions con la service role key (mismo patrón
-- que tarea_intentos/examen_intentos), no hace falta policy de insert
-- para el rol autenticado normal.

create index notificaciones_docente_docente_id_idx on public.notificaciones_docente (docente_id, created_at desc);
