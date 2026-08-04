-- Materias para los 7 talleres de docentes externos, y corrección de los
-- perfiles que ya se crearon manualmente en Authentication → Users: quedaron
-- con role='alumno' y nombre_completo=correo, porque el alta manual desde el
-- dashboard de Supabase no manda el user_metadata que sí manda crearDocente().
-- Se desactiva momentáneamente el trigger que evita la auto-asignación de rol
-- (profiles_prevent_self_role_change), porque el SQL Editor no tiene un JWT
-- de sesión y auth.uid() da null ahí adentro, lo que revertiría el cambio.

insert into public.materias (nombre) values
  ('Taller de identidad y motivación profesional'),
  ('Diseño de modelos de negocio exitoso'),
  ('Taller de finanzas personales "cuida tu dinero"'),
  ('Taller de relaciones laborales de éxito'),
  ('Talleres por módulos de herramientas para una sexualidad sana'),
  ('Clases continuas de técnicas y hábitos de estudio / orientación vocacional'),
  ('Éxito (parte 1 y 2)'),
  ('Psicología para la vida')
on conflict (nombre) do nothing;

alter table public.profiles disable trigger profiles_prevent_self_role_change;

do $$
declare
  v_uid uuid;
begin
  -- Samanta Martínez
  select id into v_uid from auth.users where email = 'samantha@identidadsm.com';
  if v_uid is not null then
    update public.profiles set role = 'docente', nombre_completo = 'Samanta Martínez' where id = v_uid;
    insert into public.materia_docentes (materia_id, docente_id)
    select id, v_uid from public.materias where nombre = 'Taller de identidad y motivación profesional'
    on conflict do nothing;
  end if;

  -- Virginia Baptista
  select id into v_uid from auth.users where email = 'mariavirginiabap@gmail.com';
  if v_uid is not null then
    update public.profiles set role = 'docente', nombre_completo = 'Virginia Baptista' where id = v_uid;
    insert into public.materia_docentes (materia_id, docente_id)
    select id, v_uid from public.materias where nombre = 'Diseño de modelos de negocio exitoso'
    on conflict do nothing;
  end if;

  -- Juliana Fuentes (revisar cuál correo es el correcto: se ve
  -- "julpifuen@gmail.com" en Authentication, pero se había compartido
  -- "julifuen@gmail.com" — se cubren ambos por si acaso).
  select id into v_uid from auth.users where email in ('julifuen@gmail.com', 'julpifuen@gmail.com');
  if v_uid is not null then
    update public.profiles set role = 'docente', nombre_completo = 'Juliana Fuentes' where id = v_uid;
    insert into public.materia_docentes (materia_id, docente_id)
    select id, v_uid from public.materias where nombre = 'Taller de finanzas personales "cuida tu dinero"'
    on conflict do nothing;
  end if;

  -- Adriana Ávila
  select id into v_uid from auth.users where email = 'lcpf.avila@gmail.com';
  if v_uid is not null then
    update public.profiles set role = 'docente', nombre_completo = 'Adriana Ávila' where id = v_uid;
    insert into public.materia_docentes (materia_id, docente_id)
    select id, v_uid from public.materias where nombre = 'Taller de relaciones laborales de éxito'
    on conflict do nothing;
  end if;

  -- Jeka Méndez
  select id into v_uid from auth.users where email = 'esaludsexual@gmail.com';
  if v_uid is not null then
    update public.profiles set role = 'docente', nombre_completo = 'Jeka Méndez' where id = v_uid;
    insert into public.materia_docentes (materia_id, docente_id)
    select id, v_uid from public.materias where nombre = 'Talleres por módulos de herramientas para una sexualidad sana'
    on conflict do nothing;
  end if;

  -- Raquel Nasser
  select id into v_uid from auth.users where email = 'psicoracky@gmail.com';
  if v_uid is not null then
    update public.profiles set role = 'docente', nombre_completo = 'Raquel Nasser' where id = v_uid;
    insert into public.materia_docentes (materia_id, docente_id)
    select id, v_uid from public.materias where nombre = 'Clases continuas de técnicas y hábitos de estudio / orientación vocacional'
    on conflict do nothing;
  end if;

  -- Ezequiel Lugano (2 materias)
  select id into v_uid from auth.users where email = 'ezeluganopsicologia@gmail.com';
  if v_uid is not null then
    update public.profiles set role = 'docente', nombre_completo = 'Ezequiel Lugano' where id = v_uid;
    insert into public.materia_docentes (materia_id, docente_id)
    select id, v_uid from public.materias where nombre in ('Éxito (parte 1 y 2)', 'Psicología para la vida')
    on conflict do nothing;
  end if;
end $$;

alter table public.profiles enable trigger profiles_prevent_self_role_change;
