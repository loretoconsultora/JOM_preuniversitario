"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Sparkles, Trash2 } from "lucide-react";
import { extraerTemarioConIA, crearTemasImportados } from "@/app/portal/temario/actions";
import type { Materia, TemaImportado } from "@/types/database";

export function ImportarTemarioForm({ materias }: { materias: Materia[] }) {
  const router = useRouter();
  const [materiaId, setMateriaId] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [analizando, setAnalizando] = useState(false);
  const [temas, setTemas] = useState<TemaImportado[] | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputClass =
    "glass rounded-xl px-4 py-2.5 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-jom-pink";

  async function analizar() {
    setError(null);
    if (!archivo) {
      setError("Selecciona un archivo.");
      return;
    }
    setAnalizando(true);
    try {
      const formData = new FormData();
      formData.set("archivo", archivo);
      const resultado = await extraerTemarioConIA(formData);
      setTemas(resultado.temas);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo analizar el archivo.");
    } finally {
      setAnalizando(false);
    }
  }

  function actualizarTema(i: number, campo: "titulo" | "descripcion", valor: string) {
    setTemas((prev) => prev!.map((t, idx) => (idx === i ? { ...t, [campo]: valor } : t)));
  }

  function eliminarTema(i: number) {
    setTemas((prev) => prev!.filter((_, idx) => idx !== i));
  }

  function actualizarSubtema(ti: number, si: number, campo: "titulo" | "detalle", valor: string) {
    setTemas((prev) =>
      prev!.map((t, idx) =>
        idx === ti ? { ...t, subtemas: t.subtemas.map((s, j) => (j === si ? { ...s, [campo]: valor } : s)) } : t
      )
    );
  }

  function eliminarSubtema(ti: number, si: number) {
    setTemas((prev) =>
      prev!.map((t, idx) => (idx === ti ? { ...t, subtemas: t.subtemas.filter((_, j) => j !== si) } : t))
    );
  }

  async function guardar() {
    setError(null);
    if (!materiaId) {
      setError("Selecciona una materia.");
      return;
    }
    if (!temas || temas.length === 0) {
      setError("No hay temas para guardar.");
      return;
    }
    setGuardando(true);
    try {
      await crearTemasImportados(materiaId, temas);
      router.push("/portal/temario");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar el temario.");
      setGuardando(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <label className="flex flex-col gap-1.5 text-sm">
        Materia
        <select value={materiaId} onChange={(e) => setMateriaId(e.target.value)} className={inputClass}>
          <option value="">Selecciona una materia</option>
          {materias.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nombre}
            </option>
          ))}
        </select>
      </label>

      {!temas ? (
        <>
          <label className="flex flex-col gap-1.5 text-sm">
            Archivo del temario (Word, PDF, Excel o CSV)
            <input
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv"
              onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
              className="glass rounded-xl px-4 py-2.5 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-jom-ink file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-jom-white focus:outline-none focus:ring-2 focus:ring-jom-pink dark:file:bg-jom-white dark:file:text-jom-ink"
            />
          </label>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-500">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <button
            type="button"
            onClick={analizar}
            disabled={analizando || !archivo}
            className="inline-flex w-fit items-center gap-1.5 rounded-full bg-jom-ink px-5 py-2.5 text-sm font-semibold text-jom-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-jom-white dark:text-jom-ink"
          >
            <Sparkles size={15} /> {analizando ? "Analizando…" : "Analizar con IA"}
          </button>
        </>
      ) : (
        <>
          <p className="text-muted text-sm">
            Revisa y ajusta lo que detectó la IA antes de guardar. Se crearán {temas.length} tema(s).
          </p>

          <div className="flex flex-col gap-4">
            {temas.map((tema, ti) => (
              <div key={ti} className="glass flex flex-col gap-3 rounded-2xl p-4">
                <div className="flex items-center gap-2">
                  <input
                    value={tema.titulo}
                    onChange={(e) => actualizarTema(ti, "titulo", e.target.value)}
                    className={`${inputClass} flex-1 font-medium`}
                  />
                  <button
                    type="button"
                    onClick={() => eliminarTema(ti)}
                    aria-label="Eliminar tema"
                    className="text-muted shrink-0 rounded-full p-1.5 transition-colors hover:bg-jom-pink/30 hover:text-jom-ink"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <textarea
                  value={tema.descripcion}
                  onChange={(e) => actualizarTema(ti, "descripcion", e.target.value)}
                  rows={2}
                  placeholder="Descripción (opcional)"
                  className={`${inputClass} text-xs`}
                />

                <div className="flex flex-col gap-2 pl-2">
                  {tema.subtemas.map((sub, si) => (
                    <div key={si} className="flex flex-col gap-1 border-l-2 border-black/10 pl-3 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <input
                          value={sub.titulo}
                          onChange={(e) => actualizarSubtema(ti, si, "titulo", e.target.value)}
                          className={`${inputClass} flex-1 py-1.5 text-sm`}
                        />
                        <button
                          type="button"
                          onClick={() => eliminarSubtema(ti, si)}
                          aria-label="Eliminar subtema"
                          className="text-muted shrink-0 rounded-full p-1 hover:text-jom-ink"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <textarea
                        value={sub.detalle}
                        onChange={(e) => actualizarSubtema(ti, si, "detalle", e.target.value)}
                        rows={1}
                        className={`${inputClass} py-1.5 text-xs`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-500">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={guardar}
              disabled={guardando}
              className="rounded-full bg-jom-ink px-6 py-3 text-sm font-semibold text-jom-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-jom-white dark:text-jom-ink"
            >
              {guardando ? "Guardando…" : "Guardar temario"}
            </button>
            <button type="button" onClick={() => setTemas(null)} className="text-muted text-sm hover:text-fg">
              Volver a intentar
            </button>
          </div>
        </>
      )}
    </div>
  );
}
