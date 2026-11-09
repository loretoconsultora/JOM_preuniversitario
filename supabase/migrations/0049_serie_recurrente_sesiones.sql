-- Permite borrar de un solo golpe todas las sesiones pendientes de una
-- recurrencia (ej. "todos los lunes 5pm con Adi"), sin perder la opción de
-- borrar una por una. A pedido de Sandra: al agendar mal una recurrencia,
-- hoy hay que eliminar cada ocurrencia individualmente.
--
-- serie_id agrupa las filas creadas juntas en un mismo agendamiento
-- recurrente (crearAgendamiento* genera un uuid y lo pone en todas). Las
-- sesiones personalizadas (no recurrentes) y las que nacen de un
-- reagendamiento individual quedan con serie_id null, porque ya no
-- pertenecen a ningún patrón que tenga sentido borrar en bloque.

alter table public.paciente_sesiones add column serie_id uuid;
alter table public.orientacion_sesiones add column serie_id uuid;
alter table public.psicopedagogia_sesiones add column serie_id uuid;

create index paciente_sesiones_serie_id_idx on public.paciente_sesiones (serie_id) where serie_id is not null;
create index orientacion_sesiones_serie_id_idx on public.orientacion_sesiones (serie_id) where serie_id is not null;
create index psicopedagogia_sesiones_serie_id_idx on public.psicopedagogia_sesiones (serie_id) where serie_id is not null;
