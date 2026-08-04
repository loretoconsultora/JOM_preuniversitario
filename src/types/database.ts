export type Role = "alumno" | "docente" | "directora" | "terapeuta";

export type Profile = {
  id: string;
  role: Role;
  roles: Role[];
  nombre_completo: string;
  avatar_url: string | null;
  created_at: string;
};

export type Materia = {
  id: string;
  nombre: string;
  banner_url: string | null;
};

export type Tarea = {
  id: string;
  materia_id: string;
  tema_id: string | null;
  titulo: string;
  descripcion: string | null;
  fecha_entrega: string | null;
  pide_respuesta_texto: boolean;
  creado_por: string;
  created_at: string;
};

export type Calificacion = {
  id: string;
  alumno_id: string;
  materia_id: string;
  titulo: string;
  calificacion: number | null;
  comentario: string | null;
  fecha: string;
  tarea_id: string | null;
  creado_por: string;
  created_at: string;
};

export type TareaArchivo = {
  id: string;
  tarea_id: string;
  storage_path: string;
  nombre_archivo: string;
  tipo_mime: string | null;
  tamano_bytes: number | null;
  creado_por: string;
  created_at: string;
};

export type Examen = {
  id: string;
  materia_id: string;
  tema_id: string | null;
  titulo: string;
  origen: "manual" | "ia" | "plantilla";
  creado_por: string;
  created_at: string;
};

export type TipoPregunta = "multiple" | "abierta";

export type ExamenPregunta = {
  id: string;
  examen_id: string;
  orden: number;
  tipo: TipoPregunta;
  enunciado: string;
  opciones: string[] | null;
  respuesta_correcta: number | null;
  created_at: string;
};

export type ExamenPreguntaAlumno = {
  id: string;
  tipo: TipoPregunta;
  enunciado: string;
  opciones: string[] | null;
};

export type ExamenIntento = {
  id: string;
  examen_id: string;
  alumno_id: string;
  respuestas: Record<string, number | string>;
  aciertos: number;
  total: number;
  calificacion: number | null;
  created_at: string;
};

export type ExamenAlumno = {
  id: string;
  examen_id: string;
  alumno_id: string;
};

// opciones/respuesta_correcta se ignoran cuando tipo === "abierta".
export type PreguntaBorrador = {
  tipo: TipoPregunta;
  enunciado: string;
  opciones: string[];
  respuesta_correcta: number;
};

export type Recurso = {
  id: string;
  titulo: string;
  tipo: "archivo" | "enlace";
  materia_id: string | null;
  storage_path: string | null;
  nombre_archivo: string | null;
  tipo_mime: string | null;
  tamano_bytes: number | null;
  url: string | null;
  creado_por: string;
  created_at: string;
};

export type RecursoVista = {
  id: string;
  recurso_id: string;
  alumno_id: string;
  created_at: string;
};

export type Tema = {
  id: string;
  materia_id: string;
  titulo: string;
  descripcion: string | null;
  orden: number;
  creado_por: string;
  created_at: string;
};

export type TemaArchivo = {
  id: string;
  tema_id: string;
  storage_path: string;
  nombre_archivo: string;
  tipo_mime: string | null;
  tamano_bytes: number | null;
  creado_por: string;
  created_at: string;
};

export type TemaArchivoVista = {
  id: string;
  archivo_id: string;
  alumno_id: string;
  created_at: string;
};

export type Subtema = {
  id: string;
  tema_id: string;
  titulo: string;
  detalle: string | null;
  orden: number;
  creado_por: string;
  created_at: string;
};

export type SubtemaEjercicio = {
  id: string;
  subtema_id: string;
  titulo: string;
  url: string;
  orden: number;
};

export type SubtemaVideo = {
  id: string;
  subtema_id: string;
  titulo: string | null;
  youtube_url: string;
  orden: number;
};

export type Paciente = {
  id: string;
  terapeuta_id: string;
  alumno_id: string | null;
  nombre: string;
  motivos: string[];
  fecha_alta: string;
  activo: boolean;
  created_at: string;
};

export type TipoNota = "general" | "evaluacion";

export type PacienteNota = {
  id: string;
  paciente_id: string;
  contenido: string;
  tipo: TipoNota;
  creado_por: string;
  created_at: string;
};

export type AsistenciaSaludTipo = "nutricion" | "entrenamiento" | "fisioterapia" | "otro";

export type PacienteSalud = {
  paciente_id: string;
  medicacion_toma: boolean;
  medicacion_cual: string | null;
  medicacion_dosis: string | null;
  medicacion_desde: string | null;
  asistencia_tipos: AsistenciaSaludTipo[];
  asistencia_detalle: string | null;
  actualizado_por: string | null;
  updated_at: string;
};

export type EstadoSesion = "pendiente" | "asistio" | "no_asistio" | "reagendada";

export type PacienteSesion = {
  id: string;
  paciente_id: string;
  fecha: string;
  hora: string | null;
  estado: EstadoSesion;
  nota: string | null;
  reagendada_a_id: string | null;
  creado_por: string;
  created_at: string;
};

export type Habilidad = {
  id: string;
  nombre: string;
  creado_por: string;
  created_at: string;
};

export type EvaluacionHabilidad = {
  id: string;
  paciente_id: string;
  numero_periodo: number;
  conclusiones: string | null;
  creado_por: string;
  created_at: string;
};

export type EvaluacionHabilidadCalificacion = {
  id: string;
  evaluacion_id: string;
  habilidad_id: string;
  calificacion: number;
};

export type EjercicioBorrador = { titulo: string; url: string };
export type VideoBorrador = { titulo: string; youtube_url: string };

export type SubtemaBorrador = {
  titulo: string;
  detalle: string;
  ejercicios: EjercicioBorrador[];
  videos: VideoBorrador[];
};

export type SubtemaImportado = { titulo: string; detalle: string };

export type TemaImportado = {
  titulo: string;
  descripcion: string;
  subtemas: SubtemaImportado[];
};

export type TareaEntrega = {
  id: string;
  tarea_id: string;
  alumno_id: string;
  respuesta_texto: string | null;
  created_at: string;
  updated_at: string;
};

export type TareaEntregaArchivo = {
  id: string;
  entrega_id: string;
  storage_path: string;
  nombre_archivo: string;
  tipo_mime: string | null;
  tamano_bytes: number | null;
  created_at: string;
};

export type TareaPregunta = {
  id: string;
  tarea_id: string;
  orden: number;
  tipo: TipoPregunta;
  enunciado: string;
  opciones: string[] | null;
  respuesta_correcta: number | null;
  created_at: string;
};

export type TareaPreguntaAlumno = {
  id: string;
  tipo: TipoPregunta;
  enunciado: string;
  opciones: string[] | null;
};

export type TareaIntento = {
  id: string;
  tarea_id: string;
  alumno_id: string;
  respuestas: Record<string, number | string>;
  aciertos: number;
  total: number;
  calificacion: number | null;
  created_at: string;
};

export type ClaseSesion = {
  id: string;
  materia_id: string;
  fecha: string;
  nota: string | null;
  creado_por: string;
  created_at: string;
};

export type ClaseAsistencia = {
  id: string;
  sesion_id: string;
  alumno_id: string;
  presente: boolean;
};
