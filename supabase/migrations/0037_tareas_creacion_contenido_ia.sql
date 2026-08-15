-- Tareas del taller "Creación de Contenido con IA": Tarea 1 (guion en dos
-- voces, tras Sesión 1), Tarea 2 (materiales de apoyo, tras Sesión 2) y
-- Proyecto Final (video + Foro, cierre de Sesión 3). Todas son de tema
-- libre/personal dentro de la categoría ya asignada — no hay reto único
-- para todo el grupo.

do $$
declare
  v_materia_id uuid;
  v_docente_id uuid;
  v_tema7_id uuid;  -- Práctica: construcción de tu Avatar Digital (cierre Sesión 1)
  v_tema11_id uuid; -- Práctica principal: primer corte de tu video (cierre Sesión 2)
  v_tema16_id uuid; -- Showcase: Foro de la comunidad (cierre Sesión 3)
begin
  select id into v_materia_id from public.materias where nombre = 'Creación de Contenido con IA';
  select id into v_docente_id from auth.users where email = 'anyvillegas5@gmail.com';

  if v_materia_id is null then
    raise exception 'No existe la materia "Creación de Contenido con IA". Corre primero la migración 0035.';
  end if;
  if v_docente_id is null then
    raise exception 'No existe el usuario anyvillegas5@gmail.com.';
  end if;

  select id into v_tema7_id from public.temas where materia_id = v_materia_id and orden = 7;
  select id into v_tema11_id from public.temas where materia_id = v_materia_id and orden = 11;
  select id into v_tema16_id from public.temas where materia_id = v_materia_id and orden = 16;

  -- ================= TAREA 1: GUION EN DOS VOCES =================
  insert into public.tareas (materia_id, tema_id, titulo, descripcion, pide_respuesta_texto, creado_por)
  values (
    v_materia_id,
    v_tema7_id,
    'Guion en dos voces',
    '<p>Con tu tema de proyecto ya confirmado, escribe un mini guion de tu video (máximo 30 segundos en total) dividido en dos voces:</p>' ||
    '<ul>' ||
    '<li><strong>Lo que dice tu avatar</strong> — la parte que vas a generar con tu Avatar Digital.</li>' ||
    '<li><strong>Lo que dices tú</strong> (en texto, para narrar o mostrar con clips de apoyo) — la parte que vas a acompañar con materiales de apoyo en la Sesión 2.</li>' ||
    '</ul>' ||
    '<p><em>Ejemplo: "Avatar: Hola, soy [nombre] y hoy te voy a platicar sobre [tema]. — Yo (con clips de apoyo): [aquí explico el resto con imágenes/clips de apoyo]."</em></p>' ||
    '<p>Sube tu avatar de prueba (el clip que generaste en la Sesión 1) junto con tu guion.</p>',
    true,
    v_docente_id
  );

  -- ================= TAREA 2: MATERIALES DE APOYO =================
  insert into public.tareas (materia_id, tema_id, titulo, descripcion, pide_respuesta_texto, creado_por)
  values (
    v_materia_id,
    v_tema11_id,
    'Materiales de apoyo',
    '<p>Reúne o genera al menos <strong>2 clips o fotos de apoyo</strong> para la parte de tu guion que tú narras (no la de tu avatar).</p>' ||
    '<p>En tu respuesta de texto, dime:</p>' ||
    '<ol>' ||
    '<li>Si cada material es de banco de stock o generado 100% con IA.</li>' ||
    '<li>El prompt que usaste, si generaste alguno con IA.</li>' ||
    '</ol>' ||
    '<p>Sube tus materiales de apoyo como evidencia.</p>',
    true,
    v_docente_id
  );

  -- ================= PROYECTO FINAL =================
  insert into public.tareas (materia_id, tema_id, titulo, descripcion, pide_respuesta_texto, creado_por)
  values (
    v_materia_id,
    v_tema16_id,
    'Proyecto Final: tu video con IA',
    '<p>Sube tu video final (~30 segundos), ya con tu avatar, tus materiales de apoyo, transiciones y hook trabajado.</p>' ||
    '<p>En tu respuesta de texto, comparte:</p>' ||
    '<ul>' ||
    '<li>Tu tema y el mensaje central de tu video.</li>' ||
    '<li>Qué fue lo que más se te dificultó y cómo lo resolviste.</li>' ||
    '</ul>' ||
    '<p><strong>No olvides:</strong> también publica tu video en el <strong>Foro</strong> de esta materia, y comenta al menos <strong>2 videos de tus compañeros</strong> (algo que te gustó + una sugerencia) — esa parte se hace directo en el Foro, no aquí.</p>',
    true,
    v_docente_id
  );

end $$;
