"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Paperclip, Link as LinkIcon, MessageCircle, Loader2, Send } from "lucide-react";
import { formatBytes } from "@/lib/storage";
import { crearComentario, eliminarComentario, eliminarPublicacion } from "@/app/portal/foro/actions";

type ComentarioVM = {
  id: string;
  autorNombre: string;
  autorAvatar: string | null;
  texto: string;
  created_at: string;
  puedeEliminar: boolean;
};

export type PublicacionVM = {
  id: string;
  autorNombre: string;
  autorAvatar: string | null;
  texto: string | null;
  link: string | null;
  archivo: { url: string | null; nombre: string; tamano: number | null } | null;
  created_at: string;
  puedeEliminar: boolean;
  comentarios: ComentarioVM[];
};

function formatFecha(iso: string) {
  return new Date(iso).toLocaleString("es-MX", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

function Avatar({ nombre, url }: { nombre: string; url: string | null }) {
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element -- avatar subido por el usuario
    <img src={url} alt={nombre} className="h-8 w-8 shrink-0 rounded-full object-cover" />
  ) : (
    <div className="bg-jom-pink/30 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-jom-ink">
      {nombre.charAt(0).toUpperCase()}
    </div>
  );
}

export function PublicacionForo({ publicacion }: { publicacion: PublicacionVM }) {
  const router = useRouter();
  const [mostrarComentarios, setMostrarComentarios] = useState(false);
  const [nuevoComentario, setNuevoComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [borrando, setBorrando] = useState(false);

  async function publicarComentario() {
    if (!nuevoComentario.trim()) return;
    setEnviando(true);
    try {
      await crearComentario(publicacion.id, nuevoComentario);
      setNuevoComentario("");
      router.refresh();
    } finally {
      setEnviando(false);
    }
  }

  async function borrarPublicacion() {
    setBorrando(true);
    try {
      await eliminarPublicacion(publicacion.id);
      router.refresh();
    } finally {
      setBorrando(false);
    }
  }

  return (
    <div className="glass flex flex-col gap-3 rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <Avatar nombre={publicacion.autorNombre} url={publicacion.autorAvatar} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">{publicacion.autorNombre}</p>
            {publicacion.puedeEliminar && (
              <button
                type="button"
                onClick={borrarPublicacion}
                disabled={borrando}
                aria-label="Eliminar publicación"
                className="text-muted shrink-0 rounded-full p-1 hover:bg-jom-pink/30 hover:text-jom-ink disabled:opacity-50"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
          <p className="text-muted text-xs">{formatFecha(publicacion.created_at)}</p>

          {publicacion.texto && <p className="mt-2 whitespace-pre-line text-sm">{publicacion.texto}</p>}

          {publicacion.link && (
            <a
              href={publicacion.link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center gap-1.5 truncate text-sm text-jom-pink hover:underline"
            >
              <LinkIcon size={13} className="shrink-0" /> {publicacion.link}
            </a>
          )}

          {publicacion.archivo && (
            <a
              href={publicacion.archivo.url ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="glass mt-2 flex w-fit items-center gap-2 rounded-xl px-3 py-2 text-xs hover:opacity-80"
            >
              <Paperclip size={13} className="text-muted shrink-0" />
              {publicacion.archivo.nombre}
              {publicacion.archivo.tamano && (
                <span className="text-muted">{formatBytes(publicacion.archivo.tamano)}</span>
              )}
            </a>
          )}

          <button
            type="button"
            onClick={() => setMostrarComentarios((v) => !v)}
            className="text-muted mt-3 inline-flex items-center gap-1.5 text-xs hover:text-fg"
          >
            <MessageCircle size={13} />
            {publicacion.comentarios.length > 0
              ? `${publicacion.comentarios.length} comentario${publicacion.comentarios.length === 1 ? "" : "s"}`
              : "Comentar"}
          </button>
        </div>
      </div>

      {mostrarComentarios && (
        <div className="ml-11 flex flex-col gap-2 border-t border-black/5 pt-3 dark:border-white/5">
          {publicacion.comentarios.map((c) => (
            <ComentarioItem key={c.id} comentario={c} />
          ))}

          <div className="mt-1 flex items-center gap-2">
            <input
              value={nuevoComentario}
              onChange={(e) => setNuevoComentario(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") publicarComentario();
              }}
              placeholder="Escribe un comentario…"
              className="glass flex-1 rounded-full px-3 py-1.5 text-xs placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-jom-pink"
            />
            <button
              type="button"
              onClick={publicarComentario}
              disabled={enviando || !nuevoComentario.trim()}
              aria-label="Enviar comentario"
              className="shrink-0 rounded-full bg-jom-ink p-2 text-jom-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-jom-white dark:text-jom-ink"
            >
              {enviando ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ComentarioItem({ comentario }: { comentario: ComentarioVM }) {
  const router = useRouter();
  const [borrando, setBorrando] = useState(false);

  async function borrar() {
    setBorrando(true);
    try {
      await eliminarComentario(comentario.id);
      router.refresh();
    } finally {
      setBorrando(false);
    }
  }

  return (
    <div className="flex items-start gap-2">
      <Avatar nombre={comentario.autorNombre} url={comentario.autorAvatar} />
      <div className="bg-black/5 min-w-0 flex-1 rounded-xl px-3 py-2 dark:bg-white/5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold">{comentario.autorNombre}</p>
          {comentario.puedeEliminar && (
            <button
              type="button"
              onClick={borrar}
              disabled={borrando}
              aria-label="Eliminar comentario"
              className="text-muted shrink-0 hover:text-jom-ink disabled:opacity-50"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
        <p className="text-sm">{comentario.texto}</p>
        <p className="text-muted text-[11px]">{formatFecha(comentario.created_at)}</p>
      </div>
    </div>
  );
}
