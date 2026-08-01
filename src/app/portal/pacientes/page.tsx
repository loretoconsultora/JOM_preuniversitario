import Link from "next/link";
import { Plus, ChevronRight, Sparkles } from "lucide-react";
import { requireTerapeuta } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Paciente } from "@/types/database";
import { evaluacionDisponible } from "@/lib/evaluaciones-habilidades";

export default async function PacientesPage() {
  await requireTerapeuta();
  const supabase = await createClient();

  const [{ data: pacientes }, { data: evaluaciones }] = await Promise.all([
    supabase.from("pacientes").select("*").order("nombre"),
    supabase.from("evaluaciones_habilidades").select("paciente_id, created_at"),
  ]);

  const pacientesList = (pacientes ?? []) as Paciente[];
  const evaluacionesList = (evaluaciones ?? []) as { paciente_id: string; created_at: string }[];

  const ultimaEvalPorPaciente = new Map<string, string>();
  for (const e of evaluacionesList) {
    const actual = ultimaEvalPorPaciente.get(e.paciente_id);
    if (!actual || e.created_at > actual) ultimaEvalPorPaciente.set(e.paciente_id, e.created_at);
  }

  const activos = pacientesList.filter((p) => p.activo);
  const inactivos = pacientesList.filter((p) => !p.activo);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Pacientes</h1>
          <p className="text-muted text-sm">{activos.length} pacientes activos</p>
        </div>
        <Link
          href="/portal/pacientes/nuevo"
          className="inline-flex items-center gap-1.5 rounded-full bg-jom-ink px-4 py-2.5 text-sm font-semibold text-jom-white transition-opacity hover:opacity-90 dark:bg-jom-white dark:text-jom-ink"
        >
          <Plus size={15} /> Nuevo paciente
        </Link>
      </div>

      {activos.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center text-sm text-muted">
          Aún no has dado de alta pacientes.
        </div>
      ) : (
        <div className="glass overflow-hidden rounded-2xl">
          {activos.map((p, i) => {
            const disponible = evaluacionDisponible(p.fecha_alta, ultimaEvalPorPaciente.get(p.id) ?? null);
            return (
              <Link
                key={p.id}
                href={`/portal/pacientes/${p.id}`}
                className={`flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-black/5 dark:hover:bg-white/5 ${
                  i !== 0 ? "border-t border-black/5 dark:border-white/5" : ""
                }`}
              >
                <div className="min-w-0">
                  <span className="font-medium">{p.nombre}</span>
                  {p.motivo_referencia && (
                    <p className="text-muted mt-0.5 max-w-md truncate text-xs">{p.motivo_referencia}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {disponible && (
                    <span className="bg-jom-yellow/40 text-jom-ink inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium">
                      <Sparkles size={11} /> Evaluación disponible
                    </span>
                  )}
                  <ChevronRight size={16} className="text-muted" />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {inactivos.length > 0 && (
        <details className="glass rounded-2xl p-5">
          <summary className="text-muted cursor-pointer text-sm font-medium">
            Pacientes archivados ({inactivos.length})
          </summary>
          <div className="mt-3 flex flex-col gap-2">
            {inactivos.map((p) => (
              <Link key={p.id} href={`/portal/pacientes/${p.id}`} className="text-sm hover:underline">
                {p.nombre}
              </Link>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
