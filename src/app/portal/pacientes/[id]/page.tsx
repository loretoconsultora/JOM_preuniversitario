import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Archive, ArchiveRestore, Sparkles } from "lucide-react";
import { requireTerapeuta } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Paciente, PacienteSesion, Profile } from "@/types/database";
import { evaluacionDisponible } from "@/lib/evaluaciones-habilidades";
import { NuevoAgendamientoForm } from "@/components/nuevo-agendamiento-form";
import { SesionQuickActions } from "@/components/sesion-quick-actions";
import { actualizarPaciente, archivarPaciente } from "../actions";

function formatFecha(fecha: string) {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default async function PacienteDetallePage({ params }: { params: Promise<{ id: string }> }) {
  await requireTerapeuta();
  const { id } = await params;
  const supabase = await createClient();

  const { data: paciente } = await supabase.from("pacientes").select("*").eq("id", id).single();
  if (!paciente) notFound();
  const pacienteData = paciente as Paciente;

  const [{ data: sesiones }, { data: evaluaciones }, { data: alumnoVinculado }] = await Promise.all([
    supabase.from("paciente_sesiones").select("*").eq("paciente_id", id).order("fecha", { ascending: false }),
    supabase.from("evaluaciones_habilidades").select("id, created_at").eq("paciente_id", id).order("created_at", { ascending: false }),
    pacienteData.alumno_id
      ? supabase.from("profiles").select("*").eq("id", pacienteData.alumno_id).single()
      : Promise.resolve({ data: null }),
  ]);

  const sesionesList = (sesiones ?? []) as PacienteSesion[];
  const hoy = new Date().toISOString().slice(0, 10);
  const proximas = sesionesList.filter((s) => s.fecha >= hoy).sort((a, b) => a.fecha.localeCompare(b.fecha));
  const historial = sesionesList.filter((s) => s.fecha < hoy);
  const ultimaEvaluacion = evaluaciones?.[0]?.created_at ?? null;
  const disponible = evaluacionDisponible(pacienteData.fecha_alta, ultimaEvaluacion);

  const inputClass =
    "glass rounded-xl px-4 py-2.5 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-jom-pink";

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link href="/portal/pacientes" className="text-muted inline-flex w-fit items-center gap-1.5 text-sm hover:text-fg">
        <ArrowLeft size={14} /> Volver a pacientes
      </Link>

      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{pacienteData.nombre}</h1>
          <p className="text-muted text-sm">
            Alta {formatFecha(pacienteData.fecha_alta)}
            {(alumnoVinculado as Profile | null) && ` · Vinculado a ${(alumnoVinculado as Profile).nombre_completo}`}
            {!pacienteData.activo && " · Archivado"}
          </p>
        </div>
        <form action={archivarPaciente.bind(null, id, !pacienteData.activo)}>
          <button
            type="submit"
            className="text-muted inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/10"
          >
            {pacienteData.activo ? <Archive size={13} /> : <ArchiveRestore size={13} />}
            {pacienteData.activo ? "Archivar" : "Reactivar"}
          </button>
        </form>
      </div>

      {disponible && (
        <Link
          href={`/portal/evaluaciones-habilidades?paciente=${id}`}
          className="glass-strong flex items-center gap-3 rounded-2xl border border-jom-yellow p-4 text-sm transition-opacity hover:opacity-90"
        >
          <Sparkles size={16} className="shrink-0 text-jom-ink dark:text-jom-yellow" />
          <span>Toca una nueva evaluación mensual de habilidades para {pacienteData.nombre}.</span>
        </Link>
      )}

      <div className="glass rounded-2xl p-5">
        <p className="mb-3 text-sm font-semibold">Ficha</p>
        <form action={actualizarPaciente.bind(null, id)} className="flex flex-col gap-3">
          <input type="hidden" name="nombre" value={pacienteData.nombre} />
          <label className="flex flex-col gap-1.5 text-xs">
            Motivo de referencia
            <textarea
              name="motivo_referencia"
              rows={2}
              defaultValue={pacienteData.motivo_referencia ?? ""}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs">
            Nota
            <textarea name="nota" rows={3} defaultValue={pacienteData.nota ?? ""} className={inputClass} />
          </label>
          <button
            type="submit"
            className="w-fit rounded-full bg-jom-ink px-4 py-2 text-xs font-semibold text-jom-white transition-opacity hover:opacity-90 dark:bg-jom-white dark:text-jom-ink"
          >
            Guardar cambios
          </button>
        </form>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Próximas sesiones</p>
          <NuevoAgendamientoForm pacienteId={id} />
        </div>
        {proximas.length === 0 ? (
          <p className="text-muted text-sm">No hay sesiones agendadas.</p>
        ) : (
          <div className="glass flex flex-col gap-3 rounded-2xl p-5">
            {proximas.map((s) => (
              <div key={s.id} className="flex flex-col gap-1.5 border-b border-black/5 pb-3 last:border-0 last:pb-0 dark:border-white/5 sm:flex-row sm:items-start sm:justify-between">
                <span className="text-sm font-medium">
                  {formatFecha(s.fecha)}
                  {s.hora && ` · ${s.hora.slice(0, 5)}`}
                </span>
                <SesionQuickActions
                  sesionId={s.id}
                  estadoInicial={s.estado}
                  notaInicial={s.nota}
                  accionable={s.fecha <= hoy}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold">Historial</p>
        {historial.length === 0 ? (
          <p className="text-muted text-sm">Todavía no hay sesiones pasadas.</p>
        ) : (
          <div className="glass flex flex-col gap-3 rounded-2xl p-5">
            {historial.map((s) => (
              <div key={s.id} className="flex flex-col gap-1.5 border-b border-black/5 pb-3 last:border-0 last:pb-0 dark:border-white/5 sm:flex-row sm:items-start sm:justify-between">
                <span className="text-sm font-medium">
                  {formatFecha(s.fecha)}
                  {s.hora && ` · ${s.hora.slice(0, 5)}`}
                </span>
                <SesionQuickActions
                  sesionId={s.id}
                  estadoInicial={s.estado}
                  notaInicial={s.nota}
                  accionable={s.fecha <= hoy}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
