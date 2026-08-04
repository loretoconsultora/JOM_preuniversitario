import { createClient } from "@/lib/supabase/client";
import { TAREAS_ENTREGAS_BUCKET } from "@/lib/storage";
import { registrarArchivoEntrega } from "@/app/portal/tareas/entrega-actions";

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

// Sube directo a Supabase Storage desde el navegador (el alumno solo
// puede escribir dentro de su propia carpeta) y luego solo registra los
// metadatos vía server action: las funciones serverless de Vercel
// rechazan cuerpos de más de 4.5 MB, así que los bytes del archivo nunca
// deben pasar por una server action.
export async function subirArchivoEntrega(tareaId: string, alumnoId: string, archivo: File) {
  const supabase = createClient();
  const storagePath = `${alumnoId}/${tareaId}/${crypto.randomUUID()}-${sanitizeFilename(archivo.name)}`;
  const { error: uploadError } = await supabase.storage
    .from(TAREAS_ENTREGAS_BUCKET)
    .upload(storagePath, archivo, { contentType: archivo.type || undefined });
  if (uploadError) throw new Error(`No se pudo subir "${archivo.name}": ${uploadError.message}`);

  await registrarArchivoEntrega(tareaId, {
    storage_path: storagePath,
    nombre_archivo: archivo.name,
    tipo_mime: archivo.type || null,
    tamano_bytes: archivo.size,
  });
}
