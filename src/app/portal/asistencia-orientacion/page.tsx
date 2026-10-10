import Link from "next/link";
import { AlertTriangle, ClipboardCheck, User } from "lucide-react";
import { requireCoachVocacionalODirectora } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AlumnoSelector } from "@/components/alumno-selector";
import { OrientadoQuickActions } from "@/components/orientado-quick-actions";
import { HomoclaveLeyenda } from "@/components/homoclave-leyenda";
import { ResumenHomoclaves } from "@/components/resumen-homoclaves";
import { calcularRangoPeriodo, contarPorHomoclave, type PeriodoPreset } from "@/lib/estado-sesion";
import type { Orientado, OrientacionSesion } from "@/types/database";

function formatFecha(fecha: string) {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "short" });
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
                  <Link href={`/portal/asistencia-orientacion?vista=alumno&alumno=${f.orientado.id}`} className="hover:underline">
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

function Avatar({ url }: { url: string | null | undefined }) {
  return (
    <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full">
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

type SesionConOrientado = OrientacionSesion & { orientado: Orientado | undefined };

function Grupo({
  titulo,
  sesiones,
  vacio,
  avatarPorOrientado,
  esCoach,
  hoy,
}: {
  titulo: string;
  sesiones: SesionConOrientado[];
  vacio: string;
  avatarPorOrientado: Map<string, string | null>;
  esCoach: boolean;
  hoy: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold">{titulo}</p>
      {sesiones.length === 0 ? (
        <p className="text-muted text-sm">{vacio}</p>
      ) : (
        <div className="glass flex flex-col gap-3 rounded-2xl p-5">
          {sesiones.map((s) => (
            <div key={s.id} className="flex flex-col gap-1.5 border-b border-black/5 pb-3 last:border-0 last:pb-0 dark:border-white/5">
              <div className="flex items-center gap-2.5">
                <Avatar url={s.orientado ? avatarPorOrientado.get(s.orientado.id) : null} />
                <div>
                  <Link href={`/portal/orientados/${s.orientado_id}`} className="text-sm font-medium hover:underline">
                    {s.orientado?.nombre ?? "Caso"}
                  </Link>
                  <p className="text-muted text-xs">
                    {formatFecha(s.fecha)}
                    {s.hora && ` · ${s.hora.slice(0, 5)}`}
                  </p>
                </div>
              </div>
              {esCoach ? (
                <OrientadoQuickActions
                  sesionId={s.id}
                  estadoInicial={s.estado}
                  notaInicial={s.nota}
                  homoclaveInicial={s.homoclave}
                  accionable={s.fecha <= hoy}
                />
              ) : (
                <span className="text-muted w-fit rounded-full bg-black/5 px-2.5 py-0.5 text-xs font-medium dark:bg-white/10">{s.estado}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default async function AsistenciaOrientacionPage({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string; alumno?: string; periodo?: string }>;
}) {
  const profile = await requireCoachVocacionalODirectora();
  const esCoach = profile.role === "coach_vocacional";
  const { vista: vistaParam, alumno: alumnoParam, periodo: periodoParam } = await searchParams;
  const vista = vistaParam === "alumno" ? "alumno" : "calendario";
  const periodo: PeriodoPreset =
    periodoParam === "semana" || periodoParam === "quincena" ? periodoParam : "mes";
  const supabase = await createClient();

  const [{ data: orientados }, { data: sesiones }] = await Promise.all([
    supabase.from("orientados").select("*").order("nombre"),
    supabase.from("orientacion_sesiones").select("*"),
  ]);
  const orientadosList = (orientados ?? []) as Orientado[];
  const sesionesList = (sesiones ?? []) as OrientacionSesion[];
  const orientadoPorId = new Map(orientadosList.map((o) => [o.id, o]));
  const ahora = new Date();
  const hoy = ahora.toISOString().slice(0, 10);
  const en7dias = new Date(ahora.getTime() + 1000 * 60 * 60 * 24 * 7).toISOString().slice(0, 10);
  const hace7dias = new Date(ahora.getTime() - 1000 * 60 * 60 * 24 * 7).toISOString().slice(0, 10);

  const alumnoIds = orientadosList.map((o) => o.alumno_id).filter((id): id is string => Boolean(id));
  const { data: alumnosVinculados } =
    alumnoIds.length > 0
      ? await supabase.from("profiles").select("id, avatar_url").in("id", alumnoIds)
      : { data: [] as { id: string; avatar_url: string | null }[] };
  const avatarPorAlumno = new Map((alumnosVinculados ?? []).map((a) => [a.id, a.avatar_url]));
  const avatarPorOrientado = new Map(
    orientadosList.map((o) => [o.id, o.alumno_id ? (avatarPorAlumno.get(o.alumno_id) ?? null) : null])
  );

  const orientadoId = alumnoParam && orientadosList.some((o) => o.id === alumnoParam) ? alumnoParam : "";
  const orientadoSeleccionado = orientadoId ? orientadosList.find((o) => o.id === orientadoId) : null;

  const filas = orientadosList.map((o) => ({
    orientado: o,
    ...calcularStats(sesionesList.filter((s) => s.orientado_id === o.id), hoy),
  }));

  const rangoPeriodo = calcularRangoPeriodo(periodo, ahora);
  const filasHomoclaves = orientadosList
    .map((o) => ({
      nombre: o.nombre,
      ...contarPorHomoclave(
        sesionesList.filter((s) => s.orientado_id === o.id && s.fecha >= rangoPeriodo.inicio && s.fecha <= rangoPeriodo.fin)
      ),
    }))
    .filter((f) => f.SR + f.CNA + f.CT + f.SC > 0);
  const totalesHomoclaves = filasHomoclaves.reduce(
    (acc, f) => ({ SR: acc.SR + f.SR, CNA: acc.CNA + f.CNA, CT: acc.CT + f.CT, SC: acc.SC + f.SC }),
    { SR: 0, CNA: 0, CT: 0, SC: 0 }
  );
  const hrefParaPeriodo = (p: PeriodoPreset) => `/portal/asistencia-orientacion?vista=${vista}&periodo=${p}`;

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

  const tabClass = (activo: boolean) =>
    `rounded-full px-4 py-2 text-sm font-medium transition-colors ${
      activo ? "bg-jom-ink text-jom-white dark:bg-jom-white dark:text-jom-ink" : "glass hover:opacity-80"
    }`;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Asistencia</h1>
        <p className="text-muted text-sm">Control de asistencia a sesiones de orientación vocacional</p>
      </div>

      <HomoclaveLeyenda />

      {esCoach && (
        <ResumenHomoclaves
          profesional={profile.nombre_completo}
          periodoActual={periodo}
          periodoLabel={rangoPeriodo.label}
          hrefParaPeriodo={hrefParaPeriodo}
          filas={filasHomoclaves}
          totales={totalesHomoclaves}
        />
      )}

      <div className="flex gap-1.5">
        <Link href="/portal/asistencia-orientacion?vista=calendario" className={tabClass(vista === "calendario")}>
          Por calendario
        </Link>
        <Link href="/portal/asistencia-orientacion?vista=alumno" className={tabClass(vista === "alumno")}>
          Por alumno
        </Link>
      </div>

      {orientadosList.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center text-sm text-muted">Aún no hay casos registrados.</div>
      ) : vista === "calendario" ? (
        (() => {
          const conOrientado = (lista: OrientacionSesion[]): SesionConOrientado[] =>
            lista.map((s) => ({ ...s, orientado: orientadoPorId.get(s.orientado_id) }));

          const deHoy = conOrientado(sesionesList.filter((s) => s.fecha === hoy));
          const proximaSemana = conOrientado(
            sesionesList.filter((s) => s.fecha > hoy && s.fecha <= en7dias).sort((a, b) => a.fecha.localeCompare(b.fecha))
          );
          const semanaPasada = conOrientado(
            sesionesList.filter((s) => s.fecha < hoy && s.fecha >= hace7dias).sort((a, b) => b.fecha.localeCompare(a.fecha))
          );

          return (
            <>
              <Grupo titulo="Hoy" sesiones={deHoy} vacio="No hay sesiones agendadas para hoy." avatarPorOrientado={avatarPorOrientado} esCoach={esCoach} hoy={hoy} />
              <Grupo
                titulo="Próximos 7 días"
                sesiones={proximaSemana}
                vacio="No hay sesiones agendadas para los próximos 7 días."
                avatarPorOrientado={avatarPorOrientado}
                esCoach={esCoach}
                hoy={hoy}
              />
              <Grupo
                titulo="Últimos 7 días"
                sesiones={semanaPasada}
                vacio="No hay sesiones registradas en los últimos 7 días."
                avatarPorOrientado={avatarPorOrientado}
                esCoach={esCoach}
                hoy={hoy}
              />
            </>
          );
        })()
      ) : (
        <div className="flex flex-col gap-6">
          <AlumnoSelector
            alumnos={orientadosList.map((o) => ({ id: o.id, nombre: o.nombre }))}
            seleccionado={orientadoId}
            basePath="/portal/asistencia-orientacion?vista=alumno"
          />

          {!orientadoSeleccionado ? (
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
                        <OrientadoQuickActions
                          sesionId={s.id}
                          estadoInicial={s.estado}
                          notaInicial={s.nota}
                          homoclaveInicial={s.homoclave}
                          accionable
                        />
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
      )}
    </div>
  );
}
