"use server";

import { revalidatePath } from "next/cache";
import { requireDocente } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionError, actionOk, ERROR_INESPERADO, type ActionResult } from "@/lib/action-result";

export async function crearSesionAsistencia(
  materiaId: string,
  temaId: string | null,
  fecha: string,
  nota: string,
  asistencias: { alumno_id: string; presente: boolean }[]
): Promise<ActionResult> {
  const profile = await requireDocente();
  if (!materiaId) return actionError("Selecciona una materia.");
  if (!fecha) return actionError("Indica la fecha de la clase.");
  if (asistencias.length === 0) return actionError("No hay alumnos para registrar.");

  try {
    const supabase = await createClient();
    const { data: sesion, error } = await supabase
      .from("clase_sesiones")
      .insert({ materia_id: materiaId, tema_id: temaId, fecha, nota: nota.trim() || null, creado_por: profile.id })
      .select("id")
      .single();
    if (error) return actionError(error.message);

    const { error: eAsist } = await supabase.from("clase_asistencias").insert(
      asistencias.map((a) => ({ sesion_id: sesion.id, alumno_id: a.alumno_id, presente: a.presente }))
    );
    if (eAsist) return actionError(eAsist.message);

    revalidatePath("/portal/asistencia-academica");
    return actionOk({});
  } catch (e) {
    console.error("crearSesionAsistencia:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

export async function eliminarSesionAsistencia(id: string): Promise<ActionResult> {
  await requireDocente();
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("clase_sesiones").delete().eq("id", id);
    if (error) return actionError(error.message);
    revalidatePath("/portal/asistencia-academica");
    return actionOk({});
  } catch (e) {
    console.error("eliminarSesionAsistencia:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

export async function actualizarInscripcionMateria(materiaId: string, alumnoIds: string[]): Promise<ActionResult> {
  const profile = await requireDocente();

  try {
    const supabase = await createClient();
    const { error: eDel } = await supabase.from("materia_alumnos").delete().eq("materia_id", materiaId);
    if (eDel) return actionError(eDel.message);

    if (alumnoIds.length > 0) {
      const { error: eIns } = await supabase
        .from("materia_alumnos")
        .insert(alumnoIds.map((alumno_id) => ({ materia_id: materiaId, alumno_id, inscrito_por: profile.id })));
      if (eIns) return actionError(eIns.message);
    }

    revalidatePath("/portal/asistencia-academica");
    revalidatePath("/portal/temario");
    revalidatePath("/portal/tareas");
    revalidatePath("/portal/examenes");
    revalidatePath("/portal/calificaciones");
    return actionOk({});
  } catch (e) {
    console.error("actualizarInscripcionMateria:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}
