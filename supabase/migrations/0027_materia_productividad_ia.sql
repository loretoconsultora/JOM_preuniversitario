-- Nueva materia para el taller "Productividad con IA".
insert into public.materias (nombre) values
  ('Productividad con IA')
on conflict (nombre) do nothing;
