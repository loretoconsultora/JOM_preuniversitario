import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireDocente } from "@/lib/auth";
import { CrearCuentaForm } from "@/components/crear-cuenta-form";
import { crearTerapeuta } from "../actions";

export default async function NuevoTerapeutaPage() {
  await requireDocente();

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <Link href="/portal/terapeutas" className="text-muted inline-flex items-center gap-1.5 text-sm hover:text-fg">
        <ArrowLeft size={14} /> Volver a terapeutas
      </Link>

      <div className="glass rounded-2xl p-6 sm:p-8">
        <h1 className="mb-1 text-xl font-semibold">Nuevo terapeuta</h1>
        <p className="text-muted mb-6 text-sm">
          Se creará su cuenta de acceso al portal con el módulo de acompañamiento socioemocional (pacientes,
          asistencia y evaluaciones). Podrás compartirle el correo y contraseña al terminar.
        </p>
        <CrearCuentaForm accion={crearTerapeuta} listaHref="/portal/terapeutas" rolLabel="terapeuta" />
      </div>
    </div>
  );
}
