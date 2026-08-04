import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type ProgresoMateria = { total: number; completos: number; pct: number };

// Progreso real de un alumno en una materia: por cada tema que tenga al
// menos un archivo adjunto, una tarea o un examen vinculado, se cuenta como
// "avanzado" si el alumno abrió alguno de esos archivos, entregó/presentó
// alguna de esas tareas, o respondió alguno de esos exámenes. Los temas sin
// nada vinculado (solo subtemas con ejercicios/videos) no entran al conteo,
// para no castigar el % con contenido que no se puede medir así.
export async function progresoPorMateria(
  supabase: Supabase,
  alumnoId: string,
  materiaIds: string[]
): Promise<Map<string, ProgresoMateria>> {
  const vacio = new Map<string, ProgresoMateria>();
  if (materiaIds.length === 0) return vacio;

  const { data: temas } = await supabase.from("temas").select("id, materia_id").in("materia_id", materiaIds);
  const temasList = (temas ?? []) as { id: string; materia_id: string }[];
  const temaIds = temasList.map((t) => t.id);
  if (temaIds.length === 0) return vacio;

  const [{ data: archivos }, { data: tareas }, { data: examenes }] = await Promise.all([
    supabase.from("tema_archivos").select("id, tema_id").in("tema_id", temaIds),
    supabase.from("tareas").select("id, tema_id").in("tema_id", temaIds),
    supabase.from("examenes").select("id, tema_id").in("tema_id", temaIds),
  ]);
  const archivosList = (archivos ?? []) as { id: string; tema_id: string }[];
  const tareasList = (tareas ?? []) as { id: string; tema_id: string | null }[];
  const examenesList = (examenes ?? []) as { id: string; tema_id: string | null }[];

  const archivoIds = archivosList.map((a) => a.id);
  const tareaIds = tareasList.map((t) => t.id);
  const examenIds = examenesList.map((e) => e.id);

  const [{ data: vistas }, { data: entregas }, { data: intentosTarea }, { data: intentosExamen }] = await Promise.all([
    archivoIds.length > 0
      ? supabase.from("tema_archivo_vistas").select("archivo_id").eq("alumno_id", alumnoId).in("archivo_id", archivoIds)
      : Promise.resolve({ data: [] as { archivo_id: string }[] }),
    tareaIds.length > 0
      ? supabase.from("tarea_entregas").select("tarea_id").eq("alumno_id", alumnoId).in("tarea_id", tareaIds)
      : Promise.resolve({ data: [] as { tarea_id: string }[] }),
    tareaIds.length > 0
      ? supabase.from("tarea_intentos").select("tarea_id").eq("alumno_id", alumnoId).in("tarea_id", tareaIds)
      : Promise.resolve({ data: [] as { tarea_id: string }[] }),
    examenIds.length > 0
      ? supabase.from("examen_intentos").select("examen_id").eq("alumno_id", alumnoId).in("examen_id", examenIds)
      : Promise.resolve({ data: [] as { examen_id: string }[] }),
  ]);

  const archivosVistosSet = new Set(((vistas ?? []) as { archivo_id: string }[]).map((v) => v.archivo_id));
  const tareasHechasSet = new Set([
    ...((entregas ?? []) as { tarea_id: string }[]).map((e) => e.tarea_id),
    ...((intentosTarea ?? []) as { tarea_id: string }[]).map((i) => i.tarea_id),
  ]);
  const examenesRespondidosSet = new Set(((intentosExamen ?? []) as { examen_id: string }[]).map((i) => i.examen_id));

  const archivosPorTema = new Map<string, string[]>();
  for (const a of archivosList) {
    const list = archivosPorTema.get(a.tema_id) ?? [];
    list.push(a.id);
    archivosPorTema.set(a.tema_id, list);
  }
  const tareasPorTema = new Map<string, string[]>();
  for (const t of tareasList) {
    if (!t.tema_id) continue;
    const list = tareasPorTema.get(t.tema_id) ?? [];
    list.push(t.id);
    tareasPorTema.set(t.tema_id, list);
  }
  const examenesPorTema = new Map<string, string[]>();
  for (const e of examenesList) {
    if (!e.tema_id) continue;
    const list = examenesPorTema.get(e.tema_id) ?? [];
    list.push(e.id);
    examenesPorTema.set(e.tema_id, list);
  }

  const acumulado = new Map<string, { total: number; completos: number }>();
  for (const m of materiaIds) acumulado.set(m, { total: 0, completos: 0 });

  for (const tema of temasList) {
    const archivosTema = archivosPorTema.get(tema.id) ?? [];
    const tareasTema = tareasPorTema.get(tema.id) ?? [];
    const examenesTema = examenesPorTema.get(tema.id) ?? [];
    const esRastreable = archivosTema.length > 0 || tareasTema.length > 0 || examenesTema.length > 0;
    if (!esRastreable) continue;

    const avanzado =
      archivosTema.some((id) => archivosVistosSet.has(id)) ||
      tareasTema.some((id) => tareasHechasSet.has(id)) ||
      examenesTema.some((id) => examenesRespondidosSet.has(id));

    const acc = acumulado.get(tema.materia_id) ?? { total: 0, completos: 0 };
    acc.total += 1;
    if (avanzado) acc.completos += 1;
    acumulado.set(tema.materia_id, acc);
  }

  const resultado = new Map<string, ProgresoMateria>();
  for (const [materiaId, { total, completos }] of acumulado) {
    const pct = total > 0 ? Math.round((completos / total) * 100) : 0;
    resultado.set(materiaId, { total, completos, pct });
  }
  return resultado;
}
