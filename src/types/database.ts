export type Role = "alumno" | "docente" | "directora" | "terapeuta";

export type Profile = {
  id: string;
  role: Role;
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

export type ExamenPregunta = {
  id: string;
  examen_id: string;
  orden: number;
  enunciado: string;
  opciones: string[];
  respuesta_correcta: number;
  created_at: string;
};

export type ExamenPreguntaAlumno = {
  id: string;
  enunciado: string;
  opciones: string[];
};

export type ExamenIntento = {
  id: string;
  examen_id: string;
  alumno_id: string;
  respuestas: Record<string, number>;
  aciertos: number;
  total: number;
  calificacion: number;
  created_at: string;
};

export type ExamenAlumno = {
  id: string;
  examen_id: string;
  alumno_id: string;
};

export type PreguntaBorrador = {
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

export type PacienteNota = {
  id: string;
  paciente_id: string;
  contenido: string;
  creado_por: string;
  created_at: string;
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
