"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Paperclip, Link as LinkIcon, Trash2, AlertCircle } from "lucide-react";
import { subirRecursoOrientacionArchivo } from "@/lib/subir-recurso-orientacion";
import { registrarRecursoOrientacion, eliminarRecursoOrientacion } from "@/app/portal/orientados/actions";
import { formatBytes } from "@/lib/storage";
import type { OrientacionRecurso } from "@/types/database";

export function RecursosOrientacionSection({
  orientadoId,
  recursos,
  urlPorArchivo,
  soloLectura = false,
  titulo = "Recursos",
}: {
  orientadoId: string | null;
  recursos: OrientacionRecurso[];
  urlPorArchivo: Record<string, string>;
  soloLectura?: boolean;
  titulo?: string;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [tipo, setTipo] = useState<"archivo" | "enlace">("enlace");
  const [tituloRecurso, setTituloRecurso] = useState("");
  const [url, setUrl] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [borrandoId, setBorrandoId] = useState<string | null>(null);

  const inputClass =
    "glass rounded-xl px-3.5 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-jom-pink";

  async function guardar() {
    setError(null);
    if (!tituloRecurso.trim()) {
      setError("Ponle un título al recurso.");
      return;
    }
    setGuardando(true);
    try {
      if (tipo === "enlace") {
        const resultado = await registrarRecursoOrientacion({
          orientado_id: orientadoId,
          titulo: tituloRecurso,
          tipo: "enlace",
          url,
          archivo: null,
        });
        if (!resultado.ok) {
          setError(resultado.error);
          return;
        }
      } else {
        const archivo = fileInputRef.current?.files?.[0];
        if (!archivo) {
          setError("Selecciona un archivo.");
          return;
        }
        await subirRecursoOrientacionArchivo(orientadoId, tituloRecurso, archivo);
      }
      setTituloRecurso("");
      setUrl("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setMostrarForm(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar el recurso.");
    } finally {
      setGuardando(false);
    }
  }

  async function borrar(id: string) {
    setBorrandoId(id);
    try {
      const resultado = await eliminarRecursoOrientacion(id);
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
      <div className="flex items-center justify-between">
        {titulo && <p className="text-sm font-semibold">{titulo}</p>}
        {!soloLectura && !mostrarForm && (
          <button
            type="button"
            onClick={() => setMostrarForm(true)}
            className="text-muted inline-flex items-center gap-1 rounded-full bg-black/5 px-3 py-1.5 text-xs font-medium hover:bg-black/10 dark:bg-white/10"
          >
            <Plus size={12} /> Agregar
          </button>
        )}
      </div>

      {mostrarForm && (
        <div className="glass flex flex-col gap-2 rounded-xl p-3">
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setTipo("enlace")}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                tipo === "enlace" ? "bg-jom-ink text-jom-white dark:bg-jom-white dark:text-jom-ink" : "bg-black/5 dark:bg-white/10"
              }`}
            >
              Link
            </button>
            <button
              type="button"
              onClick={() => setTipo("archivo")}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                tipo === "archivo" ? "bg-jom-ink text-jom-white dark:bg-jom-white dark:text-jom-ink" : "bg-black/5 dark:bg-white/10"
              }`}
            >
              Archivo
            </button>
          </div>
          <input
            value={tituloRecurso}
            onChange={(e) => setTituloRecurso(e.target.value)}
            placeholder="Título del recurso"
            className={inputClass}
          />
          {tipo === "enlace" ? (
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." className={inputClass} />
          ) : (
            <input
              ref={fileInputRef}
              type="file"
              className="glass rounded-xl px-3 py-2 text-xs file:mr-3 file:rounded-full file:border-0 file:bg-jom-ink file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-jom-white dark:file:bg-jom-white dark:file:text-jom-ink"
            />
          )}
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

      {recursos.length === 0 ? (
        <p className="text-muted text-sm">Todavía no hay recursos.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {recursos.map((r) => (
            <div key={r.id} className="glass flex items-center gap-2 rounded-xl px-3 py-2 text-xs">
              {r.tipo === "enlace" ? <LinkIcon size={13} className="text-muted shrink-0" /> : <Paperclip size={13} className="text-muted shrink-0" />}
              <a
                href={r.tipo === "enlace" ? (r.url ?? "#") : (urlPorArchivo[r.storage_path ?? ""] ?? "#")}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 truncate hover:underline"
              >
                {r.titulo}
              </a>
              {r.tamano_bytes && <span className="text-muted shrink-0">{formatBytes(r.tamano_bytes)}</span>}
              {!soloLectura && (
                <button
                  type="button"
                  onClick={() => borrar(r.id)}
                  disabled={borrandoId === r.id}
                  aria-label="Eliminar recurso"
                  className="text-muted shrink-0 rounded-full p-1 hover:bg-jom-pink/30 hover:text-jom-ink disabled:opacity-50"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
