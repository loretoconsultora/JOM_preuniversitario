-- Tareas de seguimiento al Día 1 de Productividad con IA: checklist de
-- acceso técnico (Claude web + app de escritorio), listar actividades
-- repetitivas, priorizar proyecto personal, manifiesto de 12 puntos, y
-- conversar con la IA usando el prompt maestro. "Abrir correctamente
-- Claude" y "Instalar la app de escritorio" sí llevan fecha límite
-- (sábado 8 y domingo 9 de agosto 2026, respectivamente); el resto
-- queda abierto, igual que las tareas anteriores. Orden de inserción
-- calcado del orden exacto en que la docente lo tenía escrito.

do $$
declare
  v_materia_id uuid;
  v_docente_id uuid;
  v_tema1_id uuid; -- Ecosistema de Herramientas de IA
  v_tema5_id uuid; -- Uso estratégico de la IA (modela tu versión digital)
  v_tema6_id uuid; -- ¿Qué no hacer con la IA? (manifiesto personal)
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
  select id into v_tema5_id from public.temas where materia_id = v_materia_id and orden = 5;
  select id into v_tema6_id from public.temas where materia_id = v_materia_id and orden = 6;

  -- ================= A. ABRIR CORRECTAMENTE CLAUDE =================
  insert into public.tareas (materia_id, tema_id, titulo, descripcion, fecha_entrega, pide_respuesta_texto, creado_por)
  values (
    v_materia_id,
    v_tema1_id,
    'Abrir correctamente Claude',
    '<p>Antes de seguir avanzando, necesito que confirmes que ya puedes entrar bien a Claude con la cuenta de tu equipo.</p>' ||
    '<p>Pasos:</p>' ||
    '<ol>' ||
    '<li>Ubica tu equipo y sus credenciales en la carpeta de Drive que compartimos en la sesión.</li>' ||
    '<li>Abre Gmail e inicia sesión con el correo y la contraseña de tu equipo (recuerda: la contraseña de estas cuentas de Google sí termina en punto).</li>' ||
    '<li>Entra a Claude usando la opción &quot;Continuar con Google&quot;, ya con tu Gmail del equipo iniciado.</li>' ||
    '<li>Si te pide una verificación de seguridad en el correo, ábrelo primero desde una computadora y ahí confirma con la contraseña.</li>' ||
    '</ol>' ||
    '<p>Sube una captura de pantalla mostrando que ya iniciaste sesión correctamente (se debe ver tu chat de Claude ya abierto). Si sigues sin poder entrar, escríbelo en tu respuesta de texto con el mensaje de error exacto que te sale, para poder ayudarte.</p>',
    '2026-08-08',
    true,
    v_docente_id
  );

  -- ================= B. INSTALAR LA APP DE ESCRITORIO =================
  insert into public.tareas (materia_id, tema_id, titulo, descripcion, fecha_entrega, pide_respuesta_texto, creado_por)
  values (
    v_materia_id,
    v_tema1_id,
    'Instalar la app de escritorio de Claude',
    '<p>Para el Día 3 del taller vamos a usar Claude Code, y esa herramienta solo funciona bien con la aplicación de escritorio instalada — no desde el navegador.</p>' ||
    '<p>Pasos:</p>' ||
    '<ol>' ||
    '<li>Descarga la app de escritorio de Claude desde el link que compartimos en el chat del grupo.</li>' ||
    '<li>Instálala en tu computadora (no en el celular).</li>' ||
    '<li>Ábrela e inicia sesión con la misma cuenta de tu equipo que ya usas en Claude.</li>' ||
    '</ol>' ||
    '<p>Sube una captura de pantalla de la app ya instalada y abierta en tu computadora.</p>',
    '2026-08-09',
    false,
    v_docente_id
  );

  -- ================= C. LISTAR 3 ACTIVIDADES REPETITIVAS =================
  insert into public.tareas (materia_id, titulo, descripcion, pide_respuesta_texto, creado_por)
  values (
    v_materia_id,
    'Listar 3 actividades repetitivas',
    '<p>Vimos en la sesión la regla práctica: si una actividad se repite 3 veces, es candidata a automatizarse. Con eso en mente, identifica <strong>3 actividades de tu trabajo o tus estudios</strong> que hagas de forma repetitiva.</p>' ||
    '<p>Para cada una, escribe:</p>' ||
    '<ol>' ||
    '<li>Qué actividad es.</li>' ||
    '<li>Con qué frecuencia la haces (diario, semanal, etc.).</li>' ||
    '<li>Cuánto tiempo te toma aproximadamente cada vez.</li>' ||
    '<li>Por qué crees que sería un buen proyecto de IA para automatizarla.</li>' ||
    '</ol>' ||
    '<p><em>Ejemplo: &quot;Armar el reporte semanal de ventas en Excel. Lo hago cada lunes y me toma como 2 horas. Sería un buen proyecto porque siempre uso el mismo formato, solo cambian los números.&quot;</em></p>' ||
    '<p>Esta lista es la base para elegir tu proyecto personal, así que tómate tu tiempo para pensarla bien — entre más específica, mejor.</p>',
    true,
    v_docente_id
  );

  -- ================= D. DEFINIR Y PRIORIZAR TU PROYECTO PERSONAL =================
  insert into public.tareas (materia_id, titulo, descripcion, pide_respuesta_texto, creado_por)
  values (
    v_materia_id,
    'Definir y priorizar tu proyecto personal',
    '<p>A partir de las 3 actividades que listaste, elige <strong>una sola</strong> para ser tu proyecto personal del taller — el que vamos a construir en la sesión de construcción.</p>' ||
    '<p>En tu respuesta de texto, escribe:</p>' ||
    '<ol>' ||
    '<li>Cuál de las 3 actividades elegiste.</li>' ||
    '<li>Por qué la elegiste sobre las otras dos (recuerda: prioriza la que tenga mayor valor inmediato, la que más tiempo te ahorre, o la que genere más impacto).</li>' ||
    '</ol>' ||
    '<p>No hace falta que la desarrolles todavía — para eso está la tarea &quot;Plan de tu Proyecto de IA&quot;. Aquí solo necesito que decidas y te comprometas con una.</p>',
    true,
    v_docente_id
  );

  -- ================= E. MANIFIESTO PERSONAL DE USO DE IA (12 PUNTOS) =================
  insert into public.tareas (materia_id, tema_id, titulo, descripcion, pide_respuesta_texto, creado_por)
  values (
    v_materia_id,
    v_tema6_id,
    'Manifiesto personal de uso de IA (12 puntos)',
    '<p>Como platicamos en la sesión, vas a escribir tu manifiesto personal: un documento tuyo, de <strong>al menos 12 puntos</strong> (oraciones), sobre cómo y bajo qué condiciones vas a usar la inteligencia artificial.</p>' ||
    '<p>Reglas importantes:</p>' ||
    '<ul>' ||
    '<li>Debe ser escrito <strong>a mano, en papel</strong>.</li>' ||
    '<li><strong>No uses la IA</strong> para ayudarte a redactarlo — la idea es que sea completamente tuyo, para que realmente pienses cada punto (es un ejercicio de &quot;estiramiento cognitivo&quot;, como se explicó en clase).</li>' ||
    '<li>Cada punto puede comenzar con un verbo de compromiso, por ejemplo: <em>&quot;Yo usaré...&quot;</em> o <em>&quot;Yo trabajaré...&quot;</em>.</li>' ||
    '</ul>' ||
    '<p>Algunos temas que puedes considerar (no son obligatorios, son solo para inspirarte): cuándo sí y cuándo no vas a usar IA, cómo vas a proteger tu privacidad y la de otros, cómo vas a evitar el plagio, qué tanto vas a confiar en sus respuestas, y cómo quieres que la IA te ayude sin reemplazar tu propio criterio.</p>' ||
    '<p>Sube una foto legible de tu manifiesto ya escrito.</p>',
    false,
    v_docente_id
  );

  -- ================= F. CONVERSAR CON LA IA USANDO EL PROMPT MAESTRO =================
  insert into public.tareas (materia_id, tema_id, titulo, descripcion, pide_respuesta_texto, creado_por)
  values (
    v_materia_id,
    v_tema5_id,
    'Conversar con la IA usando el prompt maestro',
    '<p>Es momento de hacer el ejercicio de &quot;modelar tu versión digital&quot; que vimos en clase, usando el prompt maestro.</p>' ||
    '<p>Pasos:</p>' ||
    '<ol>' ||
    '<li>Abre un <strong>proyecto dedicado</strong> dentro de Claude (no uses el chat general, para que no se mezcle con la información de tus compañeros de equipo).</li>' ||
    '<li>Copia y pega el <strong>prompt maestro</strong> que te compartí (o pídemelo si no lo tienes a la mano) como tu primer mensaje.</li>' ||
    '<li>Responde las preguntas que te vaya haciendo la IA — si puedes, usa el micrófono en algunas respuestas para que también reconozca tu tono de voz.</li>' ||
    '<li>Cuando la IA te dé su resumen final de lo que aprendió sobre ti, revísalo y corrígelo si algo no es preciso.</li>' ||
    '</ol>' ||
    '<p>Sube una captura de pantalla del resumen final que te dio la IA sobre ti, y pega ese resumen también en tu respuesta de texto.</p>',
    true,
    v_docente_id
  );

end $$;
