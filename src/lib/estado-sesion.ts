import type { EstadoSesion, Homoclave } from "@/types/database";

export const ESTADO_LABEL: Record<EstadoSesion, string> = {
  pendiente: "Programada",
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

// Homoclaves de facturación, tomadas del acuerdo de prestación de
// servicios que maneja cada profesional con sus pacientes/orientados/casos.
export const HOMOCLAVE_LABEL: Record<Homoclave, string> = {
  SR: "Sesión realizada",
  CNA: "Cancelación no anticipada",
  CT: "Cancelación de quien da la sesión",
  SC: "Sesión compensatoria",
};

export const HOMOCLAVE_DESCRIPCION: Record<Homoclave, string> = {
  SR: "La sesión se llevó a cabo. Se factura.",
  CNA: "El paciente/orientado/caso canceló con menos de 24h de aviso, o faltó sin avisar. Se factura igual.",
  CT: "Quien da la sesión canceló sin 24h de aviso. No se factura y genera una sesión compensatoria (SC).",
  SC: "Sesión de reposición por una cancelación de quien da la sesión (CT). Costo $0.",
};

export const HOMOCLAVE_CLASS: Record<Homoclave, string> = {
  SR: "bg-jom-yellow/40 text-jom-ink",
  CNA: "bg-jom-pink/30 text-jom-ink",
  CT: "bg-black/5 dark:bg-white/10 text-muted",
  SC: "bg-black/5 dark:bg-white/10 text-muted",
};

export function contarPorHomoclave(sesiones: { homoclave: Homoclave | null }[]) {
  return {
    SR: sesiones.filter((s) => s.homoclave === "SR").length,
    CNA: sesiones.filter((s) => s.homoclave === "CNA").length,
    CT: sesiones.filter((s) => s.homoclave === "CT").length,
    SC: sesiones.filter((s) => s.homoclave === "SC").length,
  };
}

export type PeriodoPreset = "semana" | "quincena" | "mes";

// Rango de fechas (inclusive, formato YYYY-MM-DD) para el preset elegido,
// relativo a "hoy". Quincena = 1-15 o 16-fin de mes, según el día actual.
export function calcularRangoPeriodo(preset: PeriodoPreset, hoy: Date) {
  const anio = hoy.getFullYear();
  const mes = hoy.getMonth();
  const dia = hoy.getDate();
  const aISO = (d: Date) => d.toISOString().slice(0, 10);

  if (preset === "semana") {
    const diaSemana = hoy.getDay();
    const inicio = new Date(hoy);
    inicio.setDate(hoy.getDate() - diaSemana);
    const fin = new Date(inicio);
    fin.setDate(inicio.getDate() + 6);
    return { inicio: aISO(inicio), fin: aISO(fin), label: `Semana del ${inicio.getDate()} al ${fin.getDate()}` };
  }

  if (preset === "quincena") {
    if (dia <= 15) {
      return { inicio: aISO(new Date(anio, mes, 1)), fin: aISO(new Date(anio, mes, 15)), label: "Quincena 1-15" };
    }
    const finMes = new Date(anio, mes + 1, 0);
    return { inicio: aISO(new Date(anio, mes, 16)), fin: aISO(finMes), label: `Quincena 16-${finMes.getDate()}` };
  }

  const inicioMes = new Date(anio, mes, 1);
  const finMes = new Date(anio, mes + 1, 0);
  const label = (() => {
    const raw = hoy.toLocaleDateString("es-MX", { month: "long", year: "numeric" });
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  })();
  return { inicio: aISO(inicioMes), fin: aISO(finMes), label };
}
