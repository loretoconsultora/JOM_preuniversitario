insert into public.materias (nombre) values
  ('Taller de Nutrición')
on conflict (nombre) do nothing;

do $$
declare
  v_uid uuid;
begin
  select id into v_uid from auth.users where email = 'aleroj132@gmail.com';
  if v_uid is not null then
    insert into public.materia_docentes (materia_id, docente_id)
    select id, v_uid from public.materias where nombre = 'Taller de Nutrición'
    on conflict do nothing;
  end if;
end $$;
