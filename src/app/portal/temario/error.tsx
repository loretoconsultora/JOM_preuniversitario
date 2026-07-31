"use client";

import { AlertCircle } from "lucide-react";

export default function TemarioError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="glass mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl p-8 text-center">
      <AlertCircle size={24} className="text-jom-pink" />
      <p className="font-semibold">No se pudo cargar el temario</p>
      <p className="text-muted text-sm">{error.message || "Ocurrió un error inesperado."}</p>
      {error.digest && <p className="text-muted text-xs">Código: {error.digest}</p>}
      <button
        type="button"
        onClick={reset}
        className="mt-2 rounded-full bg-jom-ink px-5 py-2 text-sm font-semibold text-jom-white dark:bg-jom-white dark:text-jom-ink"
      >
        Reintentar
      </button>
    </div>
  );
}
