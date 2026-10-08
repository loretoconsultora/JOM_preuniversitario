import { createClient } from "@/lib/supabase/client";
import { ORIENTACION_RECURSOS_BUCKET } from "@/lib/storage";
import { registrarRecursoOrientacion } from "@/app/portal/orientados/actions";

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

export async function subirRecursoOrientacionArchivo(
  orientadoId: string | null,
  titulo: string,
  archivo: File
) {
  const supabase = createClient();
  const storagePath = `${crypto.randomUUID()}-${sanitizeFilename(archivo.name)}`;
  const { error: uploadError } = await supabase.storage
    .from(ORIENTACION_RECURSOS_BUCKET)
    .upload(storagePath, archivo, { contentType: archivo.type || undefined });
  if (uploadError) throw new Error(`No se pudo subir "${archivo.name}": ${uploadError.message}`);

  const resultado = await registrarRecursoOrientacion({
    orientado_id: orientadoId,
    titulo,
    tipo: "archivo",
    url: null,
    archivo: {
      storage_path: storagePath,
      nombre_archivo: archivo.name,
      tipo_mime: archivo.type || null,
      tamano_bytes: archivo.size,
    },
  });
  if (!resultado.ok) throw new Error(resultado.error);
}
