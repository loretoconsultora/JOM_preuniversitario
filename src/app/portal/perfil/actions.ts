"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AVATARES_BUCKET } from "@/lib/storage";
import { actionError, actionOk, ERROR_INESPERADO, type ActionResult } from "@/lib/action-result";

export async function actualizarNombre(nombreCompleto: string): Promise<ActionResult> {
  const profile = await requireProfile();
  const nombre = nombreCompleto.trim();
  if (!nombre) return actionError("El nombre no puede estar vacío.");

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ nombre_completo: nombre })
      .eq("id", profile.id);
    if (error) return actionError(error.message);

    revalidatePath("/portal", "layout");
    revalidatePath("/portal/perfil");
    return actionOk({});
  } catch (e) {
    console.error("actualizarNombre:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

export async function subirAvatar(formData: FormData): Promise<ActionResult> {
  const profile = await requireProfile();
  const archivo = formData.get("avatar");
  if (!(archivo instanceof File) || archivo.size === 0) return actionError("Selecciona una imagen.");
  if (!archivo.type.startsWith("image/")) return actionError("El archivo debe ser una imagen.");
  if (archivo.size > 5 * 1024 * 1024) return actionError("La imagen no puede pesar más de 5 MB.");

  const extension = archivo.name.split(".").pop()?.toLowerCase() || "jpg";
  const storagePath = `${profile.id}/avatar.${extension}`;

  try {
    const supabase = await createClient();
    const { error: uploadError } = await supabase.storage
      .from(AVATARES_BUCKET)
      .upload(storagePath, archivo, { contentType: archivo.type, upsert: true });
    if (uploadError) return actionError(uploadError.message);

    const {
      data: { publicUrl },
    } = supabase.storage.from(AVATARES_BUCKET).getPublicUrl(storagePath);

    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: `${publicUrl}?t=${Date.now()}` })
      .eq("id", profile.id);
    if (error) return actionError(error.message);

    revalidatePath("/portal", "layout");
    revalidatePath("/portal/perfil");
    return actionOk({});
  } catch (e) {
    console.error("subirAvatar:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}
