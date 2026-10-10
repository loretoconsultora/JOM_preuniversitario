-- Homoclaves de sesión (SR/CNA/CT/SC) para terapeuta, psicopedagogía y
-- coach vocacional, a pedido de Sandra (terapeuta): hoy "reagendada" no
-- distingue quién canceló ni si la sesión es facturable, lo que le causó
-- una confusión real de agenda con una paciente. Códigos, tomados de su
-- acuerdo de prestación de servicios firmado con Fundación JOM:
--   SR  Sesión Realizada           -> se factura
--   CNA Cancelación No Anticipada  -> cancela/falta el paciente/orientado/caso
--                                     con <24h o sin aviso -> se factura igual
--   CT  Cancelación de quien da la sesión, sin 24h de aviso -> NO se factura,
--                                     genera una sesión compensatoria
--   SC  Sesión Compensatoria       -> la reposición de una CT, costo $0
--
-- No se usa un enum nuevo ni se reemplaza "estado": homoclave es un
-- clasificador adicional, nulo mientras la sesión sigue pendiente o si fue
-- reagendada con aviso normal (no amerita código de facturación).

alter table public.paciente_sesiones
  add column homoclave text check (homoclave in ('SR', 'CNA', 'CT', 'SC'));

alter table public.orientacion_sesiones
  add column homoclave text check (homoclave in ('SR', 'CNA', 'CT', 'SC'));

alter table public.psicopedagogia_sesiones
  add column homoclave text check (homoclave in ('SR', 'CNA', 'CT', 'SC'));

-- Backfill de lo ya registrado: asistió siempre fue facturable (SR), no
-- asistió siempre se trató como falta sin aviso (CNA). Las "reagendada"
-- históricas quedan en null porque no hay forma de saber retroactivamente
-- quién canceló.
update public.paciente_sesiones set homoclave = 'SR' where estado = 'asistio';
update public.paciente_sesiones set homoclave = 'CNA' where estado = 'no_asistio';

update public.orientacion_sesiones set homoclave = 'SR' where estado = 'asistio';
update public.orientacion_sesiones set homoclave = 'CNA' where estado = 'no_asistio';

update public.psicopedagogia_sesiones set homoclave = 'SR' where estado = 'asistio';
update public.psicopedagogia_sesiones set homoclave = 'CNA' where estado = 'no_asistio';
