import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Archive, ArchiveRestore, Sparkles } from "lucide-react";
import { requireTerapeuta } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Paciente, PacienteNota, PacienteSesion, Profile } from "@/types/database";
import { evaluacionDisponible } from "@/lib/evaluaciones-habilidades";
import { pacienteDesdeLabel } from "@/lib/paciente-fecha";
import { contarPorEstado, emojisAlerta } from "@/lib/estado-sesion";
import { NuevoAgendamientoForm } from "@/components/nuevo-agendamiento-form";
import { SesionQuickActions } from "@/components/sesion-quick-actions";
import { MotivoChip } from "@/components/motivo-chip";
import { NotasSection } from "@/components/notas-section";
import { archivarPaciente } from "../actions";

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

  const [{ data: sesiones }, { data: evaluaciones }, { data: notas }, { data: alumnoVinculado }] = await Promise.all([
    supabase.from("paciente_sesiones").select("*").eq("paciente_id", id).order("fecha", { ascending: false }),
    supabase
      .from("evaluaciones_habilidades")
      .select("id, created_at")
      .eq("paciente_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("paciente_notas").select("*").eq("paciente_id", id).order("created_at", { ascending: false }),
    pacienteData.alumno_id
      ? supabase.from("profiles").select("*").eq("id", pacienteData.alumno_id).single()
      : Promise.resolve({ data: null }),
  ]);

  const sesionesList = (sesiones ?? []) as PacienteSesion[];
  const notasList = (notas ?? []) as PacienteNota[];
  const hoy = new Date().toISOString().slice(0, 10);
  const proximas = sesionesList.filter((s) => s.fecha >= hoy).sort((a, b) => a.fecha.localeCompare(b.fecha));
  const historial = sesionesList.filter((s) => s.fecha < hoy);
  const ultimaEvaluacion = evaluaciones?.[0]?.created_at ?? null;
  const disponible = evaluacionDisponible(pacienteData.fecha_alta, ultimaEvaluacion);
  const counts = contarPorEstado(sesionesList);
  const emojis = emojisAlerta(counts);
  const hayHistorialAsistencia = counts.completadas + counts.reprogramadas + counts.canceladas > 0;
  const proximaSesion = proximas.find((s) => s.estado === "pendiente") ?? proximas[0] ?? null;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link href="/portal/pacientes" className="text-muted inline-flex w-fit items-center gap-1.5 text-sm hover:text-fg">
        <ArrowLeft size={14} /> Volver a pacientes
      </Link>

      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            {pacienteData.nombre}
            {emojis && <span className="ml-1.5">{emojis}</span>}
          </h1>
          {(alumnoVinculado as Profile | null) && (
            <p className="text-muted text-sm">Vinculado a {(alumnoVinculado as Profile).nombre_completo}</p>
          )}
          {!pacienteData.activo && <p className="text-muted text-sm">Archivado</p>}
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

      <div className="glass flex flex-col gap-3 rounded-2xl p-5">
        <p className="text-sm font-semibold">Ficha</p>

        {pacienteData.motivos.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {pacienteData.motivos.map((m) => (
              <MotivoChip key={m} nombre={m} />
            ))}
          </div>
        )}

        {hayHistorialAsistencia && (
          <div className="flex flex-wrap gap-1.5 text-xs">
            <span className="bg-jom-yellow/40 text-jom-ink rounded-full px-2.5 py-0.5 font-medium">
              {counts.completadas} completadas
            </span>
            <span className="rounded-full bg-black/5 px-2.5 py-0.5 font-medium dark:bg-white/10">
              {counts.reprogramadas} reprogramadas
            </span>
            <span className="bg-jom-pink/30 text-jom-ink rounded-full px-2.5 py-0.5 font-medium">
              {counts.canceladas} canceladas
            </span>
          </div>
        )}

        <p className="text-muted text-sm">{pacienteDesdeLabel(pacienteData.fecha_alta, new Date())}</p>

        <p className="text-sm">
          {proximaSesion ? (
            <>
              Próxima sesión: {formatFecha(proximaSesion.fecha)}
              {proximaSesion.hora && ` · ${proximaSesion.hora.slice(0, 5)}`}
            </>
          ) : (
            <span className="text-muted">Sin próxima sesión agendada</span>
          )}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Sesiones</p>
          <NuevoAgendamientoForm pacienteId={id} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-3">
            <p className="text-muted text-xs font-medium uppercase">Próximas</p>
            {proximas.length === 0 ? (
              <p className="text-muted text-sm">No hay sesiones agendadas.</p>
            ) : (
              <div className="glass flex flex-col gap-3 rounded-2xl p-4">
                {proximas.map((s) => (
                  <div
                    key={s.id}
                    className="flex flex-col gap-1.5 border-b border-black/5 pb-3 last:border-0 last:pb-0 dark:border-white/5"
                  >
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
            <p className="text-muted text-xs font-medium uppercase">Historial</p>
            {historial.length === 0 ? (
              <p className="text-muted text-sm">Todavía no hay sesiones pasadas.</p>
            ) : (
              <div className="glass flex flex-col gap-3 rounded-2xl p-4">
                {historial.map((s) => (
                  <div
                    key={s.id}
                    className="flex flex-col gap-1.5 border-b border-black/5 pb-3 last:border-0 last:pb-0 dark:border-white/5"
                  >
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
      </div>

      <NotasSection pacienteId={id} notas={notasList} />
    </div>
  );
}
