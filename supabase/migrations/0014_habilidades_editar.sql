-- Permite renombrar habilidades del catálogo (antes solo se podían crear
-- y borrar). Nota: borrar una habilidad también borra sus calificaciones
-- en evaluaciones pasadas (fk on delete cascade ya definida en 0011).

create policy "habilidades_update_terapeuta"
on public.habilidades for update
using (public.is_terapeuta())
with check (public.is_terapeuta());
