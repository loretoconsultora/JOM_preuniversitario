import type { Examen } from "@/types/database";

type ExamenFechas = Pick<Examen, "fecha_apertura" | "hora_apertura" | "fecha_cierre" | "hora_cierre">;

// Mismo criterio que fecha-limite-tarea.ts: se fija el offset "-06:00"
// (Ciudad de México, sin horario de verano desde 2022) a propósito, para
// que el navegador del alumno y el servidor de Vercel (UTC) calculen
// exactamente el mismo instante al comparar contra "ahora".

export function fechaAperturaExamen(examen: ExamenFechas): Date | null {
  if (!examen.fecha_apertura) return null;
  const hora = (examen.hora_apertura ?? "00:00").slice(0, 5);
  return new Date(`${examen.fecha_apertura}T${hora}:00-06:00`);
}

export function fechaCierreExamen(examen: ExamenFechas): Date | null {
  if (!examen.fecha_cierre) return null;
  const hora = (examen.hora_cierre ?? "23:59").slice(0, 5);
  return new Date(`${examen.fecha_cierre}T${hora}:00-06:00`);
}

// true si el examen todavía no abre (tiene fecha de apertura futura).
export function examenAunNoAbre(examen: ExamenFechas, ahora: Date = new Date()): boolean {
  const apertura = fechaAperturaExamen(examen);
  if (!apertura) return false;
  return ahora.getTime() < apertura.getTime();
}

// true si el examen ya cerró (tiene fecha de cierre pasada). Se usa tanto
// para bloquear la entrega como para la sección "Cerrados" del listado.
export function examenCerrado(examen: ExamenFechas, ahora: Date = new Date()): boolean {
  const cierre = fechaCierreExamen(examen);
  if (!cierre) return false;
  return ahora.getTime() >= cierre.getTime();
}

// true solo mientras el examen está disponible para presentarse: ya abrió
// (o no tiene apertura) y todavía no cierra (o no tiene cierre).
export function examenDisponible(examen: ExamenFechas, ahora: Date = new Date()): boolean {
  return !examenAunNoAbre(examen, ahora) && !examenCerrado(examen, ahora);
}

function formatFechaHora(d: Date): string {
  const fecha = d.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
  const hora = d.toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit" });
  return `${fecha}, ${hora}`;
}

// Leyenda para mostrarle al alumno cuándo abre o cuándo cierra. null si no
// aplica ninguna de las dos (examen sin ventana configurada, o ya cerrado).
export function leyendaVentanaExamen(examen: ExamenFechas, ahora: Date = new Date()): string | null {
  if (examenAunNoAbre(examen, ahora)) {
    const apertura = fechaAperturaExamen(examen)!;
    return `Disponible a partir del ${formatFechaHora(apertura)}`;
  }
  const cierre = fechaCierreExamen(examen);
  if (cierre && !examenCerrado(examen, ahora)) {
    return `Cierra el ${formatFechaHora(cierre)}`;
  }
  return null;
}
