import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireDocente } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Materia } from "@/types/database";
import { CrearCuentaForm } from "@/components/crear-cuenta-form";
import { crearDocente } from "../actions";

export default async function NuevoDocentePage() {
  await requireDocente();
  const supabase = await createClient();
  const { data: materias } = await supabase.from("materias").select("*").order("nombre");
  const materiasList = (materias ?? []) as Materia[];

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
        <CrearCuentaForm
          accion={crearDocente}
          listaHref="/portal/docentes"
          rolLabel="docente"
          extraFields={
            materiasList.length > 0 ? (
              <div className="flex flex-col gap-1.5 text-sm">
                Materias asignadas (opcional)
                <div className="glass flex flex-col gap-1.5 rounded-xl p-3">
                  {materiasList.map((m) => (
                    <label key={m.id} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="materia_ids" value={m.id} className="h-4 w-4 rounded accent-jom-ink" />
                      {m.nombre}
                    </label>
                  ))}
                </div>
                <span className="text-muted text-xs">
                  Si eliges una o más materias, esta cuenta queda acotada solo a ellas (no podrá crear ni editar
                  contenido de otras materias). Si no eliges ninguna, la cuenta tiene acceso completo, igual que la
                  tuya.
                </span>
              </div>
            ) : undefined
          }
        />
      </div>
    </div>
  );
}
