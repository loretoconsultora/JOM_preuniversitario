const DIAS_CICLO = 30;

export function proximaEvaluacionFecha(fechaAlta: string, ultimaEvaluacionFecha: string | null) {
  const base = new Date(ultimaEvaluacionFecha ?? fechaAlta);
  base.setDate(base.getDate() + DIAS_CICLO);
  return base;
}

export function evaluacionDisponible(fechaAlta: string, ultimaEvaluacionFecha: string | null) {
  return proximaEvaluacionFecha(fechaAlta, ultimaEvaluacionFecha).getTime() <= Date.now();
}
