"use client";

import { AlertCircle } from "lucide-react";

export default function TareasError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="glass mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl p-8 text-center">
      <AlertCircle size={24} className="text-jom-pink" />
      <p className="font-semibold">No se pudieron cargar las tareas</p>
      <p className="text-muted text-sm">
        {error.message && !error.message.includes("Server Components render")
          ? error.message
          : "Ocurrió un error inesperado al cargar la página. Puede ser un problema pasajero de conexión."}
      </p>
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
