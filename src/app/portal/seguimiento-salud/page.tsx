import { HeartPulse } from "lucide-react";
import { requireDirectora } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { PacienteSalud } from "@/types/database";
import { medicacionLabel, asistenciaSaludLabel } from "@/lib/paciente-salud";
import { PacienteSaludForm } from "@/components/paciente-salud-form";

type PacienteDirectorio = { id: string; nombre: string; activo: boolean };

export default async function SeguimientoSaludPage() {
  await requireDirectora();
  const supabase = await createClient();

  const [{ data: pacientes }, { data: salud }] = await Promise.all([
    supabase.rpc("pacientes_directorio_salud"),
    supabase.from("paciente_salud").select("*"),
  ]);

  const pacientesList = ((pacientes ?? []) as PacienteDirectorio[]).filter((p) => p.activo);
  const saludPorPaciente = new Map(((salud ?? []) as PacienteSalud[]).map((s) => [s.paciente_id, s]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Seguimiento de salud</h1>
        <p className="text-muted text-sm">
          Medicación y asistencia de salud complementaria de cada paciente. Esta vista no incluye notas, sesiones ni
          evaluaciones clínicas.
        </p>
      </div>

      {pacientesList.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center text-sm text-muted">Aún no hay pacientes registrados.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {pacientesList.map((p) => {
            const saludData = saludPorPaciente.get(p.id) ?? null;
            const medLabel = medicacionLabel(saludData);
            const asisLabel = asistenciaSaludLabel(saludData);
            return (
              <details key={p.id} className="glass rounded-2xl p-5">
                <summary className="flex cursor-pointer items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <HeartPulse size={16} className="text-jom-pink shrink-0" />
                    <span className="text-sm font-medium">{p.nombre}</span>
                  </div>
                </summary>
                <div className="mt-3 flex flex-col gap-1">
                  {medLabel && <p className="text-sm">{medLabel}</p>}
                  {asisLabel && <p className="text-sm">{asisLabel}</p>}
                  {!medLabel && !asisLabel && <p className="text-muted text-sm">Sin información registrada.</p>}
                </div>
                <div className="mt-4 border-t border-black/5 pt-4 dark:border-white/5">
                  <PacienteSaludForm pacienteId={p.id} salud={saludData} />
                </div>
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}
