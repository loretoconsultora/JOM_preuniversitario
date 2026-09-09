"use server";

import { revalidatePath } from "next/cache";
import { requireDocente } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionError, actionOk, ERROR_INESPERADO, type ActionResult } from "@/lib/action-result";

export async function crearCalificacion(formData: FormData): Promise<ActionResult> {
  const profile = await requireDocente();

  const alumno_id = String(formData.get("alumno_id") || "");
  const tarea_id = String(formData.get("tarea_id") || "");
  const examen_id = String(formData.get("examen_id") || "");
  let materia_id = String(formData.get("materia_id") || "");
  let titulo = String(formData.get("titulo") || "").trim();
  const calificacionRaw = String(formData.get("calificacion") || "").trim();
  const comentario = String(formData.get("comentario") || "").trim();
  const fecha = String(formData.get("fecha") || "");

  if (!alumno_id) {
    return actionError("El alumno es obligatorio.");
  }

  try {
    const supabase = await createClient();

    // Si se vincula a una tarea o examen, la materia y el título se toman de
    // ahí (evita que queden desalineados con lo que ya ven los alumnos).
    if (tarea_id) {
      const { data: tarea, error: tareaError } = await supabase
        .from("tareas")
        .select("materia_id, titulo")
        .eq("id", tarea_id)
        .single();
      if (tareaError || !tarea) return actionError("La tarea seleccionada ya no existe.");
      materia_id = tarea.materia_id;
      titulo = tarea.titulo;
    } else if (examen_id) {
      const { data: examen, error: examenError } = await supabase
        .from("examenes")
        .select("materia_id, titulo")
        .eq("id", examen_id)
        .single();
      if (examenError || !examen) return actionError("El examen seleccionado ya no existe.");
      materia_id = examen.materia_id;
      titulo = examen.titulo;
    }

    if (!materia_id || !titulo) {
      return actionError("Materia y título son obligatorios (o selecciona una tarea o examen).");
    }

    const calificacion = calificacionRaw ? Number(calificacionRaw) : null;

    const { error } = await supabase.from("calificaciones").insert({
      alumno_id,
      materia_id,
      titulo,
      tarea_id: tarea_id || null,
      examen_id: examen_id || null,
      calificacion,
      comentario: comentario || null,
      fecha: fecha || new Date().toISOString().slice(0, 10),
      creado_por: profile.id,
    });
    if (error) return actionError(error.message);

    if (calificacion !== null) {
      await supabase.from("notificaciones_alumno").insert({
        alumno_id,
        mensaje: `Fuiste calificado en "${titulo}": ${calificacion}`,
        materia_id,
        tarea_id: tarea_id || null,
        examen_id: examen_id || null,
      });
    }

    revalidatePath("/portal/calificaciones");
    revalidatePath("/portal/tareas");
    return actionOk({});
  } catch (e) {
    console.error("crearCalificacion:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

export async function actualizarCalificacion(id: string, formData: FormData): Promise<ActionResult> {
  await requireDocente();

  const titulo = String(formData.get("titulo") || "").trim();
  const calificacionRaw = String(formData.get("calificacion") || "").trim();
  const comentario = String(formData.get("comentario") || "").trim();
  const fecha = String(formData.get("fecha") || "");

  if (!titulo) return actionError("El título es obligatorio.");
  if (!fecha) return actionError("La fecha es obligatoria.");

  const calificacion = calificacionRaw ? Number(calificacionRaw) : null;

  try {
    const supabase = await createClient();
    const { data: actualizada, error } = await supabase
      .from("calificaciones")
      .update({
        titulo,
        calificacion,
        comentario: comentario || null,
        fecha,
      })
      .eq("id", id)
      .select("alumno_id, materia_id, tarea_id, examen_id")
      .single();
    if (error) return actionError(error.message);

    if (calificacion !== null && actualizada) {
      await supabase.from("notificaciones_alumno").insert({
        alumno_id: actualizada.alumno_id,
        mensaje: `Fuiste calificado en "${titulo}": ${calificacion}`,
        materia_id: actualizada.materia_id,
        tarea_id: actualizada.tarea_id,
        examen_id: actualizada.examen_id,
      });
    }

    revalidatePath("/portal/calificaciones");
    revalidatePath("/portal/tareas");
    return actionOk({});
  } catch (e) {
    console.error("actualizarCalificacion:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

export async function eliminarCalificacion(id: string): Promise<ActionResult> {
  await requireDocente();
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("calificaciones").delete().eq("id", id);
    if (error) return actionError(error.message);
    revalidatePath("/portal/calificaciones");
    revalidatePath("/portal/tareas");
    return actionOk({});
  } catch (e) {
    console.error("eliminarCalificacion:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}
