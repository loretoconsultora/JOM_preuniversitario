"use server";

import { revalidatePath } from "next/cache";
import { requireDocente } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { TEMARIO_BUCKET, MATERIA_BANNERS_BUCKET } from "@/lib/storage";
import { toYoutubeEmbedUrl } from "@/lib/youtube";
import type { SubtemaBorrador } from "@/types/database";

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

function normalizarUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function validarSubtemas(subtemas: SubtemaBorrador[]) {
  for (const [i, s] of subtemas.entries()) {
    if (!s.titulo.trim()) throw new Error(`El subtema ${i + 1} necesita un título.`);
    for (const [j, e] of s.ejercicios.entries()) {
      if (!e.url.trim()) throw new Error(`El ejercicio ${j + 1} del subtema "${s.titulo}" necesita un link.`);
    }
    for (const [j, v] of s.videos.entries()) {
      if (!v.youtube_url.trim() || !toYoutubeEmbedUrl(v.youtube_url)) {
        throw new Error(`El video ${j + 1} del subtema "${s.titulo}" no es un link válido de YouTube.`);
      }
    }
  }
}

async function guardarSubtemas(
  supabase: Awaited<ReturnType<typeof createClient>>,
  temaId: string,
  subtemas: SubtemaBorrador[],
  creadoPor: string
) {
  for (const [i, sub] of subtemas.entries()) {
    const { data: subtema, error: subError } = await supabase
      .from("subtemas")
      .insert({
        tema_id: temaId,
        titulo: sub.titulo.trim(),
        detalle: sub.detalle.trim() || null,
        orden: i,
        creado_por: creadoPor,
      })
      .select("id")
      .single();
    if (subError) throw new Error(subError.message);

    const ejercicios = sub.ejercicios.filter((e) => e.url.trim());
    if (ejercicios.length > 0) {
      const { error } = await supabase.from("subtema_ejercicios").insert(
        ejercicios.map((e, j) => ({
          subtema_id: subtema.id,
          titulo: e.titulo.trim() || `Ejercicio ${j + 1}`,
          url: normalizarUrl(e.url),
          orden: j,
        }))
      );
      if (error) throw new Error(error.message);
    }

    const videos = sub.videos.filter((v) => v.youtube_url.trim());
    if (videos.length > 0) {
      const { error } = await supabase.from("subtema_videos").insert(
        videos.map((v, j) => ({
          subtema_id: subtema.id,
          titulo: v.titulo.trim() || null,
          youtube_url: v.youtube_url.trim(),
          orden: j,
        }))
      );
      if (error) throw new Error(error.message);
    }
  }
}

