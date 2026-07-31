"use client";

import { useState } from "react";
import { Download, Eye, Paperclip, X } from "lucide-react";
import { formatBytes } from "@/lib/storage";

export function ArchivoPreview({
  nombre,
  url,
  tipoMime,
  tamanoBytes,
  accent,
}: {
  nombre: string;
  url: string;
  tipoMime: string | null;
  tamanoBytes: number | null;
  accent?: { background: string; border: string };
}) {
  const [open, setOpen] = useState(false);
  const esPdf = tipoMime === "application/pdf" || nombre.toLowerCase().endsWith(".pdf");

  const chipClass = `flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-opacity hover:opacity-80 ${
    accent ? "" : "glass"
  }`;
  const chipStyle = accent
    ? { background: accent.background, borderColor: accent.border, color: "var(--color-jom-ink)" }
    : undefined;

  if (!esPdf) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className={chipClass} style={chipStyle}>
        <Paperclip size={13} className="text-muted shrink-0" />
        <span className="flex-1 truncate">{nombre}</span>
        {tamanoBytes && <span className="text-muted shrink-0">{formatBytes(tamanoBytes)}</span>}
        <Download size={13} className="text-muted shrink-0" />
      </a>
    );
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`w-full text-left ${chipClass}`} style={chipStyle}>
        <Paperclip size={13} className="text-muted shrink-0" />
        <span className="flex-1 truncate">{nombre}</span>
        {tamanoBytes && <span className="text-muted shrink-0">{formatBytes(tamanoBytes)}</span>}
        <Eye size={13} className="text-muted shrink-0" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/80 p-3 sm:p-6" onClick={() => setOpen(false)}>
          <div
            className="glass mx-auto flex h-full w-full max-w-4xl flex-col overflow-hidden rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-black/10 px-4 py-3 dark:border-white/10">
              <p className="truncate text-sm font-medium">{nombre}</p>
              <div className="flex shrink-0 items-center gap-1">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Descargar"
                  className="text-muted rounded-full p-1.5 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <Download size={16} />
                </a>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Cerrar"
                  className="text-muted rounded-full p-1.5 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <iframe src={url} title={nombre} className="flex-1 bg-white" />
          </div>
        </div>
      )}
    </>
  );
}
