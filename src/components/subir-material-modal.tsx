"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { subirArchivoTema } from "@/lib/subir-archivo-tema";
import type { Materia } from "@/types/database";

type TemaOption = { id: string; titulo: string };

export function SubirMaterialModal({
  materias,
  materiaInicialId,
}: {
  materias: Materia[];
  materiaInicialId?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [materiaId, setMateriaId] = useState("");
  const [temas, setTemas] = useState<TemaOption[]>([]);
  const [temaId, setTemaId] = useState("");
  const [cargandoTemas, setCargandoTemas] = useState(false);
  const [archivos, setArchivos] = useState<FileList | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cargarTemas(id: string) {
    setMateriaId(id);
    setTemaId("");
    setTemas([]);
    setError(null);
    if (!id) return;
    setCargandoTemas(true);
    const supabase = createClient();
    const { data } = await supabase.from("temas").select("id, titulo").eq("materia_id", id).order("orden");
    setTemas((data ?? []) as TemaOption[]);
    setCargandoTemas(false);
  }

  function abrir() {
    setOpen(true);
    setError(null);
    setArchivos(null);
    if (materiaInicialId) cargarTemas(materiaInicialId);
  }

  function cerrar() {
    if (subiendo) return;
    setOpen(false);
  }

  async function subir() {
    if (!temaId) {
      setError("Selecciona un tema.");
      return;
    }
    if (!archivos || archivos.length === 0) {
      setError("Selecciona al menos un archivo.");
      return;
    }
    setSubiendo(true);
    setError(null);
    try {
      for (const archivo of Array.from(archivos)) {
        await subirArchivoTema(temaId, archivo);
      }
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo subir el material.");
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        className="inline-flex items-center gap-1.5 rounded-full bg-jom-pink px-4 py-2.5 text-sm font-semibold text-jom-ink transition-opacity hover:opacity-90"
      >
        <Upload size={15} /> Subir material
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={cerrar}>
          <div
            className="w-full max-w-md rounded-2xl bg-jom-white p-6 text-jom-ink shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Subir material</h2>
              <button
                type="button"
                onClick={cerrar}
                aria-label="Cerrar"
                className="rounded-full p-1.5 text-jom-gray transition-colors hover:bg-black/5"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5 text-sm">
                Materia
                <select
                  value={materiaId}
                  onChange={(e) => cargarTemas(e.target.value)}
                  className="rounded-xl border border-black/10 bg-jom-white px-4 py-2.5 text-sm text-jom-ink focus:outline-none focus:ring-2 focus:ring-jom-pink"
                >
                  <option value="">Selecciona una materia</option>
                  {materias.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5 text-sm">
                Tema
                <select
                  value={temaId}
                  onChange={(e) => setTemaId(e.target.value)}
                  disabled={!materiaId || cargandoTemas}
                  className="rounded-xl border border-black/10 bg-jom-white px-4 py-2.5 text-sm text-jom-ink focus:outline-none focus:ring-2 focus:ring-jom-pink disabled:opacity-60"
                >
                  <option value="">
                    {cargandoTemas ? "Cargando temas…" : temas.length === 0 && materiaId ? "Esta materia no tiene temas" : "Selecciona un tema"}
                  </option>
                  {temas.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.titulo}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5 text-sm">
                Archivo(s)
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.webp"
                  onChange={(e) => setArchivos(e.target.files)}
                  className="rounded-xl border border-black/10 bg-jom-white px-4 py-2.5 text-xs file:mr-3 file:rounded-full file:border-0 file:bg-jom-ink file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-jom-white"
                />
              </label>

              {error && <p className="text-xs text-red-600">{error}</p>}

              <button
                type="button"
                onClick={subir}
                disabled={subiendo}
                className="mt-1 rounded-full bg-jom-ink px-4 py-2.5 text-sm font-semibold text-jom-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {subiendo ? "Subiendo…" : "Subir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
