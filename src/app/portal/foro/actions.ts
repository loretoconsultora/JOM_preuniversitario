"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { FORO_BUCKET } from "@/lib/storage";
import { actionError, actionOk, ERROR_INESPERADO, type ActionResult } from "@/lib/action-result";

export async function crearPublicacion(
  materiaId: string,
  data: {
    texto: string | null;
    link: string | null;
    archivo: { storage_path: string; nombre_archivo: string; tipo_mime: string | null; tamano_bytes: number } | null;
  }
): Promise<ActionResult> {
  const profile = await requireProfile();

  if (!data.texto?.trim() && !data.link?.trim() && !data.archivo) {
    return actionError("Escribe algo, pega un link o adjunta un archivo antes de publicar.");
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("foro_publicaciones").insert({
      materia_id: materiaId,
      autor_id: profile.id,
      texto: data.texto?.trim() || null,
      link: data.link?.trim() || null,
      storage_path: data.archivo?.storage_path ?? null,
      nombre_archivo: data.archivo?.nombre_archivo ?? null,
      tipo_mime: data.archivo?.tipo_mime ?? null,
      tamano_bytes: data.archivo?.tamano_bytes ?? null,
    });
    if (error) return actionError(error.message);

    revalidatePath("/portal/foro");
    return actionOk({});
  } catch (e) {
    console.error("crearPublicacion:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

export async function eliminarPublicacion(id: string): Promise<ActionResult> {
  await requireProfile();
  try {
    const supabase = await createClient();
    const { data: publicacion } = await supabase
      .from("foro_publicaciones")
      .select("storage_path")
      .eq("id", id)
      .single();

    if (publicacion?.storage_path) {
      await supabase.storage.from(FORO_BUCKET).remove([publicacion.storage_path]);
    }

    const { error } = await supabase.from("foro_publicaciones").delete().eq("id", id);
    if (error) return actionError(error.message);

    revalidatePath("/portal/foro");
    return actionOk({});
  } catch (e) {
    console.error("eliminarPublicacion:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

export async function crearComentario(publicacionId: string, texto: string): Promise<ActionResult> {
  const profile = await requireProfile();
  if (!texto.trim()) return actionError("Escribe un comentario antes de enviarlo.");

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("foro_comentarios").insert({
      publicacion_id: publicacionId,
      autor_id: profile.id,
      texto: texto.trim(),
    });
    if (error) return actionError(error.message);

    revalidatePath("/portal/foro");
    return actionOk({});
  } catch (e) {
    console.error("crearComentario:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

export async function eliminarComentario(id: string): Promise<ActionResult> {
  await requireProfile();
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("foro_comentarios").delete().eq("id", id);
    if (error) return actionError(error.message);

    revalidatePath("/portal/foro");
    return actionOk({});
  } catch (e) {
    console.error("eliminarComentario:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}
