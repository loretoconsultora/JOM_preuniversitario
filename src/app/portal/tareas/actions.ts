"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireDocente } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { TAREAS_BUCKET } from "@/lib/storage";
import { sanitizeRichText } from "@/lib/sanitize";
import type { PreguntaBorrador } from "@/types/database";

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

async function subirArchivosTarea(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tareaId: string,
  archivos: File[],
  creadoPor: string
) {
  for (const archivo of archivos) {
    const storagePath = `${tareaId}/${crypto.randomUUID()}-${sanitizeFilename(archivo.name)}`;
    const { error: uploadError } = await supabase.storage
      .from(TAREAS_BUCKET)
      .upload(storagePath, archivo, { contentType: archivo.type || undefined });

    if (uploadError) throw new Error(`No se pudo subir "${archivo.name}": ${uploadError.message}`);

    const { error: archivoError } = await supabase.from("tarea_archivos").insert({
      tarea_id: tareaId,
      storage_path: storagePath,
      nombre_archivo: archivo.name,
      tipo_mime: archivo.type || null,
      tamano_bytes: archivo.size,
      creado_por: creadoPor,
    });
    if (archivoError) throw new Error(archivoError.message);
  }
}

function parsearPreguntas(formData: FormData): PreguntaBorrador[] {
  const raw = String(formData.get("preguntas_json") || "[]");
  let preguntas: PreguntaBorrador[];
  try {
    preguntas = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(preguntas)) return [];

  return preguntas
    .filter((p) => p.enunciado?.trim())
    .filter((p) => p.tipo === "abierta" || p.opciones?.filter((o: string) => o.trim()).length >= 2)
    .map((p) => ({
      tipo: p.tipo === "abierta" ? ("abierta" as const) : ("multiple" as const),
      enunciado: String(p.enunciado).trim(),
      opciones: Array.isArray(p.opciones) ? p.opciones.map((o: string) => String(o).trim()) : [],
      respuesta_correcta: Number(p.respuesta_correcta) || 0,
    }));
}

async function guardarPreguntasTarea(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tareaId: string,
  preguntas: PreguntaBorrador[]
) {
  if (preguntas.length === 0) return;
  const { error } = await supabase.from("tarea_preguntas").insert(
    preguntas.map((p, i) => ({
      tarea_id: tareaId,
      orden: i,
      tipo: p.tipo,
      enunciado: p.enunciado,
      opciones: p.tipo === "multiple" ? p.opciones : null,
      respuesta_correcta: p.tipo === "multiple" ? p.respuesta_correcta : null,
    }))
  );
  if (error) throw new Error(error.message);
}

export async function crearTarea(formData: FormData) {
  const profile = await requireDocente();

  const materia_id = String(formData.get("materia_id") || "");
  const tema_id = String(formData.get("tema_id") || "");
  const titulo = String(formData.get("titulo") || "").trim();
  const descripcion = sanitizeRichText(String(formData.get("descripcion") || ""));
  const fecha_entrega = String(formData.get("fecha_entrega") || "");
  const pide_respuesta_texto = formData.get("pide_respuesta_texto") === "on";
  const archivos = formData.getAll("archivos").filter((f): f is File => f instanceof File && f.size > 0);
  const preguntas = parsearPreguntas(formData);

  if (!materia_id || !titulo) {
    throw new Error("Materia y título son obligatorios.");
  }

  const supabase = await createClient();
  const { data: tarea, error } = await supabase
    .from("tareas")
    .insert({
      materia_id,
      tema_id: tema_id || null,
      titulo,
      descripcion: descripcion || null,
      fecha_entrega: fecha_entrega || null,
      pide_respuesta_texto,
      creado_por: profile.id,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await subirArchivosTarea(supabase, tarea.id, archivos, profile.id);
  await guardarPreguntasTarea(supabase, tarea.id, preguntas);

  revalidatePath("/portal/tareas");
  redirect("/portal/tareas");
}

export async function actualizarTarea(id: string, formData: FormData) {
  const profile = await requireDocente();

  const materia_id = String(formData.get("materia_id") || "");
  const tema_id = String(formData.get("tema_id") || "");
  const titulo = String(formData.get("titulo") || "").trim();
  const descripcion = sanitizeRichText(String(formData.get("descripcion") || ""));
  const fecha_entrega = String(formData.get("fecha_entrega") || "");
  const pide_respuesta_texto = formData.get("pide_respuesta_texto") === "on";
  const archivos = formData.getAll("archivos").filter((f): f is File => f instanceof File && f.size > 0);
  const preguntas = parsearPreguntas(formData);

  if (!materia_id || !titulo) {
    throw new Error("Materia y título son obligatorios.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("tareas")
    .update({
      materia_id,
      tema_id: tema_id || null,
      titulo,
      descripcion: descripcion || null,
      fecha_entrega: fecha_entrega || null,
      pide_respuesta_texto,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  await subirArchivosTarea(supabase, id, archivos, profile.id);

  // Se reemplazan las preguntas por completo (evita lógica de diff, igual
  // que se hace con los subtemas del temario).
  const { error: deleteError } = await supabase.from("tarea_preguntas").delete().eq("tarea_id", id);
  if (deleteError) throw new Error(deleteError.message);
  await guardarPreguntasTarea(supabase, id, preguntas);

  revalidatePath("/portal/tareas");
  revalidatePath(`/portal/tareas/${id}/editar`);
  redirect("/portal/tareas");
}

export async function eliminarArchivoTarea(archivoId: string, tareaId: string) {
  await requireDocente();
  const supabase = await createClient();

  const { data: archivo } = await supabase
    .from("tarea_archivos")
    .select("storage_path")
    .eq("id", archivoId)
    .single();

  if (archivo?.storage_path) {
    await supabase.storage.from(TAREAS_BUCKET).remove([archivo.storage_path]);
  }

  const { error } = await supabase.from("tarea_archivos").delete().eq("id", archivoId);
  if (error) throw new Error(error.message);

  revalidatePath("/portal/tareas");
  revalidatePath(`/portal/tareas/${tareaId}/editar`);
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
