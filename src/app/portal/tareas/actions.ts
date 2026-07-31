"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireDocente } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function crearTarea(formData: FormData) {
  const profile = await requireDocente();

  const materia_id = String(formData.get("materia_id") || "");
  const titulo = String(formData.get("titulo") || "").trim();
  const descripcion = String(formData.get("descripcion") || "").trim();
  const fecha_entrega = String(formData.get("fecha_entrega") || "");

  if (!materia_id || !titulo) {
    throw new Error("Materia y título son obligatorios.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("tareas").insert({
    materia_id,
    titulo,
    descripcion: descripcion || null,
    fecha_entrega: fecha_entrega || null,
    creado_por: profile.id,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/portal/tareas");
  redirect("/portal/tareas");
}

export async function eliminarTarea(id: string) {
  await requireDocente();
  const supabase = await createClient();
  const { error } = await supabase.from("tareas").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/portal/tareas");
}
