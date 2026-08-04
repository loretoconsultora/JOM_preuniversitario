"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireDocente } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { RECURSOS_BUCKET } from "@/lib/storage";

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

export async function crearRecurso(formData: FormData) {
  const profile = await requireDocente();

  const titulo = String(formData.get("titulo") || "").trim();
  const materia_id = String(formData.get("materia_id") || "") || null;
  // Sin materia no tiene sentido un tema/subtema, así que se ignoran.
  const tema_id = materia_id ? String(formData.get("tema_id") || "") || null : null;
  const subtema_id = tema_id ? String(formData.get("subtema_id") || "") || null : null;
  const tipo = String(formData.get("tipo") || "");
  const url = String(formData.get("url") || "").trim();
  const archivo = formData.get("archivo");

  if (!titulo) throw new Error("El título es obligatorio.");
  if (tipo !== "archivo" && tipo !== "enlace") throw new Error("Tipo de recurso inválido.");

  const supabase = await createClient();

  if (tipo === "enlace") {
    if (!url) throw new Error("Pega el link del recurso.");
    let urlNormalizada = url;
    if (!/^https?:\/\//i.test(urlNormalizada)) {
      urlNormalizada = `https://${urlNormalizada}`;
    }
    const { error } = await supabase.from("recursos").insert({
      titulo,
      tipo: "enlace",
      materia_id,
      tema_id,
      subtema_id,
      url: urlNormalizada,
      creado_por: profile.id,
    });
    if (error) throw new Error(error.message);
  } else {
    if (!(archivo instanceof File) || archivo.size === 0) {
      throw new Error("Selecciona un archivo.");
    }
    const storagePath = `${crypto.randomUUID()}-${sanitizeFilename(archivo.name)}`;
    const { error: uploadError } = await supabase.storage
      .from(RECURSOS_BUCKET)
      .upload(storagePath, archivo, { contentType: archivo.type || undefined });
    if (uploadError) throw new Error(`No se pudo subir "${archivo.name}": ${uploadError.message}`);

    const { error } = await supabase.from("recursos").insert({
      titulo,
      tipo: "archivo",
      materia_id,
      tema_id,
      subtema_id,
      storage_path: storagePath,
      nombre_archivo: archivo.name,
      tipo_mime: archivo.type || null,
      tamano_bytes: archivo.size,
      creado_por: profile.id,
    });
    if (error) throw new Error(error.message);
  }

  revalidatePath("/portal/recursos");
  redirect("/portal/recursos");
}

export async function eliminarRecurso(id: string) {
  await requireDocente();
  const supabase = await createClient();

  const { data: recurso } = await supabase
    .from("recursos")
    .select("storage_path")
    .eq("id", id)
    .single();

  if (recurso?.storage_path) {
    await supabase.storage.from(RECURSOS_BUCKET).remove([recurso.storage_path]);
  }

  const { error } = await supabase.from("recursos").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/portal/recursos");
}
