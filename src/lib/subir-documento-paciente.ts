import { createClient } from "@/lib/supabase/client";
import { PACIENTE_DOCUMENTOS_BUCKET } from "@/lib/storage";
import { registrarDocumentoPaciente } from "@/app/portal/pacientes/actions";

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

// Sube directo a Supabase Storage desde el navegador y luego solo registra
// los metadatos vía server action: las funciones serverless de Vercel
// rechazan cuerpos de más de 4.5 MB, y las pruebas/evaluaciones escaneadas
// pueden pesar más que eso.
export async function subirDocumentoPaciente(pacienteId: string, archivo: File) {
  const supabase = createClient();
  const storagePath = `${pacienteId}/${crypto.randomUUID()}-${sanitizeFilename(archivo.name)}`;
  const { error: uploadError } = await supabase.storage
    .from(PACIENTE_DOCUMENTOS_BUCKET)
    .upload(storagePath, archivo, { contentType: archivo.type || undefined });
  if (uploadError) throw new Error(`No se pudo subir "${archivo.name}": ${uploadError.message}`);

  await registrarDocumentoPaciente(pacienteId, {
    storage_path: storagePath,
    nombre_archivo: archivo.name,
    tipo_mime: archivo.type || null,
    tamano_bytes: archivo.size,
  });
}
