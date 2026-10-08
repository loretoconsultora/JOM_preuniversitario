"use server";

import { revalidatePath } from "next/cache";
import { requireCoachVocacional } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionError, actionOk, ERROR_INESPERADO, type ActionResult } from "@/lib/action-result";

export async function crearAtributoOrientacion(formData: FormData): Promise<ActionResult> {
  const profile = await requireCoachVocacional();
  const nombre = String(formData.get("nombre") || "").trim();
  if (!nombre) return actionError("El nombre del atributo es obligatorio.");

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("orientacion_atributos").insert({ nombre, creado_por: profile.id });
    if (error) return actionError(error.message);

    revalidatePath("/portal/evaluaciones-orientacion");
    return actionOk({});
  } catch (e) {
    console.error("crearAtributoOrientacion:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

export async function actualizarAtributoOrientacion(id: string, nombre: string): Promise<ActionResult> {
  await requireCoachVocacional();
  const texto = nombre.trim();
  if (!texto) return actionError("El nombre no puede estar vacío.");

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("orientacion_atributos").update({ nombre: texto }).eq("id", id);
    if (error) return actionError(error.message);

    revalidatePath("/portal/evaluaciones-orientacion");
    return actionOk({});
  } catch (e) {
    console.error("actualizarAtributoOrientacion:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

export async function eliminarAtributoOrientacion(id: string): Promise<ActionResult> {
  await requireCoachVocacional();
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("orientacion_atributos").delete().eq("id", id);
    if (error) return actionError(error.message);

    revalidatePath("/portal/evaluaciones-orientacion");
    return actionOk({});
  } catch (e) {
    console.error("eliminarAtributoOrientacion:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

export async function crearEvaluacionOrientacion(
  orientadoId: string,
  sesionId: string,
  calificaciones: { atributo_id: string; calificacion: number }[],
  conclusiones: string
): Promise<ActionResult> {
  const profile = await requireCoachVocacional();
  if (calificaciones.length === 0) return actionError("Califica al menos un atributo.");

  try {
    const supabase = await createClient();
    const { data: evaluacion, error } = await supabase
      .from("orientacion_evaluaciones")
      .insert({
        orientado_id: orientadoId,
        sesion_id: sesionId,
        conclusiones: conclusiones.trim() || null,
        creado_por: profile.id,
      })
      .select("id")
      .single();
    if (error) {
      if (error.code === "23505") return actionError("Esta sesión ya tiene una evaluación.");
      return actionError(error.message);
    }

    const { error: eCal } = await supabase.from("orientacion_evaluacion_calificaciones").insert(
      calificaciones.map((c) => ({
        evaluacion_id: evaluacion.id as string,
        atributo_id: c.atributo_id,
        calificacion: c.calificacion,
      }))
    );
    if (eCal) return actionError(eCal.message);

    revalidatePath("/portal/evaluaciones-orientacion");
    revalidatePath("/portal/asistencia-orientacion");
    return actionOk({});
  } catch (e) {
    console.error("crearEvaluacionOrientacion:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}
