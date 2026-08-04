"use client";

import { useMemo, useState } from "react";
import type { Materia, Subtema, Tema } from "@/types/database";
import { crearRecurso } from "@/app/portal/recursos/actions";

export function RecursoForm({
  materias,
  temas,
  subtemas,
}: {
  materias: Materia[];
  temas: Tema[];
  subtemas: Subtema[];
}) {
  const [tipo, setTipo] = useState<"archivo" | "enlace">("archivo");
  const [materiaId, setMateriaId] = useState("");
  const [temaId, setTemaId] = useState("");
  const [subtemaId, setSubtemaId] = useState("");

  const temasDeLaMateria = useMemo(() => temas.filter((t) => t.materia_id === materiaId), [temas, materiaId]);
  const subtemasDelTema = useMemo(() => subtemas.filter((s) => s.tema_id === temaId), [subtemas, temaId]);

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
        <select
          name="materia_id"
          value={materiaId}
          onChange={(e) => {
            setMateriaId(e.target.value);
            setTemaId("");
            setSubtemaId("");
          }}
          className={inputClass}
        >
          <option value="">General (todas las materias)</option>
          {materias.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nombre}
            </option>
          ))}
        </select>
      </label>

      {materiaId && temasDeLaMateria.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm">
            Tema (opcional)
            <select
              name="tema_id"
              value={temaId}
              onChange={(e) => {
                setTemaId(e.target.value);
                setSubtemaId("");
              }}
              className={inputClass}
            >
              <option value="">Sin especificar</option>
              {temasDeLaMateria.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.titulo}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            Subtema (opcional)
            <select
              name="subtema_id"
              value={subtemaId}
              onChange={(e) => setSubtemaId(e.target.value)}
              disabled={!temaId || subtemasDelTema.length === 0}
              className={`${inputClass} disabled:opacity-50`}
            >
              <option value="">Sin especificar</option>
              {subtemasDelTema.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.titulo}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      {materiaId && temasDeLaMateria.length > 0 && (
        <p className="text-muted -mt-2 text-xs">
          Si eliges tema o subtema, este recurso también aparecerá en esa sección del Temario.
        </p>
      )}

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
