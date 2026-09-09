import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireDocente } from "@/lib/auth";
import { CrearCuentaForm } from "@/components/crear-cuenta-form";
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
        <CrearCuentaForm accion={crearAlumno} listaHref="/portal/alumnos" rolLabel="alumno" />
      </div>
    </div>
  );
}
