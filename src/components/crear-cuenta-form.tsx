"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { ActionResult } from "@/lib/action-result";

const inputClass =
  "glass rounded-xl px-4 py-2.5 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-jom-pink";

// Formulario compartido por "Nuevo alumno/docente/terapeuta": crea la cuenta
// y redirige a la lista con el correo/contraseña generados en la URL, para
// poder mostrárselos a quien lo creó. Al no depender de redirect() del lado
// del servidor, si la creación falla el mensaje real llega al formulario en
// vez de perderse en el error genérico de Next.js.
export function CrearCuentaForm({
  accion,
  listaHref,
  rolLabel,
  extraFields,
}: {
  accion: (formData: FormData) => Promise<ActionResult<{ email: string; password: string }>>;
  listaHref: string;
  rolLabel: string;
  extraFields?: ReactNode;
}) {
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    try {
      const resultado = await accion(new FormData(e.currentTarget));
      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }
      router.push(
        `${listaHref}?nuevo_correo=${encodeURIComponent(resultado.email)}&nueva_password=${encodeURIComponent(resultado.password)}`
      );
    } catch {
      setError(`No se pudo crear el ${rolLabel}. Revisa tu conexión e intenta de nuevo.`);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        Nombre completo
        <input name="nombre_completo" required placeholder="Nombre completo" className={inputClass} />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        Correo electrónico
        <input type="email" name="email" required placeholder={`${rolLabel}@correo.com`} className={inputClass} />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        Contraseña inicial
        <input name="password" placeholder="Déjalo en blanco para generar una automática" className={inputClass} />
        <span className="text-muted text-xs">
          Mínimo 6 caracteres. La persona podrá usarla para iniciar sesión de inmediato.
        </span>
      </label>

      {extraFields}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={guardando}
        className="mt-2 rounded-full bg-jom-ink px-6 py-3 text-sm font-semibold text-jom-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-jom-white dark:text-jom-ink"
      >
        {guardando ? "Creando…" : `Crear ${rolLabel}`}
      </button>
    </form>
  );
}
