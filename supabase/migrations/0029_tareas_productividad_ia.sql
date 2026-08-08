-- Tareas del curso "Productividad con IA" (Any Villegas). Todas se crean
-- sin fecha límite (abiertas indefinidamente); la docente les pondrá
-- fecha después con "Cambiar fecha límite" en cada una.

do $$
declare
  v_materia_id uuid;
  v_docente_id uuid;
  v_tema14_id uuid; -- Biblioteca de Prompts
  v_tema16_id uuid; -- GPT's
  v_tema19_id uuid; -- Estructura y Arquitectura de tu SOP
  v_tema20_id uuid; -- Construcción de tu SOP con Vercel y GitHub + Claude Code
begin
  select id into v_materia_id from public.materias where nombre = 'Productividad con IA';
  select id into v_docente_id from auth.users where email = 'anyvillegas5@gmail.com';

  if v_materia_id is null then
    raise exception 'No existe la materia "Productividad con IA".';
  end if;
  if v_docente_id is null then
    raise exception 'No existe el usuario anyvillegas5@gmail.com.';
  end if;

  select id into v_tema14_id from public.temas where materia_id = v_materia_id and orden = 14;
  select id into v_tema16_id from public.temas where materia_id = v_materia_id and orden = 16;
  select id into v_tema19_id from public.temas where materia_id = v_materia_id and orden = 19;
  select id into v_tema20_id from public.temas where materia_id = v_materia_id and orden = 20;

  -- ================= TAREA 1 =================
  insert into public.tareas (materia_id, tema_id, titulo, descripcion, creado_por)
  values (
    v_materia_id,
    v_tema14_id,
    'Biblioteca personal de Prompts',
    '<p>Vamos a construir tu propia <strong>biblioteca de prompts</strong>, organizada en 4 categorías: <strong>Académicos, Trabajo, Proyectos y Uso Personal</strong>.</p>' ||
    '<p>Para cada categoría, escribe <strong>al menos 3 prompts</strong> que realmente vayas a usar (nada de ejemplos genéricos de internet — deben responder a tus propias necesidades reales). Por cada prompt incluye:</p>' ||
    '<ol><li>El <strong>prompt completo</strong>, aplicando la estructura que vimos en clase (instrucción + contexto + formato).</li>' ||
    '<li>Una frase de <strong>para qué lo usarías</strong> (ej. "Para resumir mis apuntes de clase antes de un examen").</li></ol>' ||
    '<p>Ejemplo de un prompt de la categoría Académicos:</p>' ||
    '<p><em>"Actúa como tutor de [materia]. Te voy a compartir mis apuntes de la clase de hoy sobre [tema]. Resume los conceptos clave en una lista, y al final agrega 3 preguntas de repaso tipo examen para que yo me autoevalúe."</em></p>' ||
    '<p>Sube tu biblioteca completa en un documento (Word, PDF o Google Doc, tú decides), bien organizado por categoría.</p>',
    v_docente_id
  );

  -- ================= TAREA 2 =================
  insert into public.tareas (materia_id, tema_id, titulo, descripcion, creado_por)
  values (
    v_materia_id,
    v_tema16_id,
    'Tarea, trabajo o proyecto mejorado con IA',
    '<p>Ahora vas a poner a prueba tu biblioteca de prompts: elige <strong>una tarea, trabajo o proyecto real</strong> que tengas pendiente (de la escuela, del trabajo, o personal) y complétalo o mejóralo usando:</p>' ||
    '<ol><li><strong>Al menos uno de los prompts de tu biblioteca</strong> de la Tarea 1 (dime cuál usaste y de qué categoría).</li>' ||
    '<li><strong>Uno de tus GPT''s propios</strong> que construiste en la sección de GPT''s del curso.</li></ol>' ||
    '<p>Entrega:</p>' ||
    '<ul><li>Una breve descripción de la tarea/trabajo/proyecto que elegiste (2-3 líneas).</li>' ||
    '<li>Captura(s) de pantalla mostrando el prompt y el GPT en acción.</li>' ||
    '<li>El resultado final (documento, texto, lo que hayas producido).</li>' ||
    '<li>Una reflexión corta (mínimo 5 líneas): ¿qué tan distinto habría sido el resultado sin usar IA? ¿Cuánto tiempo te ahorraste?</li></ul>',
    v_docente_id
  );

  -- ================= TAREA 3 =================
  insert into public.tareas (materia_id, tema_id, titulo, descripcion, creado_por)
  values (
    v_materia_id,
    v_tema19_id,
    'Plan de tu Proyecto de IA',
    '<p>Es momento de planear tu propio proyecto (tu SOP) antes de construirlo. Este plan debe incluir:</p>' ||
    '<ol>' ||
    '<li><strong>Arquitectura de tu proyecto</strong> — ¿qué problema resuelve? ¿en qué fase estará al terminar el curso: Alpha o Beta?</li>' ||
    '<li><strong>Flujo UX de tu proyecto</strong> — dibuja o describe paso a paso cómo un usuario lo usaría de principio a fin (puede ser un diagrama simple, no necesita ser profesional).</li>' ||
    '<li><strong>Front end de tu proyecto</strong> — ¿qué va a ver y sentir el usuario? Menciona al menos una simulación o boceto de cómo se vería.</li>' ||
    '<li><strong>Back end de tu proyecto</strong> — ¿cuál es el flujo de uso optimizado detrás de cámaras? ¿qué información entra, qué se procesa, qué sale?</li>' ||
    '<li><strong>Fases para implementar tu proyecto</strong> — una línea de tiempo simple (puede ser por semanas o por etapas) de cómo lo vas a construir.</li>' ||
    '</ol>' ||
    '<p>Este plan es la base con la que vamos a construir tu proyecto real con Vercel, GitHub y Claude Code, así que entre más claro esté, más fácil va a ser el siguiente paso. Entrégalo en el formato que prefieras (documento, presentación, o incluso un Notion/Doc compartido).</p>',
    v_docente_id
  );

  -- ================= TAREA 4 =================
  insert into public.tareas (materia_id, tema_id, titulo, descripcion, creado_por)
  values (
    v_materia_id,
    v_tema20_id,
    'Ruta de crecimiento',
    '<p>Ya construiste tu primer proyecto. Ahora vamos a pensar en qué sigue — tu <strong>ruta de crecimiento</strong> para los próximos meses:</p>' ||
    '<ol>' ||
    '<li><strong>Plan de Fase Beta de tu proyecto</strong> — ¿qué le falta a tu proyecto actual para pasar de una primera versión a una versión mejorada? Lista al menos 3 mejoras concretas.</li>' ||
    '<li><strong>Plan de otros 2 proyectos</strong> que te gustaría desarrollar en los próximos 3 meses — para cada uno, un párrafo breve: qué problema resuelve y por qué te interesa.</li>' ||
    '<li><strong>Plan de uso de tus conocimientos y habilidades como profesional</strong> — ¿cómo vas a usar lo que aprendiste en este curso en tu trabajo, tus estudios, o tu día a día? Sé específico, no genérico (evita cosas como "lo voy a aplicar en mi trabajo" sin decir cómo).</li>' ||
    '</ol>' ||
    '<p>Este documento es tuyo, para que lo revises en unos meses y veas qué tanto has avanzado.</p>',
    v_docente_id
  );

  -- ================= TAREA 5 =================
  -- Sin tema_id: es una reflexión que cubre todo el curso, no un tema puntual.
  insert into public.tareas (materia_id, tema_id, titulo, descripcion, creado_por)
  values (
    v_materia_id,
    null,
    'Reflexión final sobre el uso de la IA',
    '<p>Para cerrar el curso, quiero que escribas una reflexión personal y honesta (mínimo una página) que toque estos tres puntos:</p>' ||
    '<ol>' ||
    '<li><strong>Beneficios e impacto social</strong> — ¿qué tanto puede ayudar la IA a las personas y comunidades a tu alrededor? Da al menos un ejemplo concreto, propio o de algo que investigaste en el curso.</li>' ||
    '<li><strong>Riesgos y uso ético de la herramienta</strong> — ¿cuáles son los riesgos que más te preocupan (sesgos, privacidad, plagio, dependencia)? ¿Qué límites te pones tú al usar IA?</li>' ||
    '<li><strong>Cómo cambió tu forma de trabajar, analizar información y crear proyectos</strong> — compara cómo hacías las cosas antes del curso vs. cómo las haces ahora.</li>' ||
    '</ol>' ||
    '<p>No hay respuestas correctas o incorrectas aquí — quiero tu opinión real, formada después de estas semanas de curso.</p>',
    v_docente_id
  );

end $$;
