"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { FORO_BUCKET } from "@/lib/storage";

export async function crearPublicacion(
  materiaId: string,
  data: {
    texto: string | null;
    link: string | null;
    archivo: { storage_path: string; nombre_archivo: string; tipo_mime: string | null; tamano_bytes: number } | null;
  }
) {
  const profile = await requireProfile();
  const supabase = await createClient();

  if (!data.texto?.trim() && !data.link?.trim() && !data.archivo) {
    throw new Error("Escribe algo, pega un link o adjunta un archivo antes de publicar.");
  }

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
  if (error) throw new Error(error.message);

  revalidatePath("/portal/foro");
}

export async function eliminarPublicacion(id: string) {
  await requireProfile();
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
  if (error) throw new Error(error.message);

  revalidatePath("/portal/foro");
}

export async function crearComentario(publicacionId: string, texto: string) {
  const profile = await requireProfile();
  const supabase = await createClient();

  if (!texto.trim()) throw new Error("Escribe un comentario antes de enviarlo.");

  const { error } = await supabase.from("foro_comentarios").insert({
    publicacion_id: publicacionId,
    autor_id: profile.id,
    texto: texto.trim(),
  });
  if (error) throw new Error(error.message);

  revalidatePath("/portal/foro");
}

export async function eliminarComentario(id: string) {
  await requireProfile();
  const supabase = await createClient();

  const { error } = await supabase.from("foro_comentarios").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/portal/foro");
}
