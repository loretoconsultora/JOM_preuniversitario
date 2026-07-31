"use client";

import { useState } from "react";
import type { Materia } from "@/types/database";
import { crearRecurso } from "@/app/portal/recursos/actions";

export function RecursoForm({ materias }: { materias: Materia[] }) {
  const [tipo, setTipo] = useState<"archivo" | "enlace">("archivo");

  const inputClass =
    "glass rounded-xl px-4 py-2.5 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-jom-pink";

  return (
    <form action={crearRecurso} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        Título
        <input name="titulo" required placeholder="Ej. Presentación: Estequiometría" className={inputClass} />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        Materia (opcional)
        <select name="materia_id" className={inputClass}>
          <option value="">General (todas las materias)</option>
          {materias.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nombre}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-col gap-1.5 text-sm">
        Tipo de recurso
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTipo("archivo")}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
              tipo === "archivo"
                ? "bg-jom-ink text-jom-white dark:bg-jom-white dark:text-jom-ink"
                : "glass text-fg/70"
            }`}
          >
            Subir archivo
          </button>
          <button
            type="button"
            onClick={() => setTipo("enlace")}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
              tipo === "enlace"
                ? "bg-jom-ink text-jom-white dark:bg-jom-white dark:text-jom-ink"
                : "glass text-fg/70"
            }`}
          >
            Pegar link
          </button>
        </div>
      </div>
      <input type="hidden" name="tipo" value={tipo} />

      {tipo === "archivo" ? (
        <label className="flex flex-col gap-1.5 text-sm">
          Archivo
          <input
            type="file"
            name="archivo"
            required
            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.mp4,.mp3"
            className="glass rounded-xl px-4 py-2.5 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-jom-ink file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-jom-white focus:outline-none focus:ring-2 focus:ring-jom-pink dark:file:bg-jom-white dark:file:text-jom-ink"
          />
          <span className="text-muted text-xs">PDF, Word, PowerPoint, Excel, imágenes, audio o video. Máximo ~10 MB.</span>
        </label>
      ) : (
        <label className="flex flex-col gap-1.5 text-sm">
          Link
          <input
            name="url"
            required
            placeholder="https://youtube.com/... o cualquier link"
            className={inputClass}
          />
        </label>
      )}

      <button
        type="submit"
        className="mt-2 rounded-full bg-jom-ink px-6 py-3 text-sm font-semibold text-jom-white transition-opacity hover:opacity-90 dark:bg-jom-white dark:text-jom-ink"
      >
        Guardar recurso
      </button>
    </form>
  );
}
