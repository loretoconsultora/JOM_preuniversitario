"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AVATARES_BUCKET } from "@/lib/storage";

export async function actualizarNombre(nombreCompleto: string) {
  const profile = await requireProfile();
  const nombre = nombreCompleto.trim();
  if (!nombre) throw new Error("El nombre no puede estar vacío.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ nombre_completo: nombre })
    .eq("id", profile.id);
  if (error) throw new Error(error.message);

  revalidatePath("/portal", "layout");
  revalidatePath("/portal/perfil");
}

export async function subirAvatar(formData: FormData) {
  const profile = await requireProfile();
  const archivo = formData.get("avatar");
  if (!(archivo instanceof File) || archivo.size === 0) throw new Error("Selecciona una imagen.");
  if (!archivo.type.startsWith("image/")) throw new Error("El archivo debe ser una imagen.");
  if (archivo.size > 5 * 1024 * 1024) throw new Error("La imagen no puede pesar más de 5 MB.");

  const extension = archivo.name.split(".").pop()?.toLowerCase() || "jpg";
  const storagePath = `${profile.id}/avatar.${extension}`;

  const supabase = await createClient();
  const { error: uploadError } = await supabase.storage
    .from(AVATARES_BUCKET)
    .upload(storagePath, archivo, { contentType: archivo.type, upsert: true });
  if (uploadError) throw new Error(uploadError.message);

  const {
    data: { publicUrl },
  } = supabase.storage.from(AVATARES_BUCKET).getPublicUrl(storagePath);

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: `${publicUrl}?t=${Date.now()}` })
    .eq("id", profile.id);
  if (error) throw new Error(error.message);

  revalidatePath("/portal", "layout");
  revalidatePath("/portal/perfil");
}
