import Link from "next/link";
import { CalendarCheck, User } from "lucide-react";
import { requireTerapeuta } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SesionQuickActions } from "@/components/sesion-quick-actions";
import { DescargarReportePDF } from "@/components/descargar-reporte-pdf";
import type { EstadoSesion, Paciente } from "@/types/database";

function AvatarPaciente({ url, size = "h-8 w-8" }: { url: string | null | undefined; size?: string }) {
  return (
    <div className={`${size} shrink-0 overflow-hidden rounded-full`}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element -- avatar subido por el alumno, no un asset estático
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="bg-jom-pink/30 flex h-full w-full items-center justify-center">
          <User size={14} className="text-jom-ink/60" />
        </div>
      )}
    </div>
  );
}

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

function Grupo({
  titulo,
  sesiones,
  hoy,
  vacio,
  avatarPorPaciente,
}: {
  titulo: string;
  sesiones: SesionConPaciente[];
  hoy: string;
  vacio: string;
  avatarPorPaciente: Map<string, string | null>;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold">{titulo}</p>
      {sesiones.length === 0 ? (
        <p className="text-muted text-sm">{vacio}</p>
      ) : (
        <div className="glass flex flex-col gap-3 rounded-2xl p-5">
          {sesiones.map((s) => (
            <div
              key={s.id}
              className="flex flex-col gap-1.5 border-b border-black/5 pb-3 last:border-0 last:pb-0 dark:border-white/5 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="flex items-center gap-2.5">
                <AvatarPaciente url={avatarPorPaciente.get(s.paciente_id)} />
                <div>
                  <Link href={`/portal/pacientes/${s.paciente_id}`} className="text-sm font-medium hover:underline">
                    {s.pacientes?.nombre ?? "Paciente"}
                  </Link>
                  <p className="text-muted text-xs">
                    {formatFecha(s.fecha)}
                    {s.hora && ` · ${s.hora.slice(0, 5)}`}
                  </p>
                </div>
              </div>
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
  );
}

export default async function AsistenciaPage({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string }>;
}) {
  const profile = await requireTerapeuta();
  const { vista: vistaParam } = await searchParams;
  const vista = vistaParam === "paciente" ? "paciente" : "calendario";
  const supabase = await createClient();

  const ahora = new Date();
  const hoy = ahora.toISOString().slice(0, 10);
  const en7dias = new Date(ahora.getTime() + 1000 * 60 * 60 * 24 * 7).toISOString().slice(0, 10);
  const hace7dias = new Date(ahora.getTime() - 1000 * 60 * 60 * 24 * 7).toISOString().slice(0, 10);
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString().slice(0, 10);
  const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0).toISOString().slice(0, 10);
  const mesTerminado = hoy === finMes;
  const mesLabelCapitalizado = (() => {
    const raw = ahora.toLocaleDateString("es-MX", { month: "long", year: "numeric" });
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  })();

  const [{ data: sesiones, error }, { data: pacientes }] = await Promise.all([
    supabase
      .from("paciente_sesiones")
      .select("id, paciente_id, fecha, hora, estado, nota, pacientes(nombre)")
      .order("fecha")
      .order("hora"),
    supabase.from("pacientes").select("*").order("nombre"),
  ]);
  if (error) throw new Error(`paciente_sesiones: ${error.message}`);

  const sesionesList = (sesiones ?? []) as unknown as SesionConPaciente[];
  const pacientesList = (pacientes ?? []) as Paciente[];

  const alumnoIds = pacientesList.map((p) => p.alumno_id).filter((id): id is string => Boolean(id));
  const { data: alumnosVinculados } =
    alumnoIds.length > 0
      ? await supabase.from("profiles").select("id, avatar_url").in("id", alumnoIds)
      : { data: [] as { id: string; avatar_url: string | null }[] };
  const avatarPorAlumno = new Map((alumnosVinculados ?? []).map((a) => [a.id, a.avatar_url]));
  const avatarPorPaciente = new Map(
    pacientesList.map((p) => [p.id, p.alumno_id ? (avatarPorAlumno.get(p.alumno_id) ?? null) : null])
  );

  // Cada sesión cuenta en un solo balde según su estado actual: una
  // completada/reprogramada/cancelada deja de contarse como programada.
  const filasMes = pacientesList.map((p) => {
    const delPacienteMes = sesionesList.filter(
      (s) => s.paciente_id === p.id && s.fecha >= inicioMes && s.fecha <= finMes
    );
    return {
      nombre: p.nombre,
      programadas: delPacienteMes.filter((s) => s.estado === "pendiente").length,
      completadas: delPacienteMes.filter((s) => s.estado === "asistio").length,
      reprogramadas: delPacienteMes.filter((s) => s.estado === "reagendada").length,
      canceladas: delPacienteMes.filter((s) => s.estado === "no_asistio").length,
    };
  });
  const totalesMes = filasMes.reduce(
    (acc, f) => ({
      programadas: acc.programadas + f.programadas,
      completadas: acc.completadas + f.completadas,
      reprogramadas: acc.reprogramadas + f.reprogramadas,
      canceladas: acc.canceladas + f.canceladas,
    }),
    { programadas: 0, completadas: 0, reprogramadas: 0, canceladas: 0 }
  );

  const tabClass = (activo: boolean) =>
    `rounded-full px-4 py-2 text-sm font-medium transition-colors ${
      activo ? "bg-jom-ink text-jom-white dark:bg-jom-white dark:text-jom-ink" : "glass hover:opacity-80"
    }`;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Asistencia</h1>
        <p className="text-muted text-sm">Agenda y control de asistencia de todos tus pacientes</p>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold">Resumen del mes ({mesLabelCapitalizado})</p>
        <div
          className="glass grid grid-cols-2 gap-3 rounded-2xl p-5 sm:grid-cols-4"
          style={{ background: "color-mix(in srgb, #b8e0c8 40%, var(--surface))" }}
        >
          <div>
            <p className="text-muted text-xs uppercase">Programadas</p>
            <p className="text-xl font-semibold">{totalesMes.programadas}</p>
          </div>
          <div>
            <p className="text-muted text-xs uppercase">Completadas</p>
            <p className="text-xl font-semibold">{totalesMes.completadas}</p>
          </div>
          <div>
            <p className="text-muted text-xs uppercase">Reprogramadas</p>
            <p className="text-xl font-semibold">{totalesMes.reprogramadas}</p>
          </div>
          <div>
            <p className="text-muted text-xs uppercase">Canceladas</p>
            <p className="text-xl font-semibold">{totalesMes.canceladas}</p>
          </div>
        </div>
      </div>

      {mesTerminado && (
        <div className="glass-strong flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-jom-yellow p-5">
          <div className="flex items-center gap-3">
            <CalendarCheck size={18} className="shrink-0 text-jom-ink dark:text-jom-yellow" />
            <p className="text-sm font-medium">Descargar reporte de sesiones por paciente de {mesLabelCapitalizado}</p>
          </div>
          <DescargarReportePDF
            terapeuta={profile.nombre_completo}
            mesLabel={mesLabelCapitalizado}
            filas={filasMes}
            totales={totalesMes}
          />
        </div>
      )}

      <div className="flex gap-1.5">
        <Link href="/portal/asistencia?vista=calendario" className={tabClass(vista === "calendario")}>
          Por calendario
        </Link>
        <Link href="/portal/asistencia?vista=paciente" className={tabClass(vista === "paciente")}>
          Por paciente
        </Link>
      </div>

      {vista === "calendario" ? (
        (() => {
          const deHoy = sesionesList.filter((s) => s.fecha === hoy);
          const proximaSemana = sesionesList.filter((s) => s.fecha > hoy && s.fecha <= en7dias);
          const semanaPasada = sesionesList
            .filter((s) => s.fecha < hoy && s.fecha >= hace7dias)
            .sort((a, b) => b.fecha.localeCompare(a.fecha));

          return (
            <>
              <Grupo
                titulo="Hoy"
                sesiones={deHoy}
                hoy={hoy}
                vacio="No hay sesiones agendadas para hoy."
                avatarPorPaciente={avatarPorPaciente}
              />
              <Grupo
                titulo="Próximos 7 días"
                sesiones={proximaSemana}
                hoy={hoy}
                vacio="No hay sesiones agendadas para los próximos 7 días."
                avatarPorPaciente={avatarPorPaciente}
              />
              <Grupo
                titulo="Últimos 7 días"
                sesiones={semanaPasada}
                hoy={hoy}
                vacio="No hay sesiones registradas en los últimos 7 días."
                avatarPorPaciente={avatarPorPaciente}
              />
            </>
          );
        })()
      ) : pacientesList.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center text-sm text-muted">Aún no tienes pacientes.</div>
      ) : (
        (() => {
          const filas = pacientesList.map((p) => {
            const delPaciente = sesionesList.filter((s) => s.paciente_id === p.id);
            return {
              paciente: p,
              programadas: delPaciente.filter(
                (s) => s.estado === "pendiente" && s.fecha >= inicioMes && s.fecha <= finMes
              ).length,
              completadas: delPaciente.filter((s) => s.estado === "asistio").length,
              reprogramadas: delPaciente.filter((s) => s.estado === "reagendada").length,
              canceladas: delPaciente.filter((s) => s.estado === "no_asistio").length,
            };
          });
          const totales = filas.reduce(
            (acc, f) => ({
              programadas: acc.programadas + f.programadas,
              completadas: acc.completadas + f.completadas,
              reprogramadas: acc.reprogramadas + f.reprogramadas,
              canceladas: acc.canceladas + f.canceladas,
            }),
            { programadas: 0, completadas: 0, reprogramadas: 0, canceladas: 0 }
          );

          return (
            <div className="glass overflow-hidden rounded-2xl">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-black/5 text-xs uppercase text-muted dark:border-white/10">
                    <th className="px-5 py-3 font-medium">Paciente</th>
                    <th className="px-5 py-3 font-medium">Programadas</th>
                    <th className="px-5 py-3 font-medium">Completadas</th>
                    <th className="px-5 py-3 font-medium">Reprogramadas</th>
                    <th className="px-5 py-3 font-medium">Canceladas</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((f) => (
                    <tr key={f.paciente.id} className="border-b border-black/5 last:border-0 dark:border-white/5">
                      <td className="px-5 py-3 font-medium">
                        <Link href={`/portal/pacientes/${f.paciente.id}`} className="flex items-center gap-2.5 hover:underline">
                          <AvatarPaciente url={avatarPorPaciente.get(f.paciente.id)} size="h-7 w-7" />
                          {f.paciente.nombre}
                        </Link>
                      </td>
                      <td className="px-5 py-3">{f.programadas}</td>
                      <td className="px-5 py-3">{f.completadas}</td>
                      <td className="px-5 py-3">{f.reprogramadas}</td>
                      <td className="px-5 py-3">{f.canceladas}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-black/10 font-semibold dark:border-white/15">
                    <td className="px-5 py-3">Total</td>
                    <td className="px-5 py-3">{totales.programadas}</td>
                    <td className="px-5 py-3">{totales.completadas}</td>
                    <td className="px-5 py-3">{totales.reprogramadas}</td>
                    <td className="px-5 py-3">{totales.canceladas}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          );
        })()
      )}
    </div>
  );
}
