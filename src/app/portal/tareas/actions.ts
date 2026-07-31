"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireDocente } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { TAREAS_BUCKET } from "@/lib/storage";

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

export async function crearTarea(formData: FormData) {
  const profile = await requireDocente();

  const materia_id = String(formData.get("materia_id") || "");
  const titulo = String(formData.get("titulo") || "").trim();
  const descripcion = String(formData.get("descripcion") || "").trim();
  const fecha_entrega = String(formData.get("fecha_entrega") || "");
  const archivos = formData.getAll("archivos").filter((f): f is File => f instanceof File && f.size > 0);

  if (!materia_id || !titulo) {
    throw new Error("Materia y título son obligatorios.");
  }

  const supabase = await createClient();
  const { data: tarea, error } = await supabase
    .from("tareas")
    .insert({
      materia_id,
      titulo,
      descripcion: descripcion || null,
      fecha_entrega: fecha_entrega || null,
      creado_por: profile.id,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  for (const archivo of archivos) {
    const storagePath = `${tarea.id}/${crypto.randomUUID()}-${sanitizeFilename(archivo.name)}`;
    const { error: uploadError } = await supabase.storage
      .from(TAREAS_BUCKET)
      .upload(storagePath, archivo, { contentType: archivo.type || undefined });

    if (uploadError) throw new Error(`No se pudo subir "${archivo.name}": ${uploadError.message}`);

    const { error: archivoError } = await supabase.from("tarea_archivos").insert({
      tarea_id: tarea.id,
      storage_path: storagePath,
      nombre_archivo: archivo.name,
      tipo_mime: archivo.type || null,
      tamano_bytes: archivo.size,
      creado_por: profile.id,
    });
    if (archivoError) throw new Error(archivoError.message);
  }

  revalidatePath("/portal/tareas");
  redirect("/portal/tareas");
}

export async function eliminarTarea(id: string) {
  await requireDocente();
  const supabase = await createClient();

  const { data: archivos } = await supabase
    .from("tarea_archivos")
    .select("storage_path")
    .eq("tarea_id", id);

  if (archivos && archivos.length > 0) {
    await supabase.storage
      .from(TAREAS_BUCKET)
      .remove(archivos.map((a) => a.storage_path));
  }

  const { error } = await supabase.from("tareas").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/portal/tareas");
}
