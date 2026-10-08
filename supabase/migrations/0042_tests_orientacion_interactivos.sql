-- Tests vocacionales: antes solo se podía registrar un archivo con un
-- resumen del resultado. Ahora hay tres formas de cargar un test:
--   'archivo'     -> se sube un documento (como antes).
--   'link'        -> se guarda la URL de un test público online.
--   'interactivo' -> Paula arma las preguntas en la plataforma y el alumno
--                    vinculado las responde ahí mismo. Son preguntas de
--                    preferencia (sin respuesta correcta): el estado pasa de
--                    "disponible" a "contestado" cuando el alumno responde,
--                    y a "evaluado" cuando Paula escribe la interpretación
--                    en el campo "resultado" que ya existía.

alter table public.orientacion_tests
  add column modo text not null default 'archivo' check (modo in ('archivo', 'link', 'interactivo')),
  add column url text;

-- ============================================================
-- orientacion_test_preguntas (solo para modo = 'interactivo')
-- ============================================================
create table public.orientacion_test_preguntas (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.orientacion_tests (id) on delete cascade,
  orden int not null default 0,
  enunciado text not null,
  opciones jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.orientacion_test_preguntas enable row level security;

create policy "orientacion_test_preguntas_all_own_coach"
on public.orientacion_test_preguntas for all
using (
  exists (
    select 1 from public.orientacion_tests t
    join public.orientados o on o.id = t.orientado_id
    where t.id = test_id and o.coach_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.orientacion_tests t
    join public.orientados o on o.id = t.orientado_id
    where t.id = test_id and o.coach_id = auth.uid()
  )
);

create policy "orientacion_test_preguntas_select_own_alumno"
on public.orientacion_test_preguntas for select
using (
  exists (
    select 1 from public.orientacion_tests t
    join public.orientados o on o.id = t.orientado_id
    where t.id = test_id and o.alumno_id = auth.uid()
  )
);

create policy "orientacion_test_preguntas_select_directora"
on public.orientacion_test_preguntas for select
using (public.is_directora());

create index orientacion_test_preguntas_test_id_idx on public.orientacion_test_preguntas (test_id);

-- ============================================================
-- orientacion_test_respuesta (una sola por test: el orientado ya está
-- ligado a un único alumno, no hace falta soportar múltiples intentos)
-- ============================================================
create table public.orientacion_test_respuesta (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null unique references public.orientacion_tests (id) on delete cascade,
  alumno_id uuid not null references public.profiles (id) on delete cascade,
  respuestas jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.orientacion_test_respuesta enable row level security;

create policy "orientacion_test_respuesta_select_coach"
on public.orientacion_test_respuesta for select
using (
  exists (
    select 1 from public.orientacion_tests t
    join public.orientados o on o.id = t.orientado_id
    where t.id = test_id and o.coach_id = auth.uid()
  )
);

create policy "orientacion_test_respuesta_delete_coach"
on public.orientacion_test_respuesta for delete
using (
  exists (
    select 1 from public.orientacion_tests t
    join public.orientados o on o.id = t.orientado_id
    where t.id = test_id and o.coach_id = auth.uid()
  )
);

-- El alumno solo puede insertar (no editar ni borrar) su propia respuesta,
-- y solo para un test interactivo de su propio caso. La restricción unique
-- en test_id evita que conteste dos veces.
create policy "orientacion_test_respuesta_insert_own_alumno"
on public.orientacion_test_respuesta for insert
with check (
  alumno_id = auth.uid()
  and exists (
    select 1 from public.orientacion_tests t
    join public.orientados o on o.id = t.orientado_id
    where t.id = test_id and o.alumno_id = auth.uid() and t.modo = 'interactivo'
  )
);

create policy "orientacion_test_respuesta_select_own_alumno"
on public.orientacion_test_respuesta for select
using (alumno_id = auth.uid());

create policy "orientacion_test_respuesta_select_directora"
on public.orientacion_test_respuesta for select
using (public.is_directora());

create index orientacion_test_respuesta_test_id_idx on public.orientacion_test_respuesta (test_id);
