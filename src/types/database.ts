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
