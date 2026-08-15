-- Temario del taller "Creación de Contenido con IA" (Any Villegas): 3
-- sesiones de 90 min, 16 temas. Cada bloque de práctica trae su propio
-- subtema de "Instrucción y ejemplo" para que la indicación quede
-- siempre clara y con un modelo concreto a seguir, no solo teoría.

do $$
declare
  v_materia_id uuid;
  v_docente_id uuid;
  v_tema_id uuid;
begin
  select id into v_materia_id from public.materias where nombre = 'Creación de Contenido con IA';
  select id into v_docente_id from auth.users where email = 'anyvillegas5@gmail.com';

  if v_materia_id is null then
    raise exception 'No existe la materia "Creación de Contenido con IA". Corre primero la migración 0035.';
  end if;
  if v_docente_id is null then
    raise exception 'No existe el usuario anyvillegas5@gmail.com.';
  end if;

  -- ================= SESIÓN 1 =================

  insert into public.temas (materia_id, titulo, descripcion, orden, creado_por)
  values (v_materia_id, 'Bienvenida, ética y tu tema de proyecto', 'Sesión 1', 1, v_docente_id)
  returning id into v_tema_id;
  insert into public.subtemas (tema_id, titulo, detalle, orden, creado_por) values
    (v_tema_id, 'Recordatorio rápido de ética de IA', 'Retomamos lo visto en Productividad con IA — no se profundiza, solo se conecta con lo nuevo.', 1, v_docente_id),
    (v_tema_id, 'Confirma el tema de tu proyecto', 'Tu tema ya fue asignado/rifado antes de esta sesión. Aquí solo lo confirmas en voz alta con el grupo.', 2, v_docente_id);

  insert into public.temas (materia_id, titulo, descripcion, orden, creado_por)
  values (v_materia_id, 'Estructura de un buen prompt para video/imagen', 'Sesión 1', 2, v_docente_id)
  returning id into v_tema_id;
  insert into public.subtemas (tema_id, titulo, detalle, orden, creado_por) values
    (v_tema_id, 'Instrucción, contexto y formato', 'La misma estructura de Productividad con IA, aplicada a video e imagen: la precisión del prompt es lo que determina si el clip sale bien o no.', 1, v_docente_id);

  insert into public.temas (materia_id, titulo, descripcion, orden, creado_por)
  values (v_materia_id, 'Ejemplos de aplicación: 3 casos', 'Sesión 1', 3, v_docente_id)
  returning id into v_tema_id;
  insert into public.subtemas (tema_id, titulo, detalle, orden, creado_por) values
    (v_tema_id, 'Caso académico', 'Prompt 1 (guion): "Actúa como profesor de [materia]. Escríbeme un guion de 30 segundos donde explico [concepto] de forma sencilla, con un hook en los primeros 3 segundos." Prompt 2 (avatar): "Usa mi avatar. Que diga este guion con tono cercano y didáctico, plano medio, fondo neutro tipo salón de clases." Prompt 3 (apoyo): "Genérame un clip de 3 segundos que ilustre [concepto], estilo animación simple."', 1, v_docente_id),
    (v_tema_id, 'Caso institucional (comunicación de una fundación)', 'Prompt 1 (guion): "Actúa como responsable de comunicación de una fundación social. Escríbeme un guion de 30 segundos invitando a [participar en X], tono cálido y llamado a la acción claro." Prompt 2 (avatar): "Usa mi avatar con vestimenta formal, tono institucional pero cercano, plano medio." Prompt 3 (apoyo): "Genérame 2 clips que muestren el impacto de la campaña, estilo documental."', 2, v_docente_id),
    (v_tema_id, 'Caso de marca personal / negocio', 'Prompt 1 (guion): "Actúa como estratega de contenido. Escríbeme un guion de 30 segundos donde promociono [mi servicio], resolviendo el dolor de mi cliente ideal en los primeros 3 segundos." Prompt 2 (avatar): "Usa mi avatar, tono seguro y entusiasta, fondo que transmita profesionalismo." Prompt 3 (apoyo): "Genérame un clip que muestre mi producto/servicio en uso, estilo realista."', 3, v_docente_id);

  insert into public.temas (materia_id, titulo, descripcion, orden, creado_por)
  values (v_materia_id, 'Usos comunes de fotografía con IA', 'Sesión 1', 4, v_docente_id)
  returning id into v_tema_id;
  insert into public.subtemas (tema_id, titulo, detalle, orden, creado_por) values
    (v_tema_id, 'Edición y retoque', 'Quitar o cambiar el fondo, mejorar calidad de una foto tomada con el celular, ajustar iluminación.', 1, v_docente_id),
    (v_tema_id, 'Mockups', 'Colocar tu producto o diseño en una escena realista: una taza, una pantalla, un cartel, un empaque.', 2, v_docente_id),
    (v_tema_id, 'Generación desde cero y variaciones', 'Crear una imagen conceptual que no existe, o generar variaciones (otro ángulo, otra pose) a partir de una sola foto real.', 3, v_docente_id);

  insert into public.temas (materia_id, titulo, descripcion, orden, creado_por)
  values (v_materia_id, 'Anatomía narrativa: hook, mensaje, ritmo', 'Sesión 1', 5, v_docente_id)
  returning id into v_tema_id;
  insert into public.subtemas (tema_id, titulo, detalle, orden, creado_por) values
    (v_tema_id, 'El hook: los primeros 3 segundos', 'Lo primero que ve tu audiencia decide si se queda o le da skip.', 1, v_docente_id),
    (v_tema_id, 'Dopamina y ritmo de corte', 'Cada cuánto cambiar de plano o de clip para mantener la atención sin saturar.', 2, v_docente_id);

  insert into public.temas (materia_id, titulo, descripcion, orden, creado_por)
  values (v_materia_id, 'Ética y tu imagen: transparencia y derechos', 'Sesión 1', 6, v_docente_id)
  returning id into v_tema_id;
  insert into public.subtemas (tema_id, titulo, detalle, orden, creado_por) values
    (v_tema_id, 'Transparencia con tu audiencia', 'Cuándo y cómo aclarar que un contenido fue creado o apoyado con IA (por ejemplo, tu avatar).', 1, v_docente_id),
    (v_tema_id, 'Derechos sobre tu propia imagen', 'Qué implica usar tu rostro para construir un avatar digital.', 2, v_docente_id);

  insert into public.temas (materia_id, titulo, descripcion, orden, creado_por)
  values (v_materia_id, 'Práctica: construcción de tu Avatar Digital', 'Sesión 1', 7, v_docente_id)
  returning id into v_tema_id;
  insert into public.subtemas (tema_id, titulo, detalle, orden, creado_por) values
    (v_tema_id, 'Instrucción y ejemplo', 'Instrucción: sube entre 5 y 8 fotos claras de tu rostro (distintos ángulos, buena luz, sin lentes oscuros) y genera tu avatar en Higgsfield. Después pide un clip de prueba de 5 segundos donde tu avatar se presente. Ejemplo de prompt: "Usa mis fotos para crear mi avatar. Genérame un clip de 5 segundos donde me presento diciendo mi nombre y una frase corta sobre lo que voy a compartir en este taller, con tono cercano y una sonrisa natural."', 1, v_docente_id);

  -- ================= SESIÓN 2 =================

  insert into public.temas (materia_id, titulo, descripcion, orden, creado_por)
  values (v_materia_id, 'Repaso: tema y guion de cada quien', 'Sesión 2', 8, v_docente_id);

  insert into public.temas (materia_id, titulo, descripcion, orden, creado_por)
  values (v_materia_id, 'Práctica: materiales de apoyo', 'Sesión 2', 9, v_docente_id)
  returning id into v_tema_id;
  insert into public.subtemas (tema_id, titulo, detalle, orden, creado_por) values
    (v_tema_id, 'Instrucción y ejemplo', 'Instrucción: define si tu apoyo será de banco de stock o 100% generado con IA, y crea o reúne al menos 2 clips/fotos para la parte de tu guion que tú narras (no tu avatar). Ejemplo de prompt (100% IA): "Genérame un clip de 3 segundos que muestre [describe la escena de tu tema], estilo realista, para usar como apoyo visual mientras narro esta parte."', 1, v_docente_id);

  insert into public.temas (materia_id, titulo, descripcion, orden, creado_por)
  values (v_materia_id, 'Transiciones y efectos en Higgsfield', 'Sesión 2', 10, v_docente_id)
  returning id into v_tema_id;
  insert into public.subtemas (tema_id, titulo, detalle, orden, creado_por) values
    (v_tema_id, 'Instrucción y ejemplo', 'Instrucción: aplica al menos una transición entre dos de tus clips (avatar → apoyo, o apoyo → apoyo) y prueba un efecto simple. Ejemplo de prompt: "Aplica una transición de corte rápido con zoom entre este clip de mi avatar y el siguiente clip de apoyo, manteniendo el ritmo del video."', 1, v_docente_id);

  insert into public.temas (materia_id, titulo, descripcion, orden, creado_por)
  values (v_materia_id, 'Práctica principal: primer corte de tu video', 'Sesión 2', 11, v_docente_id)
  returning id into v_tema_id;
  insert into public.subtemas (tema_id, titulo, detalle, orden, creado_por) values
    (v_tema_id, 'Instrucción y ejemplo', 'Instrucción: ensambla el primer corte completo de tu video usando el guion de tu Tarea 1 — la parte de tu avatar, tus clips de apoyo, y al menos una transición. Todavía no tiene que estar perfecto, el objetivo es tener una primera versión de principio a fin. Ejemplo: retoma el prompt de tu caso (académico, institucional o marca personal) de la Sesión 1, y adáptalo con tu guion real.', 1, v_docente_id);

  -- ================= SESIÓN 3 =================

  insert into public.temas (materia_id, titulo, descripcion, orden, creado_por)
  values (v_materia_id, 'Revisión de avances y dudas técnicas', 'Sesión 3', 12, v_docente_id);

  insert into public.temas (materia_id, titulo, descripcion, orden, creado_por)
  values (v_materia_id, 'Práctica: hooks virales aplicados', 'Sesión 3', 13, v_docente_id)
  returning id into v_tema_id;
  insert into public.subtemas (tema_id, titulo, detalle, orden, creado_por) values
    (v_tema_id, 'Instrucción y ejemplo', 'Instrucción: revisa los primeros 3 segundos de tu video y evalúa si enganchan de inmediato. Si no, ajústalos. Ejemplo de prompt: "Revisa el inicio de mi video. Quiero que los primeros 3 segundos generen una pregunta o sorpresa que evite el skip. Propón 2 alternativas de cómo abrir mi video sobre [tema]."', 1, v_docente_id);

  insert into public.temas (materia_id, titulo, descripcion, orden, creado_por)
  values (v_materia_id, 'Ritmo y edición final: cortes y duración', 'Sesión 3', 14, v_docente_id)
  returning id into v_tema_id;
  insert into public.subtemas (tema_id, titulo, detalle, orden, creado_por) values
    (v_tema_id, 'Checklist antes de exportar', 'Duración total de ~30 segundos, al menos una transición, hook funcionando en los primeros 3 segundos.', 1, v_docente_id);

  insert into public.temas (materia_id, titulo, descripcion, orden, creado_por)
  values (v_materia_id, 'Práctica principal: terminar y exportar tu video final', 'Sesión 3', 15, v_docente_id)
  returning id into v_tema_id;
  insert into public.subtemas (tema_id, titulo, detalle, orden, creado_por) values
    (v_tema_id, 'Instrucción y ejemplo', 'Instrucción: revisa tu video contra el checklist (duración ~30 seg, al menos una transición, hook funcionando) y expórtalo en la calidad recomendada por Higgsfield. Ejemplo: usa el mismo checklist del tema anterior como lista de verificación final antes de exportar.', 1, v_docente_id);

  insert into public.temas (materia_id, titulo, descripcion, orden, creado_por)
  values (v_materia_id, 'Showcase: Foro de la comunidad', 'Sesión 3', 16, v_docente_id)
  returning id into v_tema_id;
  insert into public.subtemas (tema_id, titulo, detalle, orden, creado_por) values
    (v_tema_id, 'Instrucción y ejemplo', 'Instrucción: publica tu video terminado en el Foro de esta materia, contando tu tema y tu mensaje. Después comenta al menos 2 videos de tus compañeros, destacando algo que te gustó y una sugerencia. Ejemplo de comentario: "Me encantó cómo tu avatar explica [X] con un tono muy natural — como sugerencia, quizá el segundo clip de apoyo podría ser un poco más corto para no perder el ritmo."', 1, v_docente_id);

end $$;
