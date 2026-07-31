import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireDocente } from "@/lib/auth";
import { crearAlumno } from "../actions";

export default async function NuevoAlumnoPage() {
  await requireDocente();

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <Link href="/portal/alumnos" className="text-muted inline-flex items-center gap-1.5 text-sm hover:text-fg">
        <ArrowLeft size={14} /> Volver a alumnos
      </Link>

      <div className="glass rounded-2xl p-6 sm:p-8">
        <h1 className="mb-1 text-xl font-semibold">Nuevo alumno</h1>
        <p className="text-muted mb-6 text-sm">
          Se creará su cuenta de acceso al portal. Podrás compartirle el correo y contraseña al terminar.
        </p>
        <form action={crearAlumno} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            Nombre completo
            <input
              name="nombre_completo"
              required
              placeholder="Ej. Ana López"
              className="glass rounded-xl px-4 py-2.5 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-jom-pink"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            Correo electrónico
            <input
              type="email"
              name="email"
              required
              placeholder="alumno@correo.com"
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
            <span className="text-muted text-xs">Mínimo 6 caracteres. El alumno podrá usarla para iniciar sesión de inmediato.</span>
          </label>

          <button
            type="submit"
            className="mt-2 rounded-full bg-jom-ink px-6 py-3 text-sm font-semibold text-jom-white transition-opacity hover:opacity-90 dark:bg-jom-white dark:text-jom-ink"
          >
            Crear alumno
          </button>
        </form>
      </div>
    </div>
  );
}
