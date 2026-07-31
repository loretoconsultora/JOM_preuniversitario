"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { subirArchivoTema } from "@/lib/subir-archivo-tema";

export function TemaArchivoUploader({ temaId }: { temaId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function subirArchivos(files: FileList) {
    setSubiendo(true);
    setError(null);
    try {
      for (const archivo of Array.from(files)) {
        await subirArchivoTema(temaId, archivo);
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo subir el archivo.");
    } finally {
      setSubiendo(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.webp"
          disabled={subiendo}
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) subirArchivos(e.target.files);
          }}
          className="glass flex-1 rounded-xl px-4 py-2 text-xs file:mr-3 file:rounded-full file:border-0 file:bg-jom-ink file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-jom-white focus:outline-none focus:ring-2 focus:ring-jom-pink disabled:opacity-60 dark:file:bg-jom-white dark:file:text-jom-ink"
        />
        <span className="glass shrink-0 rounded-full p-2.5 text-muted">
          <Upload size={14} className={subiendo ? "animate-pulse" : ""} />
        </span>
      </div>
      {subiendo && <p className="text-muted text-xs">Subiendo…</p>}
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
