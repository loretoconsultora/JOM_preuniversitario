-- Asistencia académica: permite indicar qué tema del temario se vio en cada
-- sesión de clase (dropdown, además de la nota libre existente).
alter table public.clase_sesiones add column tema_id uuid references public.temas (id) on delete set null;
create index clase_sesiones_tema_id_idx on public.clase_sesiones (tema_id);

-- Recursos: permite asociar un recurso (archivo o link) a un tema o
-- subtema específico del temario, para que también aparezca ahí (además
-- de en la sección general de Recursos).
alter table public.recursos add column tema_id uuid references public.temas (id) on delete set null;
alter table public.recursos add column subtema_id uuid references public.subtemas (id) on delete set null;
create index recursos_tema_id_idx on public.recursos (tema_id);
create index recursos_subtema_id_idx on public.recursos (subtema_id);
