-- Temario de "Productividad con IA" (Any Villegas), a partir de
-- "Planeación del Curso.pdf" (Día 1, Día 2, Día 3 — 20 temas con sus
-- subtemas). Se agrega el número de día en la descripción de cada tema
-- para no perder esa referencia, ya que el temario solo tiene dos
-- niveles (tema → subtema).

do $$
declare
  v_materia_id uuid;
  v_docente_id uuid;
  v_tema_id uuid;
begin
  select id into v_materia_id from public.materias where nombre = 'Productividad con IA';
  select id into v_docente_id from auth.users where email = 'anyvillegas5@gmail.com';

  if v_materia_id is null then
    raise exception 'No existe la materia "Productividad con IA". Corre primero la migración 0027.';
  end if;
  if v_docente_id is null then
    raise exception 'No existe el usuario anyvillegas5@gmail.com.';
  end if;

  -- ================= DÍA 1 =================

  insert into public.temas (materia_id, titulo, descripcion, orden, creado_por)
  values (v_materia_id, 'Ecosistema de Herramientas de IA', 'Día 1', 1, v_docente_id)
  returning id into v_tema_id;
  insert into public.subtemas (tema_id, titulo, orden, creado_por) values
    (v_tema_id, '¿Cómo elegir la herramienta correcta? Panorama actual', 1, v_docente_id);

  insert into public.temas (materia_id, titulo, descripcion, orden, creado_por)
  values (v_materia_id, '¿Qué se puede hacer y qué no puede hacer la IA?', 'Día 1', 2, v_docente_id);

  insert into public.temas (materia_id, titulo, descripcion, orden, creado_por)
  values (v_materia_id, 'Tipos de IA', 'Día 1', 3, v_docente_id)
  returning id into v_tema_id;
  insert into public.subtemas (tema_id, titulo, orden, creado_por) values
    (v_tema_id, 'LLM', 1, v_docente_id),
    (v_tema_id, 'Generativa vs tradicional', 2, v_docente_id);

  insert into public.temas (materia_id, titulo, descripcion, orden, creado_por)
  values (v_materia_id, 'Uso ético de la IA', 'Día 1', 4, v_docente_id);

  insert into public.temas (materia_id, titulo, descripcion, orden, creado_por)
  values (v_materia_id, 'Uso estratégico de la IA', 'Día 1', 5, v_docente_id)
  returning id into v_tema_id;
  insert into public.subtemas (tema_id, titulo, orden, creado_por) values
    (v_tema_id, 'Modela tu versión digital', 1, v_docente_id),
    (v_tema_id, 'Aprendizaje continuo → actualización continua de tu IA', 2, v_docente_id);

  insert into public.temas (materia_id, titulo, descripcion, orden, creado_por)
  values (v_materia_id, '¿Qué no hacer con la IA? (Aunque se pueda)', 'Día 1', 6, v_docente_id)
  returning id into v_tema_id;
  insert into public.subtemas (tema_id, titulo, orden, creado_por) values
    (v_tema_id, 'Plagio, autenticidad y uso responsable', 1, v_docente_id),
    (v_tema_id, 'Sesgos en la IA', 2, v_docente_id),
    (v_tema_id, 'Datos personales y privacidad', 3, v_docente_id),
    (v_tema_id, 'Criterio crítico: cuándo confiar y cuándo cuestionar', 4, v_docente_id),
    (v_tema_id, 'Manifiesto personal', 5, v_docente_id);

  insert into public.temas (materia_id, titulo, descripcion, orden, creado_por)
  values (v_materia_id, 'Aplicación de la IA en tareas', 'Día 1', 7, v_docente_id);

  insert into public.temas (materia_id, titulo, descripcion, orden, creado_por)
  values (v_materia_id, 'Aplicación de la IA en trabajo', 'Día 1', 8, v_docente_id);

  insert into public.temas (materia_id, titulo, descripcion, orden, creado_por)
  values (v_materia_id, 'Aplicación de la IA en proyectos', 'Día 1', 9, v_docente_id);

  insert into public.temas (materia_id, titulo, descripcion, orden, creado_por)
  values (v_materia_id, 'Ejemplos de uso de la IA en causas sociales', 'Día 1', 10, v_docente_id);

  insert into public.temas (materia_id, titulo, descripcion, orden, creado_por)
  values (v_materia_id, 'Ejemplo de uso de la IA en vida personal', 'Día 1', 11, v_docente_id);

  insert into public.temas (materia_id, titulo, descripcion, orden, creado_por)
  values (v_materia_id, 'Tu nuevo CV: Portafolio de IA', 'Día 1', 12, v_docente_id);

  -- ================= DÍA 2 =================

  insert into public.temas (materia_id, titulo, descripcion, orden, creado_por)
  values (v_materia_id, 'Prompt Engineering', 'Día 2', 13, v_docente_id)
  returning id into v_tema_id;
  insert into public.subtemas (tema_id, titulo, detalle, orden, creado_por) values
    (v_tema_id, 'Estructura de un buen prompt: anatomía, instrucción, contexto, formato', null, 1, v_docente_id),
    (v_tema_id, 'Iteración y refinamiento: factor humano', null, 2, v_docente_id),
    (v_tema_id, 'Ejemplo: aplicación para uso en investigación', null, 3, v_docente_id),
    (v_tema_id, 'Ejemplo: aplicación para análisis y síntesis de texto y datos', null, 4, v_docente_id),
    (v_tema_id, 'Ejemplo: aplicación para redacción de documentos / propuestas / proyectos', 'Planes de estudio, planes de trabajo, plan de mejora.', 5, v_docente_id),
    (v_tema_id, 'Ejemplo: aplicación para planear un proyecto', null, 6, v_docente_id),
    (v_tema_id, 'Comparativa de un buen y un mal prompt', null, 7, v_docente_id);

  insert into public.temas (materia_id, titulo, descripcion, orden, creado_por)
  values (v_materia_id, 'Biblioteca de Prompts', 'Día 2', 14, v_docente_id)
  returning id into v_tema_id;
  insert into public.subtemas (tema_id, titulo, orden, creado_por) values
    (v_tema_id, 'Aplicación para tareas académicas', 1, v_docente_id),
    (v_tema_id, 'Aplicación en el trabajo', 2, v_docente_id),
    (v_tema_id, 'Aplicación en proyectos', 3, v_docente_id);

  insert into public.temas (materia_id, titulo, descripcion, orden, creado_por)
  values (v_materia_id, 'Secuencia de Prompts: Tu propia guía de IA (reto opcional)', 'Día 2', 15, v_docente_id);

  insert into public.temas (materia_id, titulo, descripcion, orden, creado_por)
  values (v_materia_id, 'GPT''s', 'Día 2', 16, v_docente_id)
  returning id into v_tema_id;
  insert into public.subtemas (tema_id, titulo, orden, creado_por) values
    (v_tema_id, 'Automatización de tareas repetitivas', 1, v_docente_id),
    (v_tema_id, 'Definición de variables, lógica y flujo (proceso mental y constructivo)', 2, v_docente_id),
    (v_tema_id, 'Biblioteca con aplicación en rubro a elegir', 3, v_docente_id);

  -- ================= DÍA 3 =================

  insert into public.temas (materia_id, titulo, descripcion, orden, creado_por)
  values (v_materia_id, 'Tu propio SOP con Claude Code', 'Día 3', 17, v_docente_id);

  insert into public.temas (materia_id, titulo, descripcion, orden, creado_por)
  values (v_materia_id, 'Oportunidad Software as a Service y ejemplo de aplicaciones', 'Día 3', 18, v_docente_id)
  returning id into v_tema_id;
  insert into public.subtemas (tema_id, titulo, orden, creado_por) values
    (v_tema_id, '¿Dónde puedes usar estos conocimientos y habilidades?', 1, v_docente_id);

  insert into public.temas (materia_id, titulo, descripcion, orden, creado_por)
  values (v_materia_id, 'Estructura y Arquitectura de tu SOP', 'Día 3', 19, v_docente_id)
  returning id into v_tema_id;
  insert into public.subtemas (tema_id, titulo, detalle, orden, creado_por) values
    (v_tema_id, 'Fase Alpha, Beta, etc.', null, 1, v_docente_id),
    (v_tema_id, 'Front end', 'Experiencia de usuario; simulaciones.', 2, v_docente_id),
    (v_tema_id, 'Back end', 'Flujo de uso (proceso optimizado).', 3, v_docente_id);

  insert into public.temas (materia_id, titulo, descripcion, orden, creado_por)
  values (v_materia_id, 'Construcción de tu SOP con Vercel y GitHub + Claude Code', 'Día 3', 20, v_docente_id)
  returning id into v_tema_id;
  insert into public.subtemas (tema_id, titulo, orden, creado_por) values
    (v_tema_id, 'Refinamiento y mejora continua', 1, v_docente_id),
    (v_tema_id, 'Simulación, pruebas y error', 2, v_docente_id),
    (v_tema_id, 'Filosofía LEAN', 3, v_docente_id);

end $$;
