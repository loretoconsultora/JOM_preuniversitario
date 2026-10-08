import { createClient } from "@/lib/supabase/client";
import { ORIENTACION_TESTS_BUCKET } from "@/lib/storage";
import { registrarTestOrientacion } from "@/app/portal/orientados/actions";

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

export async function subirTestOrientacion(
  orientadoId: string,
  datos: {
    nombre_test: string;
    resultado: string;
    fecha: string;
    modo: "archivo" | "link" | "interactivo";
    url: string | null;
    preguntas: { enunciado: string; opciones: string[] }[];
  },
  archivo: File | null
) {
  let archivoMeta: { storage_path: string; nombre_archivo: string; tipo_mime: string | null; tamano_bytes: number } | null = null;

  if (archivo) {
    const supabase = createClient();
    const storagePath = `${orientadoId}/${crypto.randomUUID()}-${sanitizeFilename(archivo.name)}`;
    const { error: uploadError } = await supabase.storage
      .from(ORIENTACION_TESTS_BUCKET)
      .upload(storagePath, archivo, { contentType: archivo.type || undefined });
    if (uploadError) throw new Error(`No se pudo subir "${archivo.name}": ${uploadError.message}`);
    archivoMeta = {
      storage_path: storagePath,
      nombre_archivo: archivo.name,
      tipo_mime: archivo.type || null,
      tamano_bytes: archivo.size,
    };
  }

  const resultado = await registrarTestOrientacion(orientadoId, { ...datos, archivo: archivoMeta });
  if (!resultado.ok) throw new Error(resultado.error);
}
