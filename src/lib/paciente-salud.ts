import type { AsistenciaSaludTipo, PacienteSalud } from "@/types/database";

export const ASISTENCIA_SALUD_LABEL: Record<AsistenciaSaludTipo, string> = {
  nutricion: "Nutrición",
  entrenamiento: "Entrenamiento",
  fisioterapia: "Fisioterapia",
  otro: "Otro",
};

export const ASISTENCIA_SALUD_OPCIONES: AsistenciaSaludTipo[] = [
  "nutricion",
  "entrenamiento",
  "fisioterapia",
  "otro",
];

export function medicacionLabel(salud: PacienteSalud | null): string | null {
  if (!salud?.medicacion_toma || !salud.medicacion_cual) return null;
  return `Actualmente toma ${salud.medicacion_cual} como tratamiento`;
}

export function asistenciaSaludLabel(salud: PacienteSalud | null): string | null {
  if (!salud || salud.asistencia_tipos.length === 0) return null;
  const nombres = salud.asistencia_tipos.map((t) => ASISTENCIA_SALUD_LABEL[t]).join(", ");
  const detalle = salud.asistencia_detalle ? `: ${salud.asistencia_detalle}` : "";
  return `Actualmente complementa su tratamiento con ${nombres}${detalle}`;
}