export async function crearTema(input: {
  titulo: string;
  descripcion: string;
  materia_id: string;
  orden: number;
  subtemas: SubtemaBorrador[];
}) {
  const profile = await requireDocente();

  const titulo = input.titulo.trim();
  if (!titulo) throw new Error("El título del tema es obligatorio.");
  if (!input.materia_id) throw new Error("Selecciona una materia.");
  validarSubtemas(input.subtemas);

  const supabase = await createClient();
  const { data: tema, error } = await supabase
    .from("temas")
    .insert({
      titulo,
      descripcion: input.descripcion.trim() || null,
      materia_id: input.materia_id,
      orden: input.orden || 0,
      creado_por: profile.id,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await guardarSubtemas(supabase, tema.id, input.subtemas, profile.id);

  revalidatePath("/portal/temario");
  return { id: tema.id as string };
}

export async function actualizarTema(
  id: string,
  input: {
    titulo: string;
    descripcion: string;
    materia_id: string;
    orden: number;
    subtemas: SubtemaBorrador[];
  }
) {
  const profile = await requireDocente();

  const titulo = input.titulo.trim();
  if (!titulo) throw new Error("El título del tema es obligatorio.");
  if (!input.materia_id) throw new Error("Selecciona una materia.");
  validarSubtemas(input.subtemas);

  const supabase = await createClient();
  const { error } = await supabase
    .from("temas")
    .update({
      titulo,
      descripcion: input.descripcion.trim() || null,
      materia_id: input.materia_id,
      orden: input.orden || 0,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  // Se reemplazan los subtemas por completo (evita lógica de diff).
  const { error: deleteError } = await supabase.from("subtemas").delete().eq("tema_id", id);
  if (deleteError) throw new Error(deleteError.message);

  await guardarSubtemas(supabase, id, input.subtemas, profile.id);

  revalidatePath("/portal/temario");
  revalidatePath(`/portal/temario/${id}/editar`);
}

export async function subirArchivosTema(temaId: string, formData: FormData) {
  const profile = await requireDocente();
  const archivos = formData.getAll("archivos").filter((f): f is File => f instanceof File && f.size > 0);
  if (archivos.length === 0) return;

  const supabase = await createClient();
  for (const archivo of archivos) {
    const storagePath = `${temaId}/${crypto.randomUUID()}-${sanitizeFilename(archivo.name)}`;
    const { error: uploadError } = await supabase.storage
      .from(TEMARIO_BUCKET)
      .upload(storagePath, archivo, { contentType: archivo.type || undefined });
    if (uploadError) throw new Error(`No se pudo subir "${archivo.name}": ${uploadError.message}`);

    const { error } = await supabase.from("tema_archivos").insert({
      tema_id: temaId,
      storage_path: storagePath,
      nombre_archivo: archivo.name,
      tipo_mime: archivo.type || null,
      tamano_bytes: archivo.size,
      creado_por: profile.id,
    });
    if (error) throw new Error(error.message);
  }

  revalidatePath("/portal/temario");
  revalidatePath(`/portal/temario/${temaId}/editar`);
}

export async function eliminarArchivoTema(archivoId: string, temaId: string) {
  await requireDocente();
  const supabase = await createClient();

  const { data: archivo } = await supabase
    .from("tema_archivos")
    .select("storage_path")
    .eq("id", archivoId)
    .single();

  if (archivo?.storage_path) {
    await supabase.storage.from(TEMARIO_BUCKET).remove([archivo.storage_path]);
  }

  const { error } = await supabase.from("tema_archivos").delete().eq("id", archivoId);
  if (error) throw new Error(error.message);

  revalidatePath("/portal/temario");
  revalidatePath(`/portal/temario/${temaId}/editar`);
}

export async function eliminarTema(id: string) {
  await requireDocente();
  const supabase = await createClient();

  const { data: archivos } = await supabase.from("tema_archivos").select("storage_path").eq("tema_id", id);
  if (archivos && archivos.length > 0) {
    await supabase.storage.from(TEMARIO_BUCKET).remove(archivos.map((a) => a.storage_path));
  }

  const { error } = await supabase.from("temas").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/portal/temario");
}

export async function subirBannerMateria(materiaId: string, formData: FormData) {
  await requireDocente();
  const archivo = formData.get("banner");
  if (!(archivo instanceof File) || archivo.size === 0) throw new Error("Selecciona una imagen.");
  if (!archivo.type.startsWith("image/")) throw new Error("El archivo debe ser una imagen.");
  if (archivo.size > 5 * 1024 * 1024) throw new Error("La imagen no puede pesar más de 5 MB.");

  const extension = archivo.name.split(".").pop()?.toLowerCase() || "jpg";
  const storagePath = `${materiaId}/banner.${extension}`;

  const supabase = await createClient();
  const { error: uploadError } = await supabase.storage
    .from(MATERIA_BANNERS_BUCKET)
    .upload(storagePath, archivo, { contentType: archivo.type, upsert: true });
  if (uploadError) throw new Error(uploadError.message);

  const {
    data: { publicUrl },
  } = supabase.storage.from(MATERIA_BANNERS_BUCKET).getPublicUrl(storagePath);

  const { error } = await supabase
    .from("materias")
    .update({ banner_url: `${publicUrl}?t=${Date.now()}` })
    .eq("id", materiaId);
  if (error) throw new Error(error.message);

  revalidatePath("/portal/temario");
}
