"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { agregarNotaOrientacion, eliminarNotaOrientacion } from "@/app/portal/orientados/actions";
import { RichTextEditor } from "@/components/rich-text-editor";
import type { OrientacionNota } from "@/types/database";

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
}

export function NotasOrientacionSection({
  orientadoId,
  notas,
  soloLectura = false,
}: {
  orientadoId: string;
  notas: OrientacionNota[];
  soloLectura?: boolean;
}) {
  const router = useRouter();
  const [nuevo, setNuevo] = useState("");
  const [resetKey, setResetKey] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandida, setExpandida] = useState<string | null>(null);
  const [borrandoId, setBorrandoId] = useState<string | null>(null);

  async function guardar() {
    setError(null);
    setGuardando(true);
    try {
      const resultado = await agregarNotaOrientacion(orientadoId, nuevo);
      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }
      setNuevo("");
      setResetKey((k) => k + 1);
      router.refresh();
    } catch {
      setError("No se pudo guardar la nota. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  async function borrar(id: string) {
    setBorrandoId(id);
    setError(null);
    try {
      const resultado = await eliminarNotaOrientacion(id, orientadoId);
      if (!resultado.ok) {
        setError(resultado.error);
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
      <p className="text-sm font-semibold">Notas</p>

      {!soloLectura && (
        <div className="flex flex-col gap-2">
          <RichTextEditor
            key={resetKey}
            name="contenido"
            placeholder="Agregar una nueva nota"
            minHeightClass="min-h-[5rem]"
            onChange={setNuevo}
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="button"
            onClick={guardar}
            disabled={guardando || !nuevo}
            className="w-fit rounded-full bg-jom-ink px-4 py-2 text-xs font-semibold text-jom-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-jom-white dark:text-jom-ink"
          >
            {guardando ? "Guardando…" : "Agregar nota"}
          </button>
        </div>
      )}

      {notas.length === 0 ? (
        <p className="text-muted text-sm">Todavía no hay notas.</p>
      ) : (
        <div className="glass flex flex-col divide-y divide-black/5 rounded-2xl dark:divide-white/5">
          {notas.map((n) => {
            const abierta = expandida === n.id;
            return (
              <div key={n.id} className="flex items-start gap-2 px-4 py-3">
                <button
                  type="button"
                  onClick={() => setExpandida(abierta ? null : n.id)}
                  className="flex-1 text-left"
                >
                  {abierta ? (
                    <div className="rich-content text-sm" dangerouslySetInnerHTML={{ __html: n.contenido }} />
                  ) : (
                    <p className="truncate text-sm">{n.contenido.replace(/<[^>]*>/g, "")}</p>
                  )}
                  <span className="text-muted text-xs">{formatFecha(n.created_at)}</span>
                </button>
                {!soloLectura && (
                  <button
                    type="button"
                    onClick={() => borrar(n.id)}
                    disabled={borrandoId === n.id}
                    aria-label="Eliminar nota"
                    className="text-muted shrink-0 rounded-full p-1 hover:bg-jom-pink/30 hover:text-jom-ink disabled:opacity-50"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
