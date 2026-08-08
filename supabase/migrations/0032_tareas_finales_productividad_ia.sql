-- "Proyecto Final" y "Showcase final + Foro comunidad" del curso
-- Productividad con IA. Ambas piden respuesta de texto (además de la
-- evidencia de archivo que toda tarea admite) para que el alumno pegue
-- el link de su proyecto/video; la parte de comentar el trabajo de sus
-- compañeros se hace en la nueva sección Foro, no dentro de la tarea.

do $$
declare
  v_materia_id uuid;
  v_docente_id uuid;
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

  select id into v_tema20_id from public.temas where materia_id = v_materia_id and orden = 20;

  -- ================= PROYECTO FINAL =================
  insert into public.tareas (materia_id, tema_id, titulo, descripcion, pide_respuesta_texto, creado_por)
  values (
    v_materia_id,
    v_tema20_id,
    'Proyecto Final',
    '<p>Es momento de construir tu proyecto de IA a partir del plan que armaste en la Tarea 3. Tu entrega debe demostrar:</p>' ||
    '<ol>' ||
    '<li><strong>Front end</strong> — que se pueda usar de verdad, no solo bocetos.</li>' ||
    '<li><strong>Back end funcional</strong> — que el flujo que planeaste realmente funcione (aunque sea en su versión más simple).</li>' ||
    '<li><strong>Uso de principio a fin</strong> — que puedas mostrar el recorrido completo de un usuario usándolo, no solo partes sueltas.</li>' ||
    '</ol>' ||
    '<p>Entrega:</p>' ||
    '<ul>' ||
    '<li>El link a tu proyecto ya desplegado (Vercel u otro) — pégalo en tu respuesta de texto.</li>' ||
    '<li>Cualquier archivo de apoyo que quieras agregar (capturas, documentación).</li>' ||
    '</ul>' ||
    '<p>Si tu proyecto todavía no está 100% terminado, entrégalo como esté — lo importante es que se vea el avance real de construcción, no que esté perfecto.</p>',
    true,
    v_docente_id
  );

  -- ================= SHOWCASE FINAL + FORO COMUNIDAD =================
  insert into public.tareas (materia_id, tema_id, titulo, descripcion, pide_respuesta_texto, creado_por)
  values (
    v_materia_id,
    v_tema20_id,
    'Showcase final + Foro comunidad',
    '<p>Cierra el curso compartiendo tu proyecto con todo el grupo.</p>' ||
    '<ol>' ||
    '<li>Graba un <strong>video corto</strong> explicando tu proyecto (como prefieras: pantalla, cámara, o ambas) y súbelo a donde quieras (YouTube, Drive, etc.).</li>' ||
    '<li>Comparte también, en un texto breve:' ||
      '<ul>' ||
        '<li><strong>Objetivo</strong> — qué problema resuelve tu proyecto.</li>' ||
        '<li><strong>Alcance</strong> — qué tanto abarca hoy, en su versión actual.</li>' ||
        '<li><strong>Impacto en la comunidad/sociedad</strong> — a quién le sirve y cómo.</li>' ||
        '<li><strong>Proyección Fase Beta</strong> — qué le agregarías si siguieras desarrollándolo.</li>' ||
      '</ul>' ||
    '</li>' ||
    '<li>Publica tu video y tu texto también en el <strong>Foro</strong> de esta materia, para que tus compañeros lo vean.</li>' ||
    '<li>Entra al Foro y <strong>comenta en al menos 3 proyectos de tus compañeros</strong>. En cada comentario comparte:' ||
      '<ul>' ||
        '<li>3 beneficios que le ves a su herramienta.</li>' ||
        '<li>1 retroalimentación de cómo podría optimizarse.</li>' ||
      '</ul>' ||
    '</li>' ||
    '</ol>' ||
    '<p>Entrega aquí (en esta tarea): el link de tu video y tu texto de objetivo/alcance/impacto/proyección, en tu respuesta de texto. La parte de comentar el trabajo de tus compañeros se hace directo en el Foro, no aquí.</p>',
    true,
    v_docente_id
  );

end $$;
