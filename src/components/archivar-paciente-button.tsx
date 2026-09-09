"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore } from "lucide-react";
import { archivarPaciente } from "@/app/portal/pacientes/actions";

export function ArchivarPacienteButton({ id, activo }: { id: string; activo: boolean }) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function alternar() {
    setCargando(true);
    setError(null);
    try {
      const resultado = await archivarPaciente(id, !activo);
      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }
      router.refresh();
    } catch {
      setError("No se pudo completar la acción. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={alternar}
        disabled={cargando}
        className="text-muted inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium hover:bg-black/5 disabled:opacity-60 dark:hover:bg-white/10"
      >
        {activo ? <Archive size={13} /> : <ArchiveRestore size={13} />}
        {activo ? "Archivar" : "Reactivar"}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
