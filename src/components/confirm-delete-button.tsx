"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import type { ActionResult } from "@/lib/action-result";

// Reemplaza al viejo patrón `<form action={accion.bind(...)}><ConfirmSubmitButton>`:
// ese patrón no mostraba nada si la acción fallaba (o, peor, mostraba el
// error genérico y sin sentido que oculta Next.js en producción). Este botón
// llama a la acción directamente, confía en que devuelve un ActionResult
// (nunca lanza) y muestra el error real si lo hay.
export function ConfirmDeleteButton({
  accion,
  mensaje,
  className,
  children,
  redirectTo,
}: {
  accion: () => Promise<ActionResult>;
  mensaje: string;
  className?: string;
  children?: ReactNode;
  /** Si se define, navega ahí al eliminar con éxito (ej. al borrar desde el detalle). Si no, solo refresca. */
  redirectTo?: string;
}) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function eliminar() {
    if (!window.confirm(mensaje)) return;
    setCargando(true);
    setError(null);
    try {
      const resultado = await accion();
      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }
      if (redirectTo) router.push(redirectTo);
      else router.refresh();
    } catch {
      setError("No se pudo completar la acción. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button type="button" onClick={eliminar} disabled={cargando} className={className}>
        {children ?? (
          <>
            <Trash2 size={13} /> Eliminar
          </>
        )}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
