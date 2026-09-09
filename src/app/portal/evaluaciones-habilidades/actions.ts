"use server";

import { revalidatePath } from "next/cache";
import { requireTerapeuta } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { textoPlanoAHtml } from "@/lib/strip-html";
import { actionError, actionOk, ERROR_INESPERADO, type ActionResult } from "@/lib/action-result";

export async function crearHabilidad(formData: FormData): Promise<ActionResult> {
  const profile = await requireTerapeuta();
  const nombre = String(formData.get("nombre") || "").trim();
  if (!nombre) return actionError("El nombre de la habilidad es obligatorio.");

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("habilidades").insert({ nombre, creado_por: profile.id });
    if (error) return actionError(error.message);

    revalidatePath("/portal/evaluaciones-habilidades");
    return actionOk({});
  } catch (e) {
    console.error("crearHabilidad:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

export async function actualizarHabilidad(id: string, nombre: string): Promise<ActionResult> {
  await requireTerapeuta();
  const texto = nombre.trim();
  if (!texto) return actionError("El nombre no puede estar vacío.");

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("habilidades").update({ nombre: texto }).eq("id", id);
    if (error) return actionError(error.message);

    revalidatePath("/portal/evaluaciones-habilidades");
    return actionOk({});
  } catch (e) {
    console.error("actualizarHabilidad:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

export async function eliminarHabilidad(id: string): Promise<ActionResult> {
  await requireTerapeuta();
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("habilidades").delete().eq("id", id);
    if (error) return actionError(error.message);

    revalidatePath("/portal/evaluaciones-habilidades");
    return actionOk({});
  } catch (e) {
    console.error("eliminarHabilidad:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

export async function crearEvaluacion(
  pacienteId: string,
  calificaciones: { habilidad_id: string; calificacion: number }[],
  conclusiones: string
): Promise<ActionResult> {
  const profile = await requireTerapeuta();
  if (calificaciones.length === 0) return actionError("Califica al menos una habilidad.");

  try {
    const supabase = await createClient();
    const { count } = await supabase
      .from("evaluaciones_habilidades")
      .select("id", { count: "exact", head: true })
      .eq("paciente_id", pacienteId);
    const numeroPeriodo = (count ?? 0) + 1;

    const conclusionesTexto = conclusiones.trim() || null;
    const { data: evaluacion, error } = await supabase
      .from("evaluaciones_habilidades")
      .insert({
        paciente_id: pacienteId,
        numero_periodo: numeroPeriodo,
        conclusiones: conclusionesTexto,
        creado_por: profile.id,
      })
      .select("id")
      .single();
    if (error) return actionError(error.message);

    const { error: eCal } = await supabase.from("evaluacion_habilidad_calificaciones").insert(
      calificaciones.map((c) => ({
        evaluacion_id: evaluacion.id,
        habilidad_id: c.habilidad_id,
        calificacion: c.calificacion,
      }))
    );
    if (eCal) return actionError(eCal.message);

    // Las conclusiones de la evaluación se copian al historial de notas del
    // paciente como "Nota de evaluación", solo generable desde aquí.
    if (conclusionesTexto) {
      const { error: eNota } = await supabase.from("paciente_notas").insert({
        paciente_id: pacienteId,
        contenido: textoPlanoAHtml(conclusionesTexto),
        tipo: "evaluacion",
        creado_por: profile.id,
      });
      if (eNota) return actionError(eNota.message);
    }

    revalidatePath("/portal/evaluaciones-habilidades");
    revalidatePath(`/portal/pacientes/${pacienteId}`);
    return actionOk({});
  } catch (e) {
    console.error("crearEvaluacion:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}
