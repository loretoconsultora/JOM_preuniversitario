-- Nueva materia "Creación de Contenido con IA", asignada a Any Villegas
-- (ya existe como docente por el taller de Productividad con IA).

insert into public.materias (nombre) values
  ('Creación de Contenido con IA')
on conflict (nombre) do nothing;

do $$
declare
  v_materia_id uuid;
  v_docente_id uuid;
begin
  select id into v_materia_id from public.materias where nombre = 'Creación de Contenido con IA';
  select id into v_docente_id from auth.users where email = 'anyvillegas5@gmail.com';

  if v_materia_id is null then
    raise exception 'No se pudo crear/encontrar la materia "Creación de Contenido con IA".';
  end if;
  if v_docente_id is null then
    raise exception 'No existe el usuario anyvillegas5@gmail.com.';
  end if;

  insert into public.materia_docentes (materia_id, docente_id)
  values (v_materia_id, v_docente_id)
  on conflict do nothing;
end $$;
