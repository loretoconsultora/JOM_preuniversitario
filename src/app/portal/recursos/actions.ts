"use server";

import { revalidatePath } from "next/cache";
import { requireDocente } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { RECURSOS_BUCKET } from "@/lib/storage";
import { actionError, actionOk, ERROR_INESPERADO, type ActionResult } from "@/lib/action-result";

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

export async function crearRecurso(formData: FormData): Promise<ActionResult> {
  const profile = await requireDocente();

  const titulo = String(formData.get("titulo") || "").trim();
  const materia_id = String(formData.get("materia_id") || "") || null;
  // Sin materia no tiene sentido un tema/subtema, así que se ignoran.
  const tema_id = materia_id ? String(formData.get("tema_id") || "") || null : null;
  const subtema_id = tema_id ? String(formData.get("subtema_id") || "") || null : null;
  const tipo = String(formData.get("tipo") || "");
  const url = String(formData.get("url") || "").trim();
  const archivo = formData.get("archivo");

  if (!titulo) return actionError("El título es obligatorio.");
  if (tipo !== "archivo" && tipo !== "enlace") return actionError("Tipo de recurso inválido.");

  try {
    const supabase = await createClient();

    if (tipo === "enlace") {
      if (!url) return actionError("Pega el link del recurso.");
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
      if (error) return actionError(error.message);
    } else {
      if (!(archivo instanceof File) || archivo.size === 0) {
        return actionError("Selecciona un archivo.");
      }
      const storagePath = `${crypto.randomUUID()}-${sanitizeFilename(archivo.name)}`;
      const { error: uploadError } = await supabase.storage
        .from(RECURSOS_BUCKET)
        .upload(storagePath, archivo, { contentType: archivo.type || undefined });
      if (uploadError) return actionError(`No se pudo subir "${archivo.name}": ${uploadError.message}`);

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
      if (error) return actionError(error.message);
    }

    revalidatePath("/portal/recursos");
    return actionOk({});
  } catch (e) {
    console.error("crearRecurso:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

export async function eliminarRecurso(id: string): Promise<ActionResult> {
  await requireDocente();
  try {
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
    if (error) return actionError(error.message);
    revalidatePath("/portal/recursos");
    return actionOk({});
  } catch (e) {
    console.error("eliminarRecurso:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}
