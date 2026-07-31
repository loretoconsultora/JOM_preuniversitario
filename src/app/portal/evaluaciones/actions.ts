"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireDocente } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function crearEvaluacion(formData: FormData) {
  const profile = await requireDocente();

  const alumno_id = String(formData.get("alumno_id") || "");
  const materia_id = String(formData.get("materia_id") || "");
  const titulo = String(formData.get("titulo") || "").trim();
  const calificacionRaw = String(formData.get("calificacion") || "").trim();
  const comentario = String(formData.get("comentario") || "").trim();
  const fecha = String(formData.get("fecha") || "");

  if (!alumno_id || !materia_id || !titulo) {
    throw new Error("Alumno, materia y título son obligatorios.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("evaluaciones").insert({
    alumno_id,
    materia_id,
    titulo,
    calificacion: calificacionRaw ? Number(calificacionRaw) : null,
    comentario: comentario || null,
    fecha: fecha || new Date().toISOString().slice(0, 10),
    creado_por: profile.id,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/portal/evaluaciones");
  redirect("/portal/evaluaciones");
}

export async function eliminarEvaluacion(id: string) {
  await requireDocente();
  const supabase = await createClient();
  const { error } = await supabase.from("evaluaciones").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/portal/evaluaciones");
}
