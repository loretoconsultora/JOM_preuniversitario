"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionError, actionOk, ERROR_INESPERADO, type ActionResult } from "@/lib/action-result";

export async function marcarNotificacionDocenteLeida(id: string): Promise<ActionResult> {
  const profile = await requireProfile();
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("notificaciones_docente")
      .update({ leida: true })
      .eq("id", id)
      .eq("docente_id", profile.id);
    if (error) return actionError(error.message);
    revalidatePath("/portal", "layout");
    return actionOk({});
  } catch (e) {
    console.error("marcarNotificacionDocenteLeida:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

export async function marcarTodasNotificacionesDocenteLeidas(): Promise<ActionResult> {
  const profile = await requireProfile();
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("notificaciones_docente")
      .update({ leida: true })
      .eq("docente_id", profile.id)
      .eq("leida", false);
    if (error) return actionError(error.message);
    revalidatePath("/portal", "layout");
    return actionOk({});
  } catch (e) {
    console.error("marcarTodasNotificacionesDocenteLeidas:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

export async function marcarNotificacionAlumnoLeida(id: string): Promise<ActionResult> {
  const profile = await requireProfile();
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("notificaciones_alumno")
      .update({ leida: true })
      .eq("id", id)
      .eq("alumno_id", profile.id);
    if (error) return actionError(error.message);
    revalidatePath("/portal", "layout");
    return actionOk({});
  } catch (e) {
    console.error("marcarNotificacionAlumnoLeida:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

export async function marcarTodasNotificacionesAlumnoLeidas(): Promise<ActionResult> {
  const profile = await requireProfile();
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("notificaciones_alumno")
      .update({ leida: true })
      .eq("alumno_id", profile.id)
      .eq("leida", false);
    if (error) return actionError(error.message);
    revalidatePath("/portal", "layout");
    return actionOk({});
  } catch (e) {
    console.error("marcarTodasNotificacionesAlumnoLeidas:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}
