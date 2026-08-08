import { createClient } from "@/lib/supabase/client";
import { FORO_BUCKET } from "@/lib/storage";
import { crearPublicacion } from "@/app/portal/foro/actions";

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

// Igual que subirArchivoEntrega: el archivo se sube directo a Supabase
// Storage desde el navegador (nunca pasa por una server action, que
// rechazaría cuerpos de más de 4.5 MB en Vercel); la publicación solo
// registra los metadatos después.
export async function crearPublicacionConArchivo(
  materiaId: string,
  autorId: string,
  data: { texto: string | null; link: string | null; archivo: File | null }
) {
  if (!data.archivo) {
    await crearPublicacion(materiaId, { texto: data.texto, link: data.link, archivo: null });
    return;
  }

  const supabase = createClient();
  const storagePath = `${autorId}/${crypto.randomUUID()}-${sanitizeFilename(data.archivo.name)}`;
  const { error: uploadError } = await supabase.storage
    .from(FORO_BUCKET)
    .upload(storagePath, data.archivo, { contentType: data.archivo.type || undefined });
  if (uploadError) throw new Error(`No se pudo subir "${data.archivo.name}": ${uploadError.message}`);

  await crearPublicacion(materiaId, {
    texto: data.texto,
    link: data.link,
    archivo: {
      storage_path: storagePath,
      nombre_archivo: data.archivo.name,
      tipo_mime: data.archivo.type || null,
      tamano_bytes: data.archivo.size,
    },
  });
}
