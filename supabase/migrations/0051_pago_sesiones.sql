-- Checkbox de "pagada" para el reporte de contabilidad: solo tiene sentido
-- marcar como pagada/por pagar una sesión que genera cobro (homoclave SR o
-- CNA); las CT y SC son $0 y no se les muestra el checkbox en la UI, pero
-- la columna existe igual en las tres tablas para no tener que distinguir
-- casos en las políticas RLS (que ya cubren la fila completa).

alter table public.paciente_sesiones add column pagada boolean not null default false;
alter table public.orientacion_sesiones add column pagada boolean not null default false;
alter table public.psicopedagogia_sesiones add column pagada boolean not null default false;
