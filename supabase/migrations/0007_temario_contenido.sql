-- Carga el temario real del curso (Matemáticas completo, Física completo,
-- Química parcial — el documento fuente marca esa sección como incompleta,
-- "pendiente de fotos", así que solo se cargan sus primeros 5 temas).
-- Usa un bloque plpgsql para poder capturar el id de cada tema recién
-- insertado (v_tema_id) y usarlo de inmediato al insertar sus subtemas,
-- sin depender de matching por título.

do $$
declare
  v_docente_id uuid;
  v_mat_id uuid;
  v_tema_id uuid;
begin
  select id into v_docente_id from public.profiles where role = 'docente' order by created_at limit 1;
  if v_docente_id is null then
    raise exception 'No hay ningún perfil con role=docente; no se puede asignar creado_por.';
  end if;

  -- ============================================================
  -- MATEMÁTICAS
  -- ============================================================
  select id into v_mat_id from public.materias where nombre = 'Matemáticas';

  insert into public.temas (materia_id, titulo, orden, creado_por)
  values (v_mat_id, 'Operaciones con números reales, complejos y expresiones algebraicas', 1, v_docente_id)
  returning id into v_tema_id;
  insert into public.subtemas (tema_id, titulo, detalle, orden, creado_por) values
    (v_tema_id, 'Números reales', '1.1.1 Suma y resta; 1.1.2 Multiplicación y división; 1.1.3 Raíces y potencias con exponente racional', 0, v_docente_id),
    (v_tema_id, 'Números complejos', '1.2.1 Suma y resta; 1.2.2 Multiplicación', 1, v_docente_id),
    (v_tema_id, 'Expresiones algebraicas', '1.3.1 Suma y resta; 1.3.2 Multiplicación y división; 1.3.3 Raíces y potencias con exponente racional; 1.3.4 Operaciones con radicales', 2, v_docente_id);

  insert into public.temas (materia_id, titulo, orden, creado_por)
  values (v_mat_id, 'Productos notables y factorización', 2, v_docente_id)
  returning id into v_tema_id;
  insert into public.subtemas (tema_id, titulo, orden, creado_por) values
    (v_tema_id, 'Binomio de Newton (a+b)^n, n ∈ N', 0, v_docente_id),
    (v_tema_id, 'Teorema del residuo y del factor', 1, v_docente_id),
    (v_tema_id, 'Simplificación de fracciones algebraicas', 2, v_docente_id),
    (v_tema_id, 'Operaciones con fracciones algebraicas', 3, v_docente_id);

  insert into public.temas (materia_id, titulo, orden, creado_por)
  values (v_mat_id, 'Ecuaciones', 3, v_docente_id)
  returning id into v_tema_id;
  insert into public.subtemas (tema_id, titulo, orden, creado_por) values
    (v_tema_id, 'Ecuación, identidad y propiedades de la igualdad', 0, v_docente_id),
    (v_tema_id, 'Ecuaciones de primer grado', 1, v_docente_id),
    (v_tema_id, 'Ecuaciones de segundo grado', 2, v_docente_id);

  insert into public.temas (materia_id, titulo, orden, creado_por)
  values (v_mat_id, 'Desigualdades', 4, v_docente_id)
  returning id into v_tema_id;
  insert into public.subtemas (tema_id, titulo, orden, creado_por) values
    (v_tema_id, 'Desigualdad de primer grado en una variable y sus propiedades', 0, v_docente_id);

  insert into public.temas (materia_id, titulo, orden, creado_por)
  values (v_mat_id, 'Sistemas de ecuaciones', 5, v_docente_id)
  returning id into v_tema_id;
  insert into public.subtemas (tema_id, titulo, detalle, orden, creado_por) values
    (v_tema_id, 'Sistemas de dos ecuaciones lineales con dos incógnitas', '5.1.1 Métodos de solución', 0, v_docente_id),
    (v_tema_id, 'Sistemas de tres ecuaciones lineales con tres incógnitas', '5.2.1 Métodos de solución (Regla de Cramer)', 1, v_docente_id);

  insert into public.temas (materia_id, titulo, orden, creado_por)
  values (v_mat_id, 'Funciones algebraicas', 6, v_docente_id)
  returning id into v_tema_id;
  insert into public.subtemas (tema_id, titulo, orden, creado_por) values
    (v_tema_id, 'Dominio, contradominio y regla de correspondencia', 0, v_docente_id),
    (v_tema_id, 'Rango o imagen', 1, v_docente_id),
    (v_tema_id, 'Gráfica', 2, v_docente_id),
    (v_tema_id, 'Implícitas y explícitas', 3, v_docente_id),
    (v_tema_id, 'Crecientes y decrecientes', 4, v_docente_id),
    (v_tema_id, 'Continuas y discontinuas', 5, v_docente_id),
    (v_tema_id, 'Álgebra de funciones', 6, v_docente_id);

  insert into public.temas (materia_id, titulo, orden, creado_por)
  values (v_mat_id, 'Trigonometría', 7, v_docente_id)
  returning id into v_tema_id;
  insert into public.subtemas (tema_id, titulo, detalle, orden, creado_por) values
    (v_tema_id, 'Trigonometría básica', '7.1.1 Medida de un ángulo (conversión de grados a radianes y de radianes a grados); 7.1.2 Razones trigonométricas; 7.1.3 Resolución de triángulos rectángulos; 7.1.4 Ley de los Senos y Ley de los Cosenos; 7.1.5 Resolución de triángulos oblicuángulos; 7.1.6 Razones trigonométricas para un ángulo en cualquier cuadrante. Fórmulas de reducción', 0, v_docente_id),
    (v_tema_id, 'Funciones trigonométricas', '7.2.1 El círculo trigonométrico; 7.2.2 Funciones trigonométricas directas (7.2.2.1 Dominio y rango; 7.2.2.2 Periodo y amplitud; 7.2.2.3 Desfasamiento; 7.2.2.4 Asíntotas de la gráfica)', 1, v_docente_id);

  insert into public.temas (materia_id, titulo, orden, creado_por)
  values (v_mat_id, 'Funciones exponenciales y logarítmicas', 8, v_docente_id)
  returning id into v_tema_id;
  insert into public.subtemas (tema_id, titulo, orden, creado_por) values
    (v_tema_id, 'Dominio y rango', 0, v_docente_id),
    (v_tema_id, 'Gráficas y asíntotas', 1, v_docente_id);

  insert into public.temas (materia_id, titulo, orden, creado_por)
  values (v_mat_id, 'Recta', 9, v_docente_id)
  returning id into v_tema_id;
  insert into public.subtemas (tema_id, titulo, detalle, orden, creado_por) values
    (v_tema_id, 'Distancia entre dos puntos', null, 0, v_docente_id),
    (v_tema_id, 'Coordenadas de un punto que divide a un segmento de acuerdo con una razón dada', null, 1, v_docente_id),
    (v_tema_id, 'Pendiente de una recta', null, 2, v_docente_id),
    (v_tema_id, 'Formas de la ecuación de la recta y su gráfica', null, 3, v_docente_id),
    (v_tema_id, 'Condiciones de paralelismo y perpendicularidad', null, 4, v_docente_id),
    (v_tema_id, 'Distancia de un punto a una recta', null, 5, v_docente_id),
    (v_tema_id, 'Ecuaciones de las medianas, mediatrices y alturas de un triángulo. Puntos de intersección', 'Ortocentro, circuncentro y baricentro', 6, v_docente_id);

  insert into public.temas (materia_id, titulo, orden, creado_por)
  values (v_mat_id, 'Circunferencia', 10, v_docente_id)
  returning id into v_tema_id;
  insert into public.subtemas (tema_id, titulo, orden, creado_por) values
    (v_tema_id, 'Circunferencia como lugar geométrico', 0, v_docente_id),
    (v_tema_id, 'Formas ordinaria (canónica) y general de la ecuación de la circunferencia con centro en el origen', 1, v_docente_id),
    (v_tema_id, 'Ecuación de la circunferencia con centro en (h, k) en las formas ordinaria y general', 2, v_docente_id),
    (v_tema_id, 'Elementos de una circunferencia', 3, v_docente_id);

  insert into public.temas (materia_id, titulo, orden, creado_por)
  values (v_mat_id, 'Parábola', 11, v_docente_id)
  returning id into v_tema_id;
  insert into public.subtemas (tema_id, titulo, orden, creado_por) values
    (v_tema_id, 'Parábola como lugar geométrico', 0, v_docente_id),
    (v_tema_id, 'Formas ordinaria y general de la ecuación de la parábola cuando el vértice está en el origen y el eje focal coincide con alguno de los ejes coordenados', 1, v_docente_id),
    (v_tema_id, 'Formas ordinaria y general de la ecuación de la parábola cuando el vértice está en un punto cualquiera del plano y eje focal paralelo a alguno de los ejes coordenados', 2, v_docente_id),
    (v_tema_id, 'Elementos de una parábola', 3, v_docente_id);

  insert into public.temas (materia_id, titulo, orden, creado_por)
  values (v_mat_id, 'Elipse', 12, v_docente_id)
  returning id into v_tema_id;
  insert into public.subtemas (tema_id, titulo, orden, creado_por) values
    (v_tema_id, 'Elipse como lugar geométrico', 0, v_docente_id),
    (v_tema_id, 'Relación entre los parámetros a, b y c', 1, v_docente_id),
    (v_tema_id, 'Formas ordinaria y general de la ecuación de la elipse con centro en el origen y eje focal sobre alguno de los ejes coordenados', 2, v_docente_id),
    (v_tema_id, 'Formas ordinaria y general de la ecuación de la elipse con centro fuera del origen y eje focal paralelo a alguno de los ejes coordenados', 3, v_docente_id),
    (v_tema_id, 'Elementos de una elipse', 4, v_docente_id);

  insert into public.temas (materia_id, titulo, orden, creado_por)
  values (v_mat_id, 'Hipérbola', 13, v_docente_id)
  returning id into v_tema_id;
  insert into public.subtemas (tema_id, titulo, orden, creado_por) values
    (v_tema_id, 'Hipérbola como lugar geométrico', 0, v_docente_id),
    (v_tema_id, 'Relación entre los parámetros de la hipérbola a, b y c', 1, v_docente_id),
    (v_tema_id, 'Formas ordinaria y general de la ecuación de la hipérbola con centro en el origen y eje focal sobre alguno de los ejes coordenados', 2, v_docente_id),
    (v_tema_id, 'Formas ordinaria y general de la ecuación de la hipérbola con centro fuera del origen y eje focal paralelo a alguno de los ejes coordenados', 3, v_docente_id),
    (v_tema_id, 'Elementos de una hipérbola', 4, v_docente_id);

  insert into public.temas (materia_id, titulo, orden, creado_por)
  values (v_mat_id, 'Ecuación general de segundo grado', 14, v_docente_id)
  returning id into v_tema_id;
  insert into public.subtemas (tema_id, titulo, orden, creado_por) values
    (v_tema_id, 'Las cónicas', 0, v_docente_id),
    (v_tema_id, 'Ecuación general de segundo grado', 1, v_docente_id),
    (v_tema_id, 'Criterios para identificar a la cónica que representa una ecuación de segundo grado', 2, v_docente_id),
    (v_tema_id, 'Traslación de ejes', 3, v_docente_id);

  insert into public.temas (materia_id, titulo, orden, creado_por)
  values (v_mat_id, 'Límites', 15, v_docente_id)
  returning id into v_tema_id;
  insert into public.subtemas (tema_id, titulo, orden, creado_por) values
    (v_tema_id, 'Concepto intuitivo', 0, v_docente_id),
    (v_tema_id, 'Definición formal', 1, v_docente_id),
    (v_tema_id, 'Teoremas sobre límites', 2, v_docente_id),
    (v_tema_id, 'Obtención de límites', 3, v_docente_id),
    (v_tema_id, 'Formas indeterminadas', 4, v_docente_id),
    (v_tema_id, 'Continuidad en un punto y en un intervalo', 5, v_docente_id);

  insert into public.temas (materia_id, titulo, orden, creado_por)
  values (v_mat_id, 'La derivada', 16, v_docente_id)
  returning id into v_tema_id;
  insert into public.subtemas (tema_id, titulo, orden, creado_por) values
    (v_tema_id, 'Definición de derivada y sus notaciones', 0, v_docente_id),
    (v_tema_id, 'Obtención de derivadas', 1, v_docente_id),
    (v_tema_id, 'Regla de la cadena', 2, v_docente_id),
    (v_tema_id, 'Derivada de funciones implícitas', 3, v_docente_id),
    (v_tema_id, 'Derivadas sucesivas de una función', 4, v_docente_id),
    (v_tema_id, 'Interpretación geométrica y física', 5, v_docente_id),
    (v_tema_id, 'Ecuaciones de la tangente y de la normal a una curva', 6, v_docente_id),
    (v_tema_id, 'Cálculo de velocidad y aceleración de un móvil', 7, v_docente_id),
    (v_tema_id, 'Máximos y mínimos relativos de una función', 8, v_docente_id),
    (v_tema_id, 'Máximos y mínimos absolutos en un intervalo cerrado', 9, v_docente_id),
    (v_tema_id, 'Puntos de inflexión y de concavidad en una curva', 10, v_docente_id),
    (v_tema_id, 'Problemas de la vida cotidiana', 11, v_docente_id);

  insert into public.temas (materia_id, titulo, orden, creado_por)
  values (v_mat_id, 'La integral', 17, v_docente_id)
  returning id into v_tema_id;
  insert into public.subtemas (tema_id, titulo, orden, creado_por) values
    (v_tema_id, 'Función integrable en un intervalo cerrado', 0, v_docente_id),
    (v_tema_id, 'Teoremas que justifican las propiedades de la integral de una función', 1, v_docente_id),
    (v_tema_id, 'Integral inmediata', 2, v_docente_id),
    (v_tema_id, 'Tabla de fórmulas de integración', 3, v_docente_id),
    (v_tema_id, 'Métodos de integración', 4, v_docente_id),
    (v_tema_id, 'Integral definida y su notación', 5, v_docente_id);

  -- ============================================================
  -- FÍSICA
  -- ============================================================
  select id into v_mat_id from public.materias where nombre = 'Física';

  insert into public.temas (materia_id, titulo, orden, creado_por)
  values (v_mat_id, 'Cinemática', 1, v_docente_id)
  returning id into v_tema_id;
  insert into public.subtemas (tema_id, titulo, orden, creado_por) values
    (v_tema_id, 'Características de los fenómenos mecánicos', 0, v_docente_id),
    (v_tema_id, 'Movimiento rectilíneo uniforme', 1, v_docente_id),
    (v_tema_id, 'Movimiento uniformemente acelerado', 2, v_docente_id);

  insert into public.temas (materia_id, titulo, orden, creado_por)
  values (v_mat_id, 'Fuerzas, leyes de Newton y Ley de la Gravitación Universal', 2, v_docente_id)
  returning id into v_tema_id;
  insert into public.subtemas (tema_id, titulo, detalle, orden, creado_por) values
    (v_tema_id, 'Factores que cambian la estructura o el estado de movimiento de objetos', null, 0, v_docente_id),
    (v_tema_id, 'El concepto de fuerza', null, 1, v_docente_id),
    (v_tema_id, 'El carácter vectorial de la fuerza', null, 2, v_docente_id),
    (v_tema_id, 'Superposición de fuerzas', null, 3, v_docente_id),
    (v_tema_id, 'Primera Ley de Newton', null, 4, v_docente_id),
    (v_tema_id, 'Segunda Ley de Newton', '2.6.1 Concepto de peso; 2.6.2 Concepto de masa', 5, v_docente_id),
    (v_tema_id, 'Tercera Ley de Newton', null, 6, v_docente_id),
    (v_tema_id, 'Equilibrio rotacional y traslacional. Fuerza y torca', null, 7, v_docente_id),
    (v_tema_id, 'Ley de la Fuerza en un resorte (Ley de Hooke)', null, 8, v_docente_id),
    (v_tema_id, 'Ley de la Gravitación Universal. Movimiento de planetas', null, 9, v_docente_id);

  insert into public.temas (materia_id, titulo, orden, creado_por)
  values (v_mat_id, 'Trabajo y leyes de la conservación', 3, v_docente_id)
  returning id into v_tema_id;
  insert into public.subtemas (tema_id, titulo, orden, creado_por) values
    (v_tema_id, 'Concepto de trabajo mecánico', 0, v_docente_id),
    (v_tema_id, 'Concepto de potencia', 1, v_docente_id),
    (v_tema_id, 'Energía cinética', 2, v_docente_id),
    (v_tema_id, 'Energía potencial', 3, v_docente_id),
    (v_tema_id, 'Conservación de la energía mecánica', 4, v_docente_id),
    (v_tema_id, 'Conservación del ímpetu (momento)', 5, v_docente_id),
    (v_tema_id, 'Colisiones entre partículas en una dimensión', 6, v_docente_id),
    (v_tema_id, 'Procesos disipativos (fricción y rozamiento)', 7, v_docente_id);

  insert into public.temas (materia_id, titulo, orden, creado_por)
  values (v_mat_id, 'Termodinámica', 4, v_docente_id)
  returning id into v_tema_id;
  insert into public.subtemas (tema_id, titulo, detalle, orden, creado_por) values
    (v_tema_id, 'Calor y temperatura', '4.1.1 Diferencia entre calor y temperatura; 4.1.2 Equilibrio térmico; 4.1.3 Escalas termométricas absolutas; 4.1.4 Conductividad calorífica y capacidad térmica específica; 4.1.5 Leyes de la Termodinámica', 0, v_docente_id),
    (v_tema_id, 'Teoría Cinética de los Gases', '4.2.1 Estructura de la materia (enfoque clásico); 4.2.2 Temperatura según la Teoría Cinética de los Gases; 4.2.3 Ecuación de estado de los gases ideales', 1, v_docente_id);

  insert into public.temas (materia_id, titulo, orden, creado_por)
  values (v_mat_id, 'Ondas', 5, v_docente_id)
  returning id into v_tema_id;
  insert into public.subtemas (tema_id, titulo, orden, creado_por) values
    (v_tema_id, 'Caracterización de ondas mecánicas', 0, v_docente_id),
    (v_tema_id, 'Reflexión y refracción de ondas', 1, v_docente_id),
    (v_tema_id, 'Difracción e interferencia de ondas', 2, v_docente_id),
    (v_tema_id, 'Energía de una onda incidente y de las ondas transmitida y reflejada', 3, v_docente_id);

  insert into public.temas (materia_id, titulo, orden, creado_por)
  values (v_mat_id, 'Electromagnetismo', 6, v_docente_id)
  returning id into v_tema_id;
  insert into public.subtemas (tema_id, titulo, detalle, orden, creado_por) values
    (v_tema_id, 'Efectos cualitativos entre cuerpos cargados eléctricamente', null, 0, v_docente_id),
    (v_tema_id, 'Ley de Coulomb. Campo eléctrico', null, 1, v_docente_id),
    (v_tema_id, 'Ley de Ohm y potencia eléctrica', null, 2, v_docente_id),
    (v_tema_id, 'Circuitos', '6.4.1 Circuitos de resistencias; 6.4.2 Circuitos de condensadores', 3, v_docente_id),
    (v_tema_id, 'Campo magnético', null, 4, v_docente_id),
    (v_tema_id, 'Inducción electromagnética', null, 5, v_docente_id),
    (v_tema_id, 'Relación entre campo magnético y eléctrico', null, 6, v_docente_id),
    (v_tema_id, 'Inducción de campos', null, 7, v_docente_id),
    (v_tema_id, 'La luz como onda electromagnética', null, 8, v_docente_id),
    (v_tema_id, 'Espectro electromagnético', null, 9, v_docente_id),
    (v_tema_id, 'Leyes de Ampere–Maxwell', null, 10, v_docente_id),
    (v_tema_id, 'Leyes de Faraday y Henry', null, 11, v_docente_id);

  insert into public.temas (materia_id, titulo, orden, creado_por)
  values (v_mat_id, 'Fluidos', 7, v_docente_id)
  returning id into v_tema_id;
  insert into public.subtemas (tema_id, titulo, detalle, orden, creado_por) values
    (v_tema_id, 'Fluidos en reposo', '7.1.1 Presión atmosférica; 7.1.2 Principio de Pascal; 7.1.3 Principio de Arquímedes; 7.1.4 Presión hidrostática; 7.1.5 Tensión superficial y capilaridad', 0, v_docente_id),
    (v_tema_id, 'Fluidos en movimiento', '7.2.1 Ecuación de continuidad; 7.2.2 Ecuación de Bernoulli; 7.2.3 Viscosidad', 1, v_docente_id);

  insert into public.temas (materia_id, titulo, orden, creado_por)
  values (v_mat_id, 'Óptica', 8, v_docente_id)
  returning id into v_tema_id;
  insert into public.subtemas (tema_id, titulo, detalle, orden, creado_por) values
    (v_tema_id, 'Reflexión y refracción de la luz', null, 0, v_docente_id),
    (v_tema_id, 'Espejos planos y esféricos', null, 1, v_docente_id),
    (v_tema_id, 'Lentes convergentes y divergentes', null, 2, v_docente_id),
    (v_tema_id, 'Punto de vista contemporáneo (dualidad)', '8.4.1 Modelo corpuscular; 8.4.2 Modelo ondulatorio', 3, v_docente_id);

  insert into public.temas (materia_id, titulo, orden, creado_por)
  values (v_mat_id, 'Física contemporánea', 9, v_docente_id)
  returning id into v_tema_id;
  insert into public.subtemas (tema_id, titulo, detalle, orden, creado_por) values
    (v_tema_id, 'Estructura atómica de la materia', '9.1.1 Modelos atómicos; 9.1.2 El experimento de Rutherford; 9.1.3 Espectroscopía y el modelo atómico de Bohr', 0, v_docente_id),
    (v_tema_id, 'Física nuclear', '9.2.1 El descubrimiento de la radiactividad; 9.2.2 Decaimiento radiactivo; 9.2.3 Detectores de radiactividad; 9.2.4 Fisión y fusión nucleares; 9.2.5 Aplicaciones de la radiactividad y la energía nuclear', 1, v_docente_id),
    (v_tema_id, 'Otras formas de energía', null, 2, v_docente_id);

  -- ============================================================
  -- QUÍMICA (parcial: el documento fuente marca esta sección como
  -- incompleta a partir de aquí y continúa con Biología, pendiente
  -- de fotos; solo se cargan estos 5 temas).
  -- ============================================================
  select id into v_mat_id from public.materias where nombre = 'Química';

  insert into public.temas (materia_id, titulo, orden, creado_por)
  values (v_mat_id, 'Temas básicos', 1, v_docente_id)
  returning id into v_tema_id;
  insert into public.subtemas (tema_id, titulo, detalle, orden, creado_por) values
    (v_tema_id, 'Sustancias químicas', '1.1.1 Sustancias puras: elemento y compuesto; 1.1.2 Mezclas: homogéneas y heterogéneas', 0, v_docente_id),
    (v_tema_id, 'Estructura atómica', '1.2.1 Conceptos de átomo, protón, electrón, neutrón, número atómico y masa atómica', 1, v_docente_id),
    (v_tema_id, 'Tabla periódica', '1.3.1 Clasificación de elementos: metales, no metales y metaloides; 1.3.2 Regla del octeto de Lewis; 1.3.3 Propiedades periódicas (1.3.3.1 Electronegatividad y tipos de enlace: iónico y covalente)', 2, v_docente_id),
    (v_tema_id, 'Clasificación de los compuestos en óxidos básicos, óxidos ácidos (anhídridos), ácidos, bases y sales', null, 3, v_docente_id),
    (v_tema_id, 'Mol', '1.5.1 Concepto; 1.5.2 Cálculo de masa molar', 4, v_docente_id);

  insert into public.temas (materia_id, titulo, orden, creado_por)
  values (v_mat_id, 'Agua', 2, v_docente_id)
  returning id into v_tema_id;
  insert into public.subtemas (tema_id, titulo, detalle, orden, creado_por) values
    (v_tema_id, 'Composición del agua y estructura molecular', '2.1.1 Polaridad y puentes de hidrógeno', 0, v_docente_id),
    (v_tema_id, 'Propiedades físicas: puntos de ebullición y de fusión, capacidad calorífica específica', null, 1, v_docente_id),
    (v_tema_id, 'Propiedades químicas: tipo de enlace, capacidad (poder) disolvente del agua', null, 2, v_docente_id),
    (v_tema_id, 'Ácidos y bases', '2.4.1 Clasificación por su conductividad: fuertes y débiles; 2.4.2 Diferenciación de las sustancias de acuerdo con su pH; 2.4.3 Indicadores y pH', 3, v_docente_id),
    (v_tema_id, 'Soluciones o disoluciones', '2.5.1 Concepto de soluto y disolvente', 4, v_docente_id),
    (v_tema_id, 'Contaminación del agua', '2.6.1 Principales contaminantes: físicos, químicos y biológicos; 2.6.2 Fuentes generadoras: industrial, urbana y agrícola', 5, v_docente_id),
    (v_tema_id, 'Importancia y aplicaciones del agua para la humanidad', null, 6, v_docente_id),
    (v_tema_id, 'Uso responsable y preservación del agua', null, 7, v_docente_id);

  insert into public.temas (materia_id, titulo, orden, creado_por)
  values (v_mat_id, 'Aire', 3, v_docente_id)
  returning id into v_tema_id;
  insert into public.subtemas (tema_id, titulo, detalle, orden, creado_por) values
    (v_tema_id, '¿Qué es el aire?', null, 0, v_docente_id),
    (v_tema_id, 'Composición porcentual del aire', null, 1, v_docente_id),
    (v_tema_id, 'Reacciones del oxígeno', '3.3.1 Reacciones de combustión; 3.3.2 Formación de óxidos básicos; 3.3.3 Formación de óxidos ácidos (nitrógeno, azufre y carbono)', 2, v_docente_id),
    (v_tema_id, 'Reacciones de óxido-reducción', null, 3, v_docente_id),
    (v_tema_id, 'Ciclos del oxígeno, nitrógeno y carbono', null, 4, v_docente_id),
    (v_tema_id, 'Contaminantes del aire', '3.6.1 Contaminantes primarios del aire (óxidos de nitrógeno, carbono y azufre, partículas suspendidas e hidrocarburos); 3.6.2 Principales fuentes generadoras (industriales, urbanas y agrícolas); 3.6.3 Impacto ambiental: inversión térmica y lluvia ácida', 5, v_docente_id);

  insert into public.temas (materia_id, titulo, orden, creado_por)
  values (v_mat_id, 'Alimentos', 4, v_docente_id)
  returning id into v_tema_id;
  insert into public.subtemas (tema_id, titulo, detalle, orden, creado_por) values
    (v_tema_id, 'Carbohidratos', '4.1.1 Estructura; 4.1.2 Fuente de energía de disponibilidad inmediata', 0, v_docente_id),
    (v_tema_id, 'Lípidos', '4.2.1 Estructura; 4.2.2 Almacén de energía', 1, v_docente_id),
    (v_tema_id, 'Proteínas', '4.3.1 Grupos funcionales presentes en aminoácidos; 4.3.2 Enlace peptídico', 2, v_docente_id),
    (v_tema_id, 'Vitaminas y minerales: fuentes e importancia', null, 3, v_docente_id);

  insert into public.temas (materia_id, titulo, descripcion, orden, creado_por)
  values (
    v_mat_id,
    'La energía y las reacciones químicas',
    'Sección marcada como incompleta en el temario original (el documento continúa con Biología, pendiente de fotos). Faltan temas por agregar.',
    5,
    v_docente_id
  )
  returning id into v_tema_id;
  insert into public.subtemas (tema_id, titulo, orden, creado_por) values
    (v_tema_id, 'Reacciones químicas endotérmicas y exotérmicas', 0, v_docente_id);

end $$;
