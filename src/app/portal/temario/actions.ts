"use server";

import { revalidatePath } from "next/cache";
import { requireDocente } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { TEMARIO_BUCKET, MATERIA_BANNERS_BUCKET } from "@/lib/storage";
import { toYoutubeEmbedUrl } from "@/lib/youtube";
import { createAnthropicClient } from "@/lib/anthropic";
import { extraerContenidoArchivo } from "@/lib/extraer-texto-archivo";
import type { SubtemaBorrador, TemaImportado } from "@/types/database";

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

// El archivo se sube directo a Storage desde el navegador (ver TemaArchivoUploader):
// las funciones serverless de Vercel rechazan cuerpos de más de 4.5 MB, así que
// esta acción solo registra el archivo ya subido (payload pequeño, sin bytes).
export async function registrarArchivoTema(
  temaId: string,
  archivo: { storage_path: string; nombre_archivo: string; tipo_mime: string | null; tamano_bytes: number }
) {
  const profile = await requireDocente();
  const supabase = await createClient();

  const { error } = await supabase.from("tema_archivos").insert({
    tema_id: temaId,
    storage_path: archivo.storage_path,
    nombre_archivo: archivo.nombre_archivo,
    tipo_mime: archivo.tipo_mime,
    tamano_bytes: archivo.tamano_bytes,
    creado_por: profile.id,
  });
  if (error) throw new Error(error.message);

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

export async function extraerTemarioConIA(formData: FormData): Promise<{ temas: TemaImportado[] }> {
  await requireDocente();

  const file = formData.get("archivo");
  if (!(file instanceof File) || file.size === 0) throw new Error("Selecciona un archivo.");
  if (file.size > 15 * 1024 * 1024) throw new Error("El archivo no puede pesar más de 15 MB.");

  const contenido = await extraerContenidoArchivo(file);

  const instrucciones =
    "Analiza el documento adjunto, que contiene el temario de un curso o taller. Extrae su estructura completa " +
    "como una lista de TEMAS (unidades o módulos principales) y, dentro de cada uno, sus SUBTEMAS. Conserva el " +
    "texto original de los títulos lo más fiel posible (no traduzcas ni resumas de más). Si un subtema tiene una " +
    'lista de puntos numerados (ej. "1.1.1 ..., 1.1.2 ..."), ponlos juntos en "detalle" separados por punto y ' +
    "coma. Si el documento no tiene una jerarquía clara de temas/subtemas, agrupa el contenido de la forma más " +
    "razonable posible. No inventes contenido que no esté en el documento.";

  const client = createAnthropicClient();
  const response = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 8192,
    messages: [
      {
        role: "user",
        content:
          contenido.tipo === "pdf"
            ? [
                {
                  type: "document" as const,
                  source: { type: "base64" as const, media_type: "application/pdf" as const, data: contenido.base64 },
                },
                { type: "text" as const, text: instrucciones },
              ]
            : [{ type: "text" as const, text: `${instrucciones}\n\n--- CONTENIDO DEL DOCUMENTO ---\n${contenido.texto}` }],
      },
    ],
    output_config: {
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            temas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  titulo: { type: "string" },
                  descripcion: { type: "string" },
                  subtemas: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        titulo: { type: "string" },
                        detalle: { type: "string" },
                      },
                      required: ["titulo", "detalle"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["titulo", "descripcion", "subtemas"],
                additionalProperties: false,
              },
            },
          },
          required: ["temas"],
          additionalProperties: false,
        },
      },
    },
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("La IA no devolvió una respuesta válida.");
  }

  const parsed = JSON.parse(textBlock.text) as { temas: TemaImportado[] };
  if (!parsed.temas || parsed.temas.length === 0) {
    throw new Error("No se pudo identificar ningún tema en el documento.");
  }
  return parsed;
}

export async function crearTemasImportados(materiaId: string, temas: TemaImportado[]) {
  const profile = await requireDocente();
  if (!materiaId) throw new Error("Selecciona una materia.");
  if (temas.length === 0) throw new Error("No hay temas para guardar.");

  const supabase = await createClient();

  const { data: existentes } = await supabase
    .from("temas")
    .select("orden")
    .eq("materia_id", materiaId)
    .order("orden", { ascending: false })
    .limit(1);
  let orden = (existentes?.[0]?.orden ?? -1) + 1;

  for (const tema of temas) {
    const titulo = tema.titulo.trim();
    if (!titulo) continue;

    const { data: temaCreado, error } = await supabase
      .from("temas")
      .insert({
        titulo,
        descripcion: tema.descripcion.trim() || null,
        materia_id: materiaId,
        orden,
        creado_por: profile.id,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    orden += 1;

    const subtemas: SubtemaBorrador[] = tema.subtemas
      .filter((s) => s.titulo.trim())
      .map((s) => ({ titulo: s.titulo.trim(), detalle: s.detalle.trim(), ejercicios: [], videos: [] }));
    await guardarSubtemas(supabase, temaCreado.id, subtemas, profile.id);
  }

  revalidatePath("/portal/temario");
  return { count: temas.length };
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
