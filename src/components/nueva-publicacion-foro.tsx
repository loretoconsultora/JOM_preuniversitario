"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Paperclip, Link as LinkIcon, Loader2, AlertCircle, Send } from "lucide-react";
import { crearPublicacionConArchivo } from "@/lib/subir-archivo-foro";

export function NuevaPublicacionForo({ materiaId, autorId }: { materiaId: string; autorId: string }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [texto, setTexto] = useState("");
  const [adjunto, setAdjunto] = useState<"ninguno" | "link" | "archivo">("ninguno");
  const [link, setLink] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function limpiar() {
    setTexto("");
    setLink("");
    setArchivo(null);
    setAdjunto("ninguno");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function publicar() {
    setError(null);
    setEnviando(true);
    try {
      await crearPublicacionConArchivo(materiaId, autorId, {
        texto: texto.trim() || null,
        link: adjunto === "link" ? link.trim() || null : null,
        archivo: adjunto === "archivo" ? archivo : null,
      });
      limpiar();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo publicar.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="glass flex flex-col gap-3 rounded-2xl p-4">
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        rows={3}
        placeholder="Comparte tu proyecto, una idea, una pregunta…"
        className="glass rounded-xl px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-jom-pink"
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setAdjunto(adjunto === "link" ? "ninguno" : "link")}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            adjunto === "link" ? "bg-jom-ink text-jom-white dark:bg-jom-white dark:text-jom-ink" : "bg-black/5 dark:bg-white/10"
          }`}
        >
          <LinkIcon size={13} /> Agregar link
        </button>
        <button
          type="button"
          onClick={() => setAdjunto(adjunto === "archivo" ? "ninguno" : "archivo")}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            adjunto === "archivo" ? "bg-jom-ink text-jom-white dark:bg-jom-white dark:text-jom-ink" : "bg-black/5 dark:bg-white/10"
          }`}
        >
          <Paperclip size={13} /> Adjuntar archivo
        </button>
      </div>

      {adjunto === "link" && (
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://tu-proyecto.vercel.app o el link de tu video"
          className="glass rounded-xl px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-jom-pink"
        />
      )}
      {adjunto === "archivo" && (
        <input
          ref={fileInputRef}
          type="file"
          onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
          className="glass rounded-xl px-3 py-2 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-jom-ink file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-jom-white focus:outline-none focus:ring-2 focus:ring-jom-pink dark:file:bg-jom-white dark:file:text-jom-ink"
        />
      )}

      {error && (
        <p className="flex items-center gap-1 text-xs text-red-500">
          <AlertCircle size={12} /> {error}
        </p>
      )}

      <button
        type="button"
        onClick={publicar}
        disabled={enviando || (!texto.trim() && !link.trim() && !archivo)}
        className="inline-flex w-fit items-center gap-1.5 rounded-full bg-jom-ink px-4 py-2 text-sm font-semibold text-jom-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-jom-white dark:text-jom-ink"
      >
        {enviando ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        {enviando ? "Publicando…" : "Publicar"}
      </button>
    </div>
  );
}
