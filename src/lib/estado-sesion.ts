import type { EstadoSesion } from "@/types/database";

export const ESTADO_LABEL: Record<EstadoSesion, string> = {
  pendiente: "Pendiente",
  asistio: "Completada",
  no_asistio: "Cancelada",
  reagendada: "Reprogramada",
};

export const ESTADO_CLASS: Record<EstadoSesion, string> = {
  pendiente: "bg-black/5 dark:bg-white/10",
  asistio: "bg-jom-yellow/40 text-jom-ink",
  no_asistio: "bg-jom-pink/30 text-jom-ink",
  reagendada: "bg-black/5 dark:bg-white/10 text-muted",
};

export function contarPorEstado(sesiones: { estado: EstadoSesion }[]) {
  return {
    completadas: sesiones.filter((s) => s.estado === "asistio").length,
    reprogramadas: sesiones.filter((s) => s.estado === "reagendada").length,
    canceladas: sesiones.filter((s) => s.estado === "no_asistio").length,
  };
}

// 🔔 tras 3+ reprogramaciones, 🚨 tras 3+ cancelaciones.
export function emojisAlerta(counts: { reprogramadas: number; canceladas: number }) {
  const emojis: string[] = [];
  if (counts.reprogramadas >= 3) emojis.push("🔔");
  if (counts.canceladas >= 3) emojis.push("🚨");
  return emojis.join(" ");
}
