import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireDocente } from "@/lib/auth";
import { crearDocente } from "../actions";

export default async function NuevoDocentePage() {
  await requireDocente();

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <Link href="/portal/docentes" className="text-muted inline-flex items-center gap-1.5 text-sm hover:text-fg">
        <ArrowLeft size={14} /> Volver a docentes
      </Link>

      <div className="glass rounded-2xl p-6 sm:p-8">
        <h1 className="mb-1 text-xl font-semibold">Nuevo docente</h1>
        <p className="text-muted mb-6 text-sm">
          Se creará su cuenta de acceso al portal con permisos completos (igual que tu cuenta). Podrás compartirle
          el correo y contraseña al terminar.
        </p>
        <form action={crearDocente} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            Nombre completo
            <input
              name="nombre_completo"
              required
              placeholder="Ej. Samanta Martínez"
              className="glass rounded-xl px-4 py-2.5 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-jom-pink"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            Correo electrónico
            <input
              type="email"
              name="email"
              required
              placeholder="docente@correo.com"
              className="glass rounded-xl px-4 py-2.5 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-jom-pink"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            Contraseña inicial
            <input
              name="password"
              placeholder="Déjalo en blanco para generar una automática"
              className="glass rounded-xl px-4 py-2.5 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-jom-pink"
            />
            <span className="text-muted text-xs">
              Mínimo 6 caracteres. El docente podrá usarla para iniciar sesión de inmediato.
            </span>
          </label>

          <button
            type="submit"
            className="mt-2 rounded-full bg-jom-ink px-6 py-3 text-sm font-semibold text-jom-white transition-opacity hover:opacity-90 dark:bg-jom-white dark:text-jom-ink"
          >
            Crear docente
          </button>
        </form>
      </div>
    </div>
  );
}
