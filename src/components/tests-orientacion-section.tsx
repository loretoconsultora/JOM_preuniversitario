"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, FileText, Trash2, AlertCircle } from "lucide-react";
import { subirTestOrientacion } from "@/lib/subir-test-orientacion";
import { eliminarTestOrientacion } from "@/app/portal/orientados/actions";
import { formatBytes } from "@/lib/storage";
import type { OrientacionTest } from "@/types/database";

function formatFecha(fecha: string) {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
}

export function TestsOrientacionSection({
  orientadoId,
  tests,
  urlPorArchivo,
  soloLectura = false,
}: {
  orientadoId: string;
  tests: OrientacionTest[];
  urlPorArchivo: Record<string, string>;
  soloLectura?: boolean;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [nombreTest, setNombreTest] = useState("");
  const [resultado, setResultado] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [archivo, setArchivo] = useState<File | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [borrandoId, setBorrandoId] = useState<string | null>(null);

  const inputClass =
    "glass rounded-xl px-3.5 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-jom-pink";

  async function guardar() {
    setError(null);
    if (!nombreTest.trim()) {
      setError("Indica el nombre del test.");
      return;
    }
    setGuardando(true);
    try {
      await subirTestOrientacion(orientadoId, { nombre_test: nombreTest, resultado, fecha }, archivo);
      setNombreTest("");
      setResultado("");
      setArchivo(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setMostrarForm(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar el test.");
    } finally {
      setGuardando(false);
    }
  }

  async function borrar(id: string) {
    if (!window.confirm("¿Eliminar este test? Esta acción no se puede deshacer.")) return;
    setBorrandoId(id);
    try {
      const resultadoDelete = await eliminarTestOrientacion(id, orientadoId);
      if (!resultadoDelete.ok) {
        setError(resultadoDelete.error);
        return;
      }
      router.refresh();
    } catch {
      setError("No se pudo eliminar. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setBorrandoId(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Tests vocacionales</p>
        {!soloLectura && !mostrarForm && (
          <button
            type="button"
            onClick={() => setMostrarForm(true)}
            className="text-muted inline-flex items-center gap-1 rounded-full bg-black/5 px-3 py-1.5 text-xs font-medium hover:bg-black/10 dark:bg-white/10"
          >
            <Plus size={12} /> Agregar resultado
          </button>
        )}
      </div>

      {mostrarForm && (
        <div className="glass flex flex-col gap-2 rounded-xl p-3">
          <input
            value={nombreTest}
            onChange={(e) => setNombreTest(e.target.value)}
            placeholder="Nombre del test (ej. Kuder, CHASIDE)"
            className={inputClass}
          />
          <textarea
            value={resultado}
            onChange={(e) => setResultado(e.target.value)}
            rows={3}
            placeholder="Resumen del resultado"
            className={inputClass}
          />
          <div className="flex flex-wrap items-center gap-2">
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={inputClass} />
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
              className="glass flex-1 rounded-xl px-3 py-2 text-xs file:mr-3 file:rounded-full file:border-0 file:bg-jom-ink file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-jom-white dark:file:bg-jom-white dark:file:text-jom-ink"
            />
          </div>
          {error && (
            <p className="flex items-center gap-1 text-xs text-red-500">
              <AlertCircle size={12} /> {error}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={guardar}
              disabled={guardando}
              className="rounded-full bg-jom-ink px-3.5 py-1.5 text-xs font-semibold text-jom-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-jom-white dark:text-jom-ink"
            >
              {guardando ? "Guardando…" : "Guardar"}
            </button>
            <button type="button" onClick={() => setMostrarForm(false)} className="text-muted text-xs underline underline-offset-2">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {tests.length === 0 ? (
        <p className="text-muted text-sm">Todavía no hay tests registrados.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {tests.map((t) => (
            <div key={t.id} className="glass flex flex-col gap-1.5 rounded-2xl p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{t.nombre_test}</p>
                  <p className="text-muted text-xs">{formatFecha(t.fecha)}</p>
                </div>
                {!soloLectura && (
                  <button
                    type="button"
                    onClick={() => borrar(t.id)}
                    disabled={borrandoId === t.id}
                    aria-label="Eliminar test"
                    className="text-muted shrink-0 rounded-full p-1 hover:bg-jom-pink/30 hover:text-jom-ink disabled:opacity-50"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
              {t.resultado && <p className="text-sm">{t.resultado}</p>}
              {t.storage_path && (
                <a
                  href={urlPorArchivo[t.storage_path] ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-fit items-center gap-1.5 text-xs text-jom-pink hover:underline"
                >
                  <FileText size={12} /> {t.nombre_archivo}
                  {t.tamano_bytes && <span className="text-muted">{formatBytes(t.tamano_bytes)}</span>}
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
