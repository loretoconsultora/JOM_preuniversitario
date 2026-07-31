import { createClient } from "@/lib/supabase/client";
import { TEMARIO_BUCKET } from "@/lib/storage";
import { registrarArchivoTema } from "@/app/portal/temario/actions";

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

// Sube directo a Supabase Storage desde el navegador y luego solo registra
// los metadatos vía server action: las funciones serverless de Vercel
// rechazan cuerpos de más de 4.5 MB, así que los bytes del archivo nunca
// deben pasar por una server action.
export async function subirArchivoTema(temaId: string, archivo: File) {
  const supabase = createClient();
  const storagePath = `${temaId}/${crypto.randomUUID()}-${sanitizeFilename(archivo.name)}`;
  const { error: uploadError } = await supabase.storage
    .from(TEMARIO_BUCKET)
    .upload(storagePath, archivo, { contentType: archivo.type || undefined });
  if (uploadError) throw new Error(`No se pudo subir "${archivo.name}": ${uploadError.message}`);

  await registrarArchivoTema(temaId, {
    storage_path: storagePath,
    nombre_archivo: archivo.name,
    tipo_mime: archivo.type || null,
    tamano_bytes: archivo.size,
  });
}
