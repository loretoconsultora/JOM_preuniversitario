import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireTerapeuta } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";
import { MotivosPicker } from "@/components/motivos-picker";
import { FechaAltaInput } from "@/components/fecha-alta-input";
import { crearPaciente } from "../actions";

export default async function NuevoPacientePage() {
  await requireTerapeuta();
  const supabase = await createClient();
  const { data: alumnos } = await supabase.from("profiles").select("*").eq("role", "alumno").order("nombre_completo");
  const alumnosList = (alumnos ?? []) as Profile[];

  const inputClass =
    "glass rounded-xl px-4 py-2.5 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-jom-pink";

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <Link href="/portal/pacientes" className="text-muted inline-flex items-center gap-1.5 text-sm hover:text-fg">
        <ArrowLeft size={14} /> Volver a pacientes
      </Link>

      <div className="glass rounded-2xl p-6 sm:p-8">
        <h1 className="mb-1 text-xl font-semibold">Nuevo paciente</h1>
        <p className="text-muted mb-6 text-sm">
          Se creará su ficha de acompañamiento socioemocional. Esta información es privada: solo tú puedes verla.
        </p>
        <form action={crearPaciente} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            Nombre
            <input name="nombre" required placeholder="Nombre completo" className={inputClass} />
          </label>

          {alumnosList.length > 0 && (
            <label className="flex flex-col gap-1.5 text-sm">
              Vincular a alumno existente (opcional)
              <select name="alumno_id" className={inputClass}>
                <option value="">No vincular</option>
                {alumnosList.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre_completo}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className="flex flex-col gap-1.5 text-sm">
            Motivos de referencia
            <MotivosPicker name="motivos" />
          </div>

          <div className="flex flex-col gap-1.5 text-sm">
            ¿Desde cuándo es paciente?
            <FechaAltaInput name="fecha_alta" className={inputClass} />
            <span className="text-muted text-xs">
              El botón &quot;Nuevo paciente&quot; deja el mes actual (se marcará como &quot;Nuevo paciente&quot; en el
              listado). También puedes elegir un mes anterior para pacientes que ya llevaban terapia antes de usar
              esta plataforma. A partir de aquí se cuenta el ciclo de evaluaciones mensuales.
            </span>
          </div>

          <button
            type="submit"
            className="mt-2 rounded-full bg-jom-ink px-6 py-3 text-sm font-semibold text-jom-white transition-opacity hover:opacity-90 dark:bg-jom-white dark:text-jom-ink"
          >
            Crear paciente
          </button>
        </form>
      </div>
    </div>
  );
}
