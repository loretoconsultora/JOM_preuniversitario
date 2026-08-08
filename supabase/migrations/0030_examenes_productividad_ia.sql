-- Autoevaluación inicial y final del curso "Productividad con IA": miden
-- 6 variables (dominio técnico, pensamiento analítico, pensamiento
-- crítico, diseño mental, diseño de procesos, aplicación práctica) con
-- una pregunta en cada evaluación por variable — redactadas distinto
-- para evitar el sesgo de "recordar mi respuesta anterior", pero
-- apuntando a la misma variable para poder contrastar inicio vs. final.
-- Todas son de respuesta abierta (no hay "correcta"): se revisan
-- manualmente por dirección/docencia para el contraste.

do $$
declare
  v_materia_id uuid;
  v_docente_id uuid;
  v_tema1_id uuid;  -- Ecosistema de Herramientas de IA (inicio del curso)
  v_tema20_id uuid; -- Construcción de tu SOP... (cierre del curso)
  v_examen_id uuid;
begin
  select id into v_materia_id from public.materias where nombre = 'Productividad con IA';
  select id into v_docente_id from auth.users where email = 'anyvillegas5@gmail.com';

  if v_materia_id is null then
    raise exception 'No existe la materia "Productividad con IA".';
  end if;
  if v_docente_id is null then
    raise exception 'No existe el usuario anyvillegas5@gmail.com.';
  end if;

  select id into v_tema1_id from public.temas where materia_id = v_materia_id and orden = 1;
  select id into v_tema20_id from public.temas where materia_id = v_materia_id and orden = 20;

  -- ================= AUTOEVALUACIÓN INICIAL =================
  insert into public.examenes (materia_id, tema_id, titulo, origen, creado_por)
  values (v_materia_id, v_tema1_id, 'Autoevaluación inicial', 'manual', v_docente_id)
  returning id into v_examen_id;

  insert into public.examen_preguntas (examen_id, orden, tipo, enunciado) values
    (v_examen_id, 1, 'abierta', 'Dominio técnico de IA — Del 1 al 10, ¿qué tan cómodo te sientes usando herramientas de IA (ChatGPT, Claude, etc.) en tu día a día? Da un ejemplo de cómo las usas actualmente (o si no las usas, dilo también).'),
    (v_examen_id, 2, 'abierta', 'Pensamiento analítico — Del 1 al 10, ¿qué tan seguro te sientes dividiendo un problema complejo en partes más pequeñas antes de resolverlo? Describe brevemente cómo abordarías un problema nuevo hoy.'),
    (v_examen_id, 3, 'abierta', 'Pensamiento crítico / uso ético — Del 1 al 10, ¿qué tanto cuestionas o verificas la información que te da una IA antes de usarla? Explica tu respuesta.'),
    (v_examen_id, 4, 'abierta', 'Diseño mental (ideación) — Del 1 al 10, ¿qué tan fácil te resulta imaginar y bocetar una solución (una app, un proceso, un proyecto) antes de empezar a construirla? Da un ejemplo de una idea que tengas hoy.'),
    (v_examen_id, 5, 'abierta', 'Diseño de procesos — Del 1 al 10, ¿qué tan cómodo te sientes organizando un proyecto en fases o pasos claros (planeación, ejecución, revisión)? Explica cómo organizas tus proyectos actualmente.'),
    (v_examen_id, 6, 'abierta', 'Aplicación práctica de tecnología — Del 1 al 10, ¿qué tan seguido usas la tecnología (no solo IA) para resolver problemas reales de tu día a día, trabajo o estudios? Da un ejemplo.');

  -- ================= AUTOEVALUACIÓN FINAL =================
  insert into public.examenes (materia_id, tema_id, titulo, origen, creado_por)
  values (v_materia_id, v_tema20_id, 'Autoevaluación final', 'manual', v_docente_id)
  returning id into v_examen_id;

  insert into public.examen_preguntas (examen_id, orden, tipo, enunciado) values
    (v_examen_id, 1, 'abierta', 'Dominio técnico de IA — Del 1 al 10, ¿qué tan cómodo te sientes usando herramientas de IA hoy, después del curso? Menciona una herramienta o técnica nueva que ahora dominas y que antes no conocías.'),
    (v_examen_id, 2, 'abierta', 'Pensamiento analítico — Del 1 al 10, ¿qué tan seguro te sientes analizando un problema complejo hoy? Cuenta un ejemplo real del curso donde tuviste que dividir un problema en partes para resolverlo con IA.'),
    (v_examen_id, 3, 'abierta', 'Pensamiento crítico / uso ético — Del 1 al 10, ¿qué tanto cuestionas o verificas hoy la información que te da una IA? ¿Cambió algo tu criterio después de ver los temas de sesgos, ética y privacidad?'),
    (v_examen_id, 4, 'abierta', 'Diseño mental (ideación) — Del 1 al 10, ¿qué tan fácil te resulta hoy imaginar y bocetar una solución antes de construirla? Describe cómo diseñaste el front end/back end de tu propio proyecto.'),
    (v_examen_id, 5, 'abierta', 'Diseño de procesos — Del 1 al 10, ¿qué tan cómodo te sientes hoy estructurando un proyecto en fases? Cuenta cómo definiste las fases de tu propio proyecto (Alpha, Beta, etc.) en este curso.'),
    (v_examen_id, 6, 'abierta', 'Aplicación práctica de tecnología — Del 1 al 10, ¿qué tan seguido usas hoy la tecnología para resolver problemas reales? ¿Qué construiste o automatizaste en este curso que antes no sabías hacer?');

end $$;
