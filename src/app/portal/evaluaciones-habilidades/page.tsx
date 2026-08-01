import Link from "next/link";
import { Sparkles } from "lucide-react";
import { requireTerapeuta } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Paciente, Habilidad, EvaluacionHabilidad, EvaluacionHabilidadCalificacion } from "@/types/database";
import { evaluacionDisponible } from "@/lib/evaluaciones-habilidades";
import { NuevaEvaluacionForm } from "@/components/nueva-evaluacion-form";
import { crearHabilidad } from "./actions";

export default async function EvaluacionesHabilidadesPage({
  searchParams,
}: {
  searchParams: Promise<{ paciente?: string }>;
}) {
  await requireTerapeuta();
  const { paciente: pacienteIdParam } = await searchParams;
  const supabase = await createClient();

  const [{ data: pacientes }, { data: habilidades }, { data: evaluaciones }] = await Promise.all([
    supabase.from("pacientes").select("*").eq("activo", true).order("nombre"),
    supabase.from("habilidades").select("*").order("nombre"),
    supabase.from("evaluaciones_habilidades").select("*").order("created_at", { ascending: false }),
  ]);

  const pacientesList = (pacientes ?? []) as Paciente[];
  const habilidadesList = (habilidades ?? []) as Habilidad[];
  const evaluacionesList = (evaluaciones ?? []) as EvaluacionHabilidad[];

  const ultimaEvalPorPaciente = new Map<string, string>();
  for (const e of evaluacionesList) {
    const actual = ultimaEvalPorPaciente.get(e.paciente_id);
    if (!actual || e.created_at > actual) ultimaEvalPorPaciente.set(e.paciente_id, e.created_at);
  }

  const pacienteSeleccionado = pacientesList.find((p) => p.id === pacienteIdParam) ?? null;
  const evaluacionesPaciente = pacienteSeleccionado
    ? evaluacionesList.filter((e) => e.paciente_id === pacienteSeleccionado.id)
    : [];

  const calificacionesPorEvaluacion = new Map<string, EvaluacionHabilidadCalificacion[]>();
  if (evaluacionesPaciente.length > 0) {
    const { data: calificaciones } = await supabase
      .from("evaluacion_habilidad_calificaciones")
      .select("*")
      .in(
        "evaluacion_id",
        evaluacionesPaciente.map((e) => e.id)
      );
    for (const c of (calificaciones ?? []) as EvaluacionHabilidadCalificacion[]) {
      const list = calificacionesPorEvaluacion.get(c.evaluacion_id) ?? [];
      list.push(c);
      calificacionesPorEvaluacion.set(c.evaluacion_id, list);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Evaluaciones de habilidades</h1>
        <p className="text-muted text-sm">Evaluación mensual por paciente, escala del 1 al 5</p>
      </div>

      <div className="glass rounded-2xl p-5">
        <p className="mb-3 text-sm font-semibold">Catálogo de habilidades</p>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {habilidadesList.length === 0 && <p className="text-muted text-xs">Aún no agregas habilidades.</p>}
          {habilidadesList.map((h) => (
            <span key={h.id} className="rounded-full bg-black/5 px-3 py-1 text-xs dark:bg-white/10">
              {h.nombre}
            </span>
          ))}
        </div>
        <form action={crearHabilidad} className="flex items-center gap-2">
          <input
            name="nombre"
            required
            placeholder="Nueva habilidad (ej. Regulación emocional)"
            className="glass flex-1 rounded-xl px-4 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-jom-pink"
          />
          <button
            type="submit"
            className="shrink-0 rounded-full bg-jom-ink px-4 py-2 text-xs font-semibold text-jom-white transition-opacity hover:opacity-90 dark:bg-jom-white dark:text-jom-ink"
          >
            Agregar
          </button>
        </form>
      </div>

      {pacientesList.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center text-sm text-muted">
          Aún no tienes pacientes activos para evaluar.
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5">
            {pacientesList.map((p) => {
              const disponible = evaluacionDisponible(p.fecha_alta, ultimaEvalPorPaciente.get(p.id) ?? null);
              const activo = p.id === pacienteSeleccionado?.id;
              return (
                <Link
                  key={p.id}
                  href={`/portal/evaluaciones-habilidades?paciente=${p.id}`}
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    activo ? "bg-jom-ink text-jom-white dark:bg-jom-white dark:text-jom-ink" : "glass hover:opacity-80"
                  }`}
                >
                  {p.nombre}
                  {disponible && <Sparkles size={12} className={activo ? "" : "text-jom-pink"} />}
                </Link>
              );
            })}
          </div>

          {!pacienteSeleccionado ? (
            <div className="glass rounded-2xl p-8 text-center text-sm text-muted">
              Selecciona un paciente para evaluar o revisar su historial.
            </div>
          ) : habilidadesList.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center text-sm text-muted">
              Agrega al menos una habilidad al catálogo para poder evaluar.
            </div>
          ) : (
            <NuevaEvaluacionForm pacienteId={pacienteSeleccionado.id} habilidades={habilidadesList} />
          )}

          {pacienteSeleccionado && evaluacionesPaciente.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold">Historial de evaluaciones</p>
              {evaluacionesPaciente.map((ev) => (
                <div key={ev.id} className="glass rounded-2xl p-5">
                  <p className="text-sm font-medium">
                    Evaluación #{ev.numero_periodo} · {new Date(ev.created_at).toLocaleDateString("es-MX")}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(calificacionesPorEvaluacion.get(ev.id) ?? []).map((c) => {
                      const habilidad = habilidadesList.find((h) => h.id === c.habilidad_id);
                      return (
                        <span key={c.id} className="bg-jom-pink/20 rounded-full px-2.5 py-1 text-xs">
                          {habilidad?.nombre ?? "Habilidad"}: {c.calificacion}/5
                        </span>
                      );
                    })}
                  </div>
                  {ev.conclusiones && (
                    <p className="text-muted mt-2 whitespace-pre-line text-xs">{ev.conclusiones}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
