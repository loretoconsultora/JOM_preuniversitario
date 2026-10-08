import Link from "next/link";
import { AlertTriangle, ClipboardCheck } from "lucide-react";
import { requireCoachVocacionalODirectora } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AlumnoSelector } from "@/components/alumno-selector";
import { OrientadoQuickActions } from "@/components/orientado-quick-actions";
import type { Orientado, OrientacionSesion } from "@/types/database";

function formatFecha(fecha: string) {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function calcularStats(sesiones: OrientacionSesion[], hoy: string) {
  const agendadas = sesiones.length;
  const proximas = sesiones.filter((s) => s.estado === "pendiente" && s.fecha > hoy).length;
  const reprogramadas = sesiones.filter((s) => s.estado === "reagendada").length;
  const asistio = sesiones.filter((s) => s.estado === "asistio").length;
  const noAsistio = sesiones.filter((s) => s.estado === "no_asistio").length;
  const resueltas = agendadas - proximas;
  const porcentaje = resueltas > 0 ? Math.round((asistio / resueltas) * 100) : null;
  return { agendadas, proximas, reprogramadas, asistio, noAsistio, porcentaje };
}

type FilaAsistencia = { orientado: Orientado } & ReturnType<typeof calcularStats>;

function TablaAsistencia({ filasTabla, mostrarNombre = true }: { filasTabla: FilaAsistencia[]; mostrarNombre?: boolean }) {
  return (
    <div className="glass overflow-hidden rounded-2xl">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-black/5 text-xs uppercase text-muted dark:border-white/10">
            {mostrarNombre && <th className="px-5 py-3 font-medium">Nombre</th>}
            <th className="px-5 py-3 font-medium">Citas agendadas</th>
            <th className="px-5 py-3 font-medium">Próximas citas</th>
            <th className="px-5 py-3 font-medium">Reprogramadas</th>
            <th className="px-5 py-3 font-medium">Asistió</th>
            <th className="px-5 py-3 font-medium">No asistió</th>
            <th className="px-5 py-3 font-medium">% de asistencia</th>
          </tr>
        </thead>
        <tbody>
          {filasTabla.map((f) => (
            <tr key={f.orientado.id} className="border-b border-black/5 last:border-0 dark:border-white/5">
              {mostrarNombre && (
                <td className="px-5 py-3 font-medium">
                  <Link href={`/portal/asistencia-orientacion?alumno=${f.orientado.id}`} className="hover:underline">
                    {f.orientado.nombre}
                  </Link>
                </td>
              )}
              <td className="px-5 py-3">{f.agendadas}</td>
              <td className="px-5 py-3">{f.proximas}</td>
              <td className="px-5 py-3">{f.reprogramadas}</td>
              <td className="px-5 py-3">{f.asistio}</td>
              <td className="px-5 py-3">{f.noAsistio}</td>
              <td className="px-5 py-3 font-semibold">{f.porcentaje !== null ? `${f.porcentaje}%` : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function AsistenciaOrientacionPage({
  searchParams,
}: {
  searchParams: Promise<{ alumno?: string }>;
}) {
  const profile = await requireCoachVocacionalODirectora();
  const esCoach = profile.role === "coach_vocacional";
  const { alumno: alumnoParam } = await searchParams;
  const supabase = await createClient();

  const [{ data: orientados }, { data: sesiones }] = await Promise.all([
    supabase.from("orientados").select("*").order("nombre"),
    supabase.from("orientacion_sesiones").select("*"),
  ]);
  const orientadosList = (orientados ?? []) as Orientado[];
  const sesionesList = (sesiones ?? []) as OrientacionSesion[];
  const hoy = new Date().toISOString().slice(0, 10);

  const orientadoId = alumnoParam && orientadosList.some((o) => o.id === alumnoParam) ? alumnoParam : "";
  const orientadoSeleccionado = orientadoId ? orientadosList.find((o) => o.id === orientadoId) : null;

  const filas = orientadosList.map((o) => ({
    orientado: o,
    ...calcularStats(sesionesList.filter((s) => s.orientado_id === o.id), hoy),
  }));

  const citasPorConfirmar = orientadoId
    ? sesionesList
        .filter((s) => s.orientado_id === orientadoId && s.estado === "pendiente" && s.fecha <= hoy)
        .sort((a, b) => a.fecha.localeCompare(b.fecha))
    : [];

  const citasEfectivas = orientadoId
    ? sesionesList
        .filter((s) => s.orientado_id === orientadoId && s.estado === "asistio")
        .sort((a, b) => b.fecha.localeCompare(a.fecha))
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Asistencia</h1>
        <p className="text-muted text-sm">Control de asistencia a sesiones de orientación vocacional</p>
      </div>

      <AlumnoSelector
        alumnos={orientadosList.map((o) => ({ id: o.id, nombre: o.nombre }))}
        seleccionado={orientadoId}
        basePath="/portal/asistencia-orientacion"
      />

      {orientadosList.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center text-sm text-muted">Aún no hay casos registrados.</div>
      ) : !orientadoSeleccionado ? (
        <TablaAsistencia filasTabla={filas} />
      ) : (
        <div className="flex flex-col gap-6">
          <TablaAsistencia filasTabla={filas.filter((f) => f.orientado.id === orientadoId)} mostrarNombre={false} />

          {esCoach && citasPorConfirmar.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-jom-pink">
                <AlertTriangle size={15} /> Citas por confirmar
              </p>
              <div className="glass flex flex-col gap-3 rounded-2xl border border-jom-pink/40 p-5">
                {citasPorConfirmar.map((s) => (
                  <div key={s.id} className="flex flex-col gap-1.5 border-b border-black/5 pb-3 last:border-0 last:pb-0 dark:border-white/5">
                    <p className="text-sm font-medium">
                      Cita del {formatFecha(s.fecha)}
                      {s.hora && ` · ${s.hora.slice(0, 5)}`} — pendiente por confirmar
                    </p>
                    <OrientadoQuickActions sesionId={s.id} estadoInicial={s.estado} notaInicial={s.nota} accionable />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold">Resumen de citas efectivas</p>
            {citasEfectivas.length === 0 ? (
              <p className="text-muted text-sm">Todavía no hay citas con asistencia confirmada.</p>
            ) : (
              <div className="glass flex flex-col gap-3 rounded-2xl p-5">
                {citasEfectivas.map((s) => (
                  <div
                    key={s.id}
                    className="flex flex-col gap-1.5 border-b border-black/5 pb-3 last:border-0 last:pb-0 dark:border-white/5 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {formatFecha(s.fecha)}
                        {s.hora && ` · ${s.hora.slice(0, 5)}`}
                      </p>
                      {s.nota ? (
                        <div className="rich-content text-muted text-sm" dangerouslySetInnerHTML={{ __html: s.nota }} />
                      ) : (
                        <p className="text-muted text-xs">Sin nota</p>
                      )}
                    </div>
                    <Link
                      href={`/portal/evaluaciones-orientacion?sesion=${s.id}`}
                      className="text-muted inline-flex shrink-0 items-center gap-1.5 rounded-full bg-black/5 px-3 py-1.5 text-xs font-medium hover:bg-black/10 dark:bg-white/10"
                    >
                      <ClipboardCheck size={13} /> Abrir evaluación
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
