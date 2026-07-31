-- Exámenes interactivos con autocalificación (opción múltiple).

create table public.examenes (
  id uuid primary key default gen_random_uuid(),
  materia_id uuid not null references public.materias (id),
  titulo text not null,
  origen text not null default 'manual' check (origen in ('manual', 'ia', 'plantilla')),
  creado_por uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

alter table public.examenes enable row level security;

create policy "examenes_select_authenticated"
on public.examenes for select
using (auth.uid() is not null);

create policy "examenes_insert_docente"
on public.examenes for insert
with check (public.is_docente());

create policy "examenes_delete_docente"
on public.examenes for delete
using (public.is_docente());

-- ============================================================
-- Preguntas: solo el staff puede leerlas directamente (incluye la
-- respuesta correcta). Los alumnos reciben las preguntas sin la
-- respuesta correcta a través de un server action con service role.
-- ============================================================
create table public.examen_preguntas (
  id uuid primary key default gen_random_uuid(),
  examen_id uuid not null references public.examenes (id) on delete cascade,
  orden int not null default 0,
  enunciado text not null,
  opciones jsonb not null,
  respuesta_correcta int not null,
  created_at timestamptz not null default now()
);

alter table public.examen_preguntas enable row level security;

create policy "examen_preguntas_select_staff"
on public.examen_preguntas for select
using (public.is_staff());

create policy "examen_preguntas_insert_docente"
on public.examen_preguntas for insert
with check (public.is_docente());

create policy "examen_preguntas_delete_docente"
on public.examen_preguntas for delete
using (public.is_docente());

create index examen_preguntas_examen_id_idx on public.examen_preguntas (examen_id);

-- ============================================================
-- Intentos: el alumno solo puede LEER los suyos. No hay policy de
-- insert/update para el rol autenticado normal — solo el server
-- action con la service role key puede crear un intento, así la
-- calificación siempre se calcula en el servidor y no se puede forjar
-- desde el navegador.
-- ============================================================
create table public.examen_intentos (
  id uuid primary key default gen_random_uuid(),
  examen_id uuid not null references public.examenes (id) on delete cascade,
  alumno_id uuid not null references public.profiles (id) on delete cascade,
  respuestas jsonb not null,
  aciertos int not null,
  total int not null,
  calificacion numeric(5, 2) not null,
  created_at timestamptz not null default now(),
  unique (examen_id, alumno_id)
);

alter table public.examen_intentos enable row level security;

create policy "examen_intentos_select_own_or_staff"
on public.examen_intentos for select
using (alumno_id = auth.uid() or public.is_staff());

create index examen_intentos_examen_id_idx on public.examen_intentos (examen_id);
