-- Relleno de serie_id para agendamientos recurrentes creados ANTES de la
-- migración 0049 (que agregó la columna): esas filas ya existían y nunca
-- tuvieron serie_id asignado, así que el botón "Eliminar recurrencia" no
-- les aparece aunque sí sean una recurrencia.
--
-- Heurística: agrupa sesiones pendientes que comparten
-- paciente/orientado/caso + hora + día de la semana (misma lógica que usa
-- crearAgendamiento* para generar una recurrencia semanal). Solo toca
-- filas sin serie_id, así que es seguro correrla más de una vez y no pisa
-- las que ya se agendaron con el código nuevo.

with grupos as (
  select paciente_id, hora, extract(dow from fecha) as dow, gen_random_uuid() as nuevo_serie_id
  from public.paciente_sesiones
  where estado = 'pendiente' and serie_id is null and hora is not null
  group by paciente_id, hora, extract(dow from fecha)
  having count(*) > 1
)
update public.paciente_sesiones s
set serie_id = g.nuevo_serie_id
from grupos g
where s.paciente_id = g.paciente_id
  and s.hora = g.hora
  and extract(dow from s.fecha) = g.dow
  and s.estado = 'pendiente'
  and s.serie_id is null;

with grupos as (
  select orientado_id, hora, extract(dow from fecha) as dow, gen_random_uuid() as nuevo_serie_id
  from public.orientacion_sesiones
  where estado = 'pendiente' and serie_id is null and hora is not null
  group by orientado_id, hora, extract(dow from fecha)
  having count(*) > 1
)
update public.orientacion_sesiones s
set serie_id = g.nuevo_serie_id
from grupos g
where s.orientado_id = g.orientado_id
  and s.hora = g.hora
  and extract(dow from s.fecha) = g.dow
  and s.estado = 'pendiente'
  and s.serie_id is null;

with grupos as (
  select caso_id, hora, extract(dow from fecha) as dow, gen_random_uuid() as nuevo_serie_id
  from public.psicopedagogia_sesiones
  where estado = 'pendiente' and serie_id is null and hora is not null
  group by caso_id, hora, extract(dow from fecha)
  having count(*) > 1
)
update public.psicopedagogia_sesiones s
set serie_id = g.nuevo_serie_id
from grupos g
where s.caso_id = g.caso_id
  and s.hora = g.hora
  and extract(dow from s.fecha) = g.dow
  and s.estado = 'pendiente'
  and s.serie_id is null;
