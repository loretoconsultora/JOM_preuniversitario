"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Paperclip, Trash2, Upload, Loader2, AlertCircle } from "lucide-react";
import { subirDocumentoPaciente } from "@/lib/subir-documento-paciente";
import { eliminarDocumentoPaciente } from "@/app/portal/pacientes/actions";
import { formatBytes } from "@/lib/storage";

const FORMATOS_PERMITIDOS = ".pdf,.doc,.docx,.jpg,.jpeg,.png,.heic";

type Documento = {
  id: string;
  nombre_archivo: string;
  tamano_bytes: number | null;
  url: string | null;
};

export function DocumentosPacienteSection({
  pacienteId,
  documentosIniciales,
}: {
  pacienteId: string;
  documentosIniciales: Documento[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function subirArchivos(files: FileList) {
    setError(null);
    setSubiendo(true);
    try {
      for (const archivo of Array.from(files)) {
        await subirDocumentoPaciente(pacienteId, archivo);
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo subir el archivo.");
    } finally {
      setSubiendo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function borrarDocumento(id: string) {
    try {
      await eliminarDocumentoPaciente(id);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo borrar el archivo.");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {documentosIniciales.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {documentosIniciales.map((d) => (
            <div key={d.id} className="glass flex items-center gap-2 rounded-xl px-3 py-2 text-xs">
              <Paperclip size={13} className="text-muted shrink-0" />
              <a href={d.url ?? "#"} target="_blank" rel="noopener noreferrer" className="flex-1 truncate hover:underline">
                {d.nombre_archivo}
              </a>
              {d.tamano_bytes && <span className="text-muted shrink-0">{formatBytes(d.tamano_bytes)}</span>}
              <button
                type="button"
                onClick={() => borrarDocumento(d.id)}
                aria-label="Eliminar documento"
                className="text-muted shrink-0 rounded-full p-1 hover:bg-jom-pink/30 hover:text-jom-ink"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      <label className="inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-full bg-black/5 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15">
        {subiendo ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
        {subiendo ? "Subiendo…" : "Subir documento"}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={FORMATOS_PERMITIDOS}
          onChange={(e) => e.target.files && subirArchivos(e.target.files)}
          className="hidden"
        />
      </label>
      <p className="text-muted text-xs">Formatos permitidos: PDF, Word (.doc, .docx), JPG, PNG, HEIC. Puedes subir varios archivos.</p>

      {error && (
        <p className="flex items-center gap-1 text-xs text-red-500">
          <AlertCircle size={12} /> {error}
        </p>
      )}
    </div>
  );
}
