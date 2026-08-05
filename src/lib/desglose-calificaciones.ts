import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type DesgloseMateria = {
  materiaId: string;
  tareas: { n: number; promedio: number | null };
  evaluaciones: { n: number; promedio: number | null };
  asistencia: { presentes: number; total: number; porcentaje: number | null };
  final: number | null;
};

function promedio(nums: number[]) {
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

// Calificación final ponderada: 60% tareas, 30% evaluaciones (exámenes),
// 10% asistencia. Si a un alumno todavía le falta alguna categoría en esa
// materia (ej. aún no hay exámenes calificados), su peso se reparte
// proporcionalmente entre las categorías que sí tienen datos, en vez de
// contar como cero — para no castigar antes de que exista la evaluación.
function calificacionFinal(d: {
  tareasPromedio: number | null;
  evaluacionesPromedio: number | null;
  asistenciaPorcentaje: number | null;
}): number | null {
  const partes: { valor: number; peso: number }[] = [];
  if (d.tareasPromedio !== null) partes.push({ valor: d.tareasPromedio, peso: 0.6 });
  if (d.evaluacionesPromedio !== null) partes.push({ valor: d.evaluacionesPromedio, peso: 0.3 });
  if (d.asistenciaPorcentaje !== null) partes.push({ valor: d.asistenciaPorcentaje, peso: 0.1 });
  if (partes.length === 0) return null;

  const pesoTotal = partes.reduce((acc, p) => acc + p.peso, 0);
  const suma = partes.reduce((acc, p) => acc + p.valor * (p.peso / pesoTotal), 0);
  return Math.round(suma * 10) / 10;
}

// Para uno o varios alumnos y una o varias materias, calcula el desglose
// (tareas/evaluaciones/asistencia) y la calificación final de cada
// combinación alumno+materia. Usa el cliente admin porque clase_sesiones
// solo es legible por staff vía RLS, y esto también corre para la vista
// propia del alumno.
export async function desglosePorAlumnoYMateria(
  alumnoIds: string[],
  materiaIds: string[]
): Promise<Map<string, Map<string, DesgloseMateria>>> {
  const resultado = new Map<string, Map<string, DesgloseMateria>>();
  for (const a of alumnoIds) resultado.set(a, new Map());
  if (alumnoIds.length === 0 || materiaIds.length === 0) return resultado;

  const admin = createAdminClient();
  const [{ data: calificaciones }, { data: sesiones }] = await Promise.all([
    admin
      .from("calificaciones")
      .select("alumno_id, materia_id, tarea_id, examen_id, calificacion")
      .in("alumno_id", alumnoIds)
      .in("materia_id", materiaIds)
      .not("calificacion", "is", null),
    admin.from("clase_sesiones").select("id, materia_id").in("materia_id", materiaIds),
  ]);

  const sesionesList = (sesiones ?? []) as { id: string; materia_id: string }[];
  const sesionIds = sesionesList.map((s) => s.id);
  const materiaPorSesion = new Map(sesionesList.map((s) => [s.id, s.materia_id]));

  const { data: asistencias } =
    sesionIds.length > 0
      ? await admin
          .from("clase_asistencias")
          .select("sesion_id, alumno_id, presente")
          .in("alumno_id", alumnoIds)
          .in("sesion_id", sesionIds)
      : { data: [] as { sesion_id: string; alumno_id: string; presente: boolean }[] };

  const clave = (a: string, m: string) => `${a}::${m}`;

  const porClave = new Map<string, { tareas: number[]; evaluaciones: number[] }>();
  for (const c of (calificaciones ?? []) as {
    alumno_id: string;
    materia_id: string;
    tarea_id: string | null;
    examen_id: string | null;
    calificacion: number | null;
  }[]) {
    if (c.calificacion === null) continue;
    const k = clave(c.alumno_id, c.materia_id);
    const acc = porClave.get(k) ?? { tareas: [], evaluaciones: [] };
    if (c.tarea_id) acc.tareas.push(c.calificacion);
    else if (c.examen_id) acc.evaluaciones.push(c.calificacion);
    porClave.set(k, acc);
  }

  const asistenciaPorClave = new Map<string, { presentes: number; total: number }>();
  for (const a of (asistencias ?? []) as { sesion_id: string; alumno_id: string; presente: boolean }[]) {
    const materiaId = materiaPorSesion.get(a.sesion_id);
    if (!materiaId) continue;
    const k = clave(a.alumno_id, materiaId);
    const acc = asistenciaPorClave.get(k) ?? { presentes: 0, total: 0 };
    acc.total += 1;
    if (a.presente) acc.presentes += 1;
    asistenciaPorClave.set(k, acc);
  }

  for (const alumnoId of alumnoIds) {
    for (const materiaId of materiaIds) {
      const k = clave(alumnoId, materiaId);
      const acc = porClave.get(k) ?? { tareas: [], evaluaciones: [] };
      const asis = asistenciaPorClave.get(k) ?? { presentes: 0, total: 0 };

      const tareasPromedio = acc.tareas.length > 0 ? promedio(acc.tareas) : null;
      const evaluacionesPromedio = acc.evaluaciones.length > 0 ? promedio(acc.evaluaciones) : null;
      const asistenciaPorcentaje = asis.total > 0 ? Math.round((asis.presentes / asis.total) * 1000) / 10 : null;

      resultado.get(alumnoId)!.set(materiaId, {
        materiaId,
        tareas: { n: acc.tareas.length, promedio: tareasPromedio },
        evaluaciones: { n: acc.evaluaciones.length, promedio: evaluacionesPromedio },
        asistencia: { presentes: asis.presentes, total: asis.total, porcentaje: asistenciaPorcentaje },
        final: calificacionFinal({ tareasPromedio, evaluacionesPromedio, asistenciaPorcentaje }),
      });
    }
  }

  return resultado;
}
