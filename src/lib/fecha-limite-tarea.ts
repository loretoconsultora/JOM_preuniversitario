import type { Tarea } from "@/types/database";

type TareaFecha = Pick<Tarea, "fecha_entrega" | "hora_limite">;

// Combina fecha_entrega + hora_limite (o 23:59 si el docente no especificó
// hora) en un solo instante. null si la tarea no tiene fecha de entrega
// (sin fecha, nunca se cierra).
//
// El offset "-06:00" (Ciudad de México, sin horario de verano desde 2022)
// se agrega a propósito: sin él, un string tipo "2026-08-04T23:59:00" se
// interpreta en la zona horaria LOCAL del entorno que lo procesa. Eso es
// distinto en el navegador del alumno (hora de México) que en el servidor
// de Vercel (UTC) — el servidor cerraría la tarea hasta 6 horas ANTES de
// lo que el docente configuró y de lo que el alumno ve en pantalla. Fijar
// el offset hace que ambos calculen exactamente el mismo instante.
export function fechaLimiteTarea(tarea: TareaFecha): Date | null {
  if (!tarea.fecha_entrega) return null;
  const hora = (tarea.hora_limite ?? "23:59").slice(0, 5);
  return new Date(`${tarea.fecha_entrega}T${hora}:00-06:00`);
}

export function tareaCerrada(tarea: TareaFecha, ahora: Date = new Date()): boolean {
  const limite = fechaLimiteTarea(tarea);
  if (!limite) return false;
  return ahora.getTime() >= limite.getTime();
}

// Leyenda "Faltan X horas / Falta menos de una hora / Faltan X días" para
// mostrarle al alumno cuánto tiempo le queda. null si ya no aplica (sin
// fecha límite, o ya cerrada).
export function leyendaTiempoRestante(tarea: TareaFecha, ahora: Date = new Date()): string | null {
  const limite = fechaLimiteTarea(tarea);
  if (!limite) return null;
  const msRestantes = limite.getTime() - ahora.getTime();
  if (msRestantes <= 0) return null;

  const minutos = Math.round(msRestantes / 60000);
  if (minutos < 60) return "Falta menos de 1 hora para que se cierre la tarea";

  const horas = Math.round(msRestantes / 3600000);
  if (horas < 24) return `Falta${horas === 1 ? "" : "n"} ${horas} hora${horas === 1 ? "" : "s"} para que se cierre la tarea`;

  const dias = Math.round(msRestantes / 86400000);
  return `Falta${dias === 1 ? "" : "n"} ${dias} día${dias === 1 ? "" : "s"} para que se cierre la tarea`;
}
