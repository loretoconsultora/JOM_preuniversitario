"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireDocente } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function crearCalificacion(formData: FormData) {
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
    throw new Error("El alumno es obligatorio.");
  }

  const supabase = await createClient();

  // Si se vincula a una tarea o examen, la materia y el título se toman de
  // ahí (evita que queden desalineados con lo que ya ven los alumnos).
  if (tarea_id) {
    const { data: tarea, error: tareaError } = await supabase
      .from("tareas")
      .select("materia_id, titulo")
      .eq("id", tarea_id)
      .single();
    if (tareaError || !tarea) throw new Error("La tarea seleccionada ya no existe.");
    materia_id = tarea.materia_id;
    titulo = tarea.titulo;
  } else if (examen_id) {
    const { data: examen, error: examenError } = await supabase
      .from("examenes")
      .select("materia_id, titulo")
      .eq("id", examen_id)
      .single();
    if (examenError || !examen) throw new Error("El examen seleccionado ya no existe.");
    materia_id = examen.materia_id;
    titulo = examen.titulo;
  }

  if (!materia_id || !titulo) {
    throw new Error("Materia y título son obligatorios (o selecciona una tarea o examen).");
  }

  const { error } = await supabase.from("calificaciones").insert({
    alumno_id,
    materia_id,
    titulo,
    tarea_id: tarea_id || null,
    examen_id: examen_id || null,
    calificacion: calificacionRaw ? Number(calificacionRaw) : null,
    comentario: comentario || null,
    fecha: fecha || new Date().toISOString().slice(0, 10),
    creado_por: profile.id,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/portal/calificaciones");
  revalidatePath("/portal/tareas");
  redirect("/portal/calificaciones");
}

export async function actualizarCalificacion(id: string, formData: FormData) {
  await requireDocente();

  const titulo = String(formData.get("titulo") || "").trim();
  const calificacionRaw = String(formData.get("calificacion") || "").trim();
  const comentario = String(formData.get("comentario") || "").trim();
  const fecha = String(formData.get("fecha") || "");

  if (!titulo) throw new Error("El título es obligatorio.");
  if (!fecha) throw new Error("La fecha es obligatoria.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("calificaciones")
    .update({
      titulo,
      calificacion: calificacionRaw ? Number(calificacionRaw) : null,
      comentario: comentario || null,
      fecha,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/portal/calificaciones");
  revalidatePath("/portal/tareas");
  redirect("/portal/calificaciones");
}

export async function eliminarCalificacion(id: string) {
  await requireDocente();
  const supabase = await createClient();
  const { error } = await supabase.from("calificaciones").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/portal/calificaciones");
  revalidatePath("/portal/tareas");
}
