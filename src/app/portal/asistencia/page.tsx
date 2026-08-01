import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { requireTerapeuta } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SesionQuickActions } from "@/components/sesion-quick-actions";
import type { EstadoSesion } from "@/types/database";

type SesionConPaciente = {
  id: string;
  paciente_id: string;
  fecha: string;
  hora: string | null;
  estado: EstadoSesion;
  nota: string | null;
  pacientes: { nombre: string } | null;
};

function formatFecha(fecha: string) {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
}

function Grupo({ titulo, sesiones, hoy }: { titulo: string; sesiones: SesionConPaciente[]; hoy: string }) {
  if (sesiones.length === 0) return null;
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold">{titulo}</p>
      <div className="glass flex flex-col gap-3 rounded-2xl p-5">
        {sesiones.map((s) => (
          <div
            key={s.id}
            className="flex flex-col gap-1.5 border-b border-black/5 pb-3 last:border-0 last:pb-0 dark:border-white/5 sm:flex-row sm:items-start sm:justify-between"
          >
            <div>
              <Link href={`/portal/pacientes/${s.paciente_id}`} className="text-sm font-medium hover:underline">
                {s.pacientes?.nombre ?? "Paciente"}
              </Link>
              <p className="text-muted text-xs">
                {formatFecha(s.fecha)}
                {s.hora && ` · ${s.hora.slice(0, 5)}`}
              </p>
            </div>
            <SesionQuickActions sesionId={s.id} estadoInicial={s.estado} notaInicial={s.nota} accionable={s.fecha <= hoy} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function AsistenciaPage() {
  await requireTerapeuta();
  const supabase = await createClient();

  const ahora = new Date();
  const hoy = ahora.toISOString().slice(0, 10);
  const en7dias = new Date(ahora.getTime() + 1000 * 60 * 60 * 24 * 7).toISOString().slice(0, 10);

  const { data: sesiones, error } = await supabase
    .from("paciente_sesiones")
    .select("id, paciente_id, fecha, hora, estado, nota, pacientes(nombre)")
    .order("fecha")
    .order("hora");
  if (error) throw new Error(`paciente_sesiones: ${error.message}`);

  const sesionesList = (sesiones ?? []) as unknown as SesionConPaciente[];

  const atrasadas = sesionesList.filter((s) => s.fecha < hoy && s.estado === "pendiente");
  const deHoy = sesionesList.filter((s) => s.fecha === hoy);
  const proximaSemana = sesionesList.filter((s) => s.fecha > hoy && s.fecha <= en7dias);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Asistencia</h1>
        <p className="text-muted text-sm">Sesiones de hoy y próxima semana de todos tus pacientes</p>
      </div>

      {atrasadas.length > 0 && (
        <div className="glass-strong flex items-start gap-3 rounded-2xl border border-jom-pink p-4 text-sm">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-jom-ink dark:text-jom-pink" />
          <span>Tienes {atrasadas.length} sesión(es) pasadas sin marcar asistencia.</span>
        </div>
      )}

      <Grupo titulo="Atrasadas" sesiones={atrasadas} hoy={hoy} />
      <Grupo titulo="Hoy" sesiones={deHoy} hoy={hoy} />
      <Grupo titulo="Próximos 7 días" sesiones={proximaSemana} hoy={hoy} />

      {atrasadas.length === 0 && deHoy.length === 0 && proximaSemana.length === 0 && (
        <div className="glass rounded-2xl p-8 text-center text-sm text-muted">
          No hay sesiones agendadas por ahora. Agenda nuevas sesiones desde la ficha de cada paciente.
        </div>
      )}
    </div>
  );
}
