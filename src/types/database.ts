export type Role = "alumno" | "docente" | "directora";

export type Profile = {
  id: string;
  role: Role;
  nombre_completo: string;
  created_at: string;
};

export type Materia = {
  id: string;
  nombre: string;
};

export type Tarea = {
  id: string;
  materia_id: string;
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

export type PreguntaBorrador = {
  enunciado: string;
  opciones: string[];
  respuesta_correcta: number;
};
