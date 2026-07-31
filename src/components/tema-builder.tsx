"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, AlertCircle, Film, LinkIcon } from "lucide-react";
import type { Materia, SubtemaBorrador } from "@/types/database";
import { crearTema, actualizarTema, subirArchivosTema } from "@/app/portal/temario/actions";

function subtemaVacio(): SubtemaBorrador {
  return { titulo: "", detalle: "", ejercicios: [], videos: [] };
}

export function TemaBuilder({
  materias,
  temaId,
  initial,
}: {
  materias: Materia[];
  temaId?: string;
  initial?: {
    titulo: string;
    descripcion: string;
    materia_id: string;
    orden: number;
    subtemas: SubtemaBorrador[];
  };
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [titulo, setTitulo] = useState(initial?.titulo ?? "");
  const [descripcion, setDescripcion] = useState(initial?.descripcion ?? "");
  const [materiaId, setMateriaId] = useState(initial?.materia_id ?? "");
  const [orden, setOrden] = useState(initial?.orden ?? 1);
  const [subtemas, setSubtemas] = useState<SubtemaBorrador[]>(initial?.subtemas ?? []);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputClass =
    "glass rounded-xl px-4 py-2.5 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-jom-pink";

  function agregarSubtema() {
    setSubtemas((prev) => [...prev, subtemaVacio()]);
  }

  function actualizarSubtemaTitulo(index: number, valor: string) {
    setSubtemas((prev) => prev.map((s, i) => (i === index ? { ...s, titulo: valor } : s)));
  }

  function actualizarSubtemaDetalle(index: number, valor: string) {
    setSubtemas((prev) => prev.map((s, i) => (i === index ? { ...s, detalle: valor } : s)));
  }

  function eliminarSubtema(index: number) {
    setSubtemas((prev) => prev.filter((_, i) => i !== index));
  }

  function agregarEjercicio(sIndex: number) {
    setSubtemas((prev) =>
      prev.map((s, i) => (i === sIndex ? { ...s, ejercicios: [...s.ejercicios, { titulo: "", url: "" }] } : s))
    );
  }

  function actualizarEjercicio(sIndex: number, eIndex: number, campo: "titulo" | "url", valor: string) {
    setSubtemas((prev) =>
      prev.map((s, i) =>
        i === sIndex
          ? { ...s, ejercicios: s.ejercicios.map((e, j) => (j === eIndex ? { ...e, [campo]: valor } : e)) }
          : s
      )
    );
  }

  function eliminarEjercicio(sIndex: number, eIndex: number) {
    setSubtemas((prev) =>
      prev.map((s, i) => (i === sIndex ? { ...s, ejercicios: s.ejercicios.filter((_, j) => j !== eIndex) } : s))
    );
  }

  function agregarVideo(sIndex: number) {
    setSubtemas((prev) =>
      prev.map((s, i) => (i === sIndex ? { ...s, videos: [...s.videos, { titulo: "", youtube_url: "" }] } : s))
    );
  }

  function actualizarVideo(sIndex: number, vIndex: number, campo: "titulo" | "youtube_url", valor: string) {
    setSubtemas((prev) =>
      prev.map((s, i) =>
        i === sIndex ? { ...s, videos: s.videos.map((v, j) => (j === vIndex ? { ...v, [campo]: valor } : v)) } : s
      )
    );
  }

  function eliminarVideo(sIndex: number, vIndex: number) {
    setSubtemas((prev) =>
      prev.map((s, i) => (i === sIndex ? { ...s, videos: s.videos.filter((_, j) => j !== vIndex) } : s))
    );
  }

  async function guardar() {
    setError(null);
    if (!titulo.trim()) {
      setError("Ponle un título al tema.");
      return;
    }
    if (!materiaId) {
      setError("Selecciona una materia.");
      return;
    }
    setGuardando(true);
    try {
      const input = { titulo, descripcion, materia_id: materiaId, orden, subtemas };
      if (temaId) {
        await actualizarTema(temaId, input);
        router.push("/portal/temario");
        router.refresh();
      } else {
        const { id } = await crearTema(input);
        const archivos = fileInputRef.current?.files;
        if (archivos && archivos.length > 0) {
          const formData = new FormData();
          for (const archivo of Array.from(archivos)) formData.append("archivos", archivo);
          await subirArchivosTema(id, formData);
        }
        router.push("/portal/temario");
        router.refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar el tema.");
      setGuardando(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <label className="flex flex-col gap-1.5 text-sm">
        Título del tema
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Ej. Unidad 1: Cinemática"
          className={inputClass}
        />
      </label>

      <div className="grid grid-cols-[1fr_auto] gap-4">
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
        <label className="flex flex-col gap-1.5 text-sm">
          Orden
          <input
            type="number"
            min={1}
            value={orden}
            onChange={(e) => setOrden(Number(e.target.value))}
            className={`${inputClass} w-20`}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5 text-sm">
        Descripción (opcional)
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          rows={2}
          className={inputClass}
        />
      </label>

      {!temaId && (
        <label className="flex flex-col gap-1.5 text-sm">
          Archivos y presentaciones del tema
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.webp"
            className="glass rounded-xl px-4 py-2.5 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-jom-ink file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-jom-white focus:outline-none focus:ring-2 focus:ring-jom-pink dark:file:bg-jom-white dark:file:text-jom-ink"
          />
        </label>
      )}

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Subtemas</p>
          <button
            type="button"
            onClick={agregarSubtema}
            className="inline-flex items-center gap-1.5 rounded-full bg-black/5 px-3.5 py-2 text-xs font-medium transition-colors hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15"
          >
            <Plus size={14} /> Agregar subtema
          </button>
        </div>

        {subtemas.map((subtema, sIndex) => (
          <div key={sIndex} className="glass flex flex-col gap-3 rounded-2xl p-4">
            <div className="flex items-center gap-2">
              <input
                value={subtema.titulo}
                onChange={(e) => actualizarSubtemaTitulo(sIndex, e.target.value)}
                placeholder={`Subtema ${sIndex + 1}`}
                className={`${inputClass} flex-1`}
              />
              <button
                type="button"
                onClick={() => eliminarSubtema(sIndex)}
                aria-label="Eliminar subtema"
                className="text-muted shrink-0 rounded-full p-1.5 transition-colors hover:bg-jom-pink/30 hover:text-jom-ink"
              >
                <Trash2 size={14} />
              </button>
            </div>

            <textarea
              value={subtema.detalle}
              onChange={(e) => actualizarSubtemaDetalle(sIndex, e.target.value)}
              placeholder="Detalle (opcional). Ej. 1.1.1 Suma y resta; 1.1.2 Multiplicación y división"
              rows={2}
              className={`${inputClass} text-xs`}
            />

            <div className="flex flex-col gap-1.5">
              {subtema.ejercicios.map((ejercicio, eIndex) => (
                <div key={eIndex} className="flex items-center gap-2">
                  <LinkIcon size={13} className="text-muted shrink-0" />
                  <input
                    value={ejercicio.titulo}
                    onChange={(e) => actualizarEjercicio(sIndex, eIndex, "titulo", e.target.value)}
                    placeholder="Nombre del botón (ej. Ejercicios 1-10)"
                    className={`${inputClass} w-48 py-1.5`}
                  />
                  <input
                    value={ejercicio.url}
                    onChange={(e) => actualizarEjercicio(sIndex, eIndex, "url", e.target.value)}
                    placeholder="https://..."
                    className={`${inputClass} flex-1 py-1.5`}
                  />
                  <button
                    type="button"
                    onClick={() => eliminarEjercicio(sIndex, eIndex)}
                    aria-label="Eliminar ejercicio"
                    className="text-muted shrink-0 rounded-full p-1 hover:text-jom-ink"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => agregarEjercicio(sIndex)}
                className="text-muted w-fit text-xs underline underline-offset-2 hover:text-fg"
              >
                + Botón a ejercicios
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              {subtema.videos.map((video, vIndex) => (
                <div key={vIndex} className="flex items-center gap-2">
                  <Film size={13} className="text-muted shrink-0" />
                  <input
                    value={video.titulo}
                    onChange={(e) => actualizarVideo(sIndex, vIndex, "titulo", e.target.value)}
                    placeholder="Título del video (opcional)"
                    className={`${inputClass} w-48 py-1.5`}
                  />
                  <input
                    value={video.youtube_url}
                    onChange={(e) => actualizarVideo(sIndex, vIndex, "youtube_url", e.target.value)}
                    placeholder="Link de YouTube"
                    className={`${inputClass} flex-1 py-1.5`}
                  />
                  <button
                    type="button"
                    onClick={() => eliminarVideo(sIndex, vIndex)}
                    aria-label="Eliminar video"
                    className="text-muted shrink-0 rounded-full p-1 hover:text-jom-ink"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => agregarVideo(sIndex)}
                className="text-muted w-fit text-xs underline underline-offset-2 hover:text-fg"
              >
                + Video de YouTube
              </button>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-500">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      <button
        type="button"
        onClick={guardar}
        disabled={guardando}
        className="mt-2 rounded-full bg-jom-ink px-6 py-3 text-sm font-semibold text-jom-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-jom-white dark:text-jom-ink"
      >
        {guardando ? "Guardando…" : "Guardar tema"}
      </button>
    </div>
  );
}
