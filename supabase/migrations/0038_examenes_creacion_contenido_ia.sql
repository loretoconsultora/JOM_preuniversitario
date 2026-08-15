-- Autoevaluación inicial y final del taller "Creación de Contenido con
-- IA": miden 5 variables (creatividad, redacción/estructura de
-- instrucciones, comunicación del mensaje, autenticidad y uso ético,
-- confianza al usar IA generativa) con una pregunta por variable en cada
-- evaluación — redactadas distinto para evitar el sesgo de "recordar mi
-- respuesta anterior", pero apuntando a la misma variable (separador
-- " — ") para poder contrastarlas en el Comparativo. Todas son de
-- respuesta abierta (no hay "correcta"): se revisan manualmente.

do $$
declare
  v_materia_id uuid;
  v_docente_id uuid;
  v_tema1_id uuid;  -- Bienvenida, ética y tu tema de proyecto (inicio del taller)
  v_tema16_id uuid; -- Showcase: Foro de la comunidad (cierre del taller)
  v_examen_id uuid;
begin
  select id into v_materia_id from public.materias where nombre = 'Creación de Contenido con IA';
  select id into v_docente_id from auth.users where email = 'anyvillegas5@gmail.com';

  if v_materia_id is null then
    raise exception 'No existe la materia "Creación de Contenido con IA". Corre primero la migración 0035.';
  end if;
  if v_docente_id is null then
    raise exception 'No existe el usuario anyvillegas5@gmail.com.';
  end if;

  select id into v_tema1_id from public.temas where materia_id = v_materia_id and orden = 1;
  select id into v_tema16_id from public.temas where materia_id = v_materia_id and orden = 16;

  -- ================= AUTOEVALUACIÓN INICIAL =================
  insert into public.examenes (materia_id, tema_id, titulo, origen, creado_por)
  values (v_materia_id, v_tema1_id, 'Autoevaluación inicial', 'manual', v_docente_id)
  returning id into v_examen_id;

  insert into public.examen_preguntas (examen_id, orden, tipo, enunciado) values
    (v_examen_id, 1, 'abierta', 'Creatividad — Del 1 al 10, ¿qué tan fácil te resulta generar ideas originales para una pieza de contenido (video, foto, post)? Da un ejemplo de una idea tuya que consideres creativa.'),
    (v_examen_id, 2, 'abierta', 'Redacción / estructura de instrucciones — Del 1 al 10, ¿qué tan claro te sientes al redactar una instrucción para que una IA haga exactamente lo que quieres (por ejemplo, generar un video o una imagen)? Explica tu respuesta.'),
    (v_examen_id, 3, 'abierta', 'Comunicación del mensaje — Del 1 al 10, ¿qué tan seguro te sientes transmitiendo una idea clara y atractiva en menos de 30 segundos de video? Da un ejemplo de algo que te gustaría comunicar.'),
    (v_examen_id, 4, 'abierta', 'Autenticidad y uso ético — Del 1 al 10, ¿qué tanto consideras informar a tu audiencia cuándo un contenido fue creado o apoyado con IA (por ejemplo, un avatar digital)? Explica tu postura actual.'),
    (v_examen_id, 5, 'abierta', 'Confianza al usar IA generativa — Del 1 al 10, ¿qué tan capaz te sientes hoy de crear una pieza de contenido completa (guion, video, imágenes de apoyo) usando IA de principio a fin? Explica tu respuesta.');

  -- ================= AUTOEVALUACIÓN FINAL =================
  insert into public.examenes (materia_id, tema_id, titulo, origen, creado_por)
  values (v_materia_id, v_tema16_id, 'Autoevaluación final', 'manual', v_docente_id)
  returning id into v_examen_id;

  insert into public.examen_preguntas (examen_id, orden, tipo, enunciado) values
    (v_examen_id, 1, 'abierta', 'Creatividad — Del 1 al 10, ¿qué tan fácil te resultó generar ideas originales para tu proyecto final? Cuenta qué decisión creativa tomaste en tu video que no habías considerado al inicio.'),
    (v_examen_id, 2, 'abierta', 'Redacción / estructura de instrucciones — Del 1 al 10, ¿qué tan claro te sientes hoy redactando instrucciones para generar clips o imágenes con IA? Da un ejemplo de un prompt que usaste en tu proyecto y por qué funcionó.'),
    (v_examen_id, 3, 'abierta', 'Comunicación del mensaje — Del 1 al 10, ¿qué tan seguro te sientes hoy transmitiendo una idea clara en 30 segundos, después de trabajar tu hook y tu guion? Describe el mensaje central de tu video final.'),
    (v_examen_id, 4, 'abierta', 'Autenticidad y uso ético — Del 1 al 10, ¿qué tanto consideras hoy informar a tu audiencia sobre el uso de tu avatar/IA en tu contenido? ¿Cambió algo tu postura después del taller?'),
    (v_examen_id, 5, 'abierta', 'Confianza al usar IA generativa — Del 1 al 10, ¿qué tan capaz te sientes hoy de crear una pieza de contenido completa con IA de principio a fin? Menciona qué parte del proceso (guion, avatar, apoyo, edición) dominas mejor ahora.');

end $$;
