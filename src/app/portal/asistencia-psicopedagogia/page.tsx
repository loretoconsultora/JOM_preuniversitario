import Link from "next/link";
import { AlertTriangle, User } from "lucide-react";
import { requirePsicopedagogia } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AlumnoSelector } from "@/components/alumno-selector";
import { PsicopedagogiaQuickActions } from "@/components/psicopedagogia-quick-actions";
import type { PsicopedagogiaCaso, PsicopedagogiaSesion } from "@/types/database";

function formatFecha(fecha: string) {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "short" });
}

function calcularStats(sesiones: PsicopedagogiaSesion[], hoy: string) {
  const agendadas = sesiones.length;
  const proximas = sesiones.filter((s) => s.estado === "pendiente" && s.fecha > hoy).length;
  const reprogramadas = sesiones.filter((s) => s.estado === "reagendada").length;
  const asistio = sesiones.filter((s) => s.estado === "asistio").length;
  const noAsistio = sesiones.filter((s) => s.estado === "no_asistio").length;
  const resueltas = agendadas - proximas;
  const porcentaje = resueltas > 0 ? Math.round((asistio / resueltas) * 100) : null;
  return { agendadas, proximas, reprogramadas, asistio, noAsistio, porcentaje };
}

type FilaAsistencia = { caso: PsicopedagogiaCaso } & ReturnType<typeof calcularStats>;

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
            <tr key={f.caso.id} className="border-b border-black/5 last:border-0 dark:border-white/5">
              {mostrarNombre && (
                <td className="px-5 py-3 font-medium">
                  <Link href={`/portal/asistencia-psicopedagogia?vista=caso&caso=${f.caso.id}`} className="hover:underline">
                    {f.caso.nombre}
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

type SesionConCaso = PsicopedagogiaSesion & { caso: PsicopedagogiaCaso | undefined };

function Grupo({
  titulo,
  sesiones,
  vacio,
  avatarPorCaso,
  hoy,
}: {
  titulo: string;
  sesiones: SesionConCaso[];
  vacio: string;
  avatarPorCaso: Map<string, string | null>;
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
                <Avatar url={s.caso ? avatarPorCaso.get(s.caso.id) : null} />
                <div>
                  <Link href={`/portal/psicopedagogia/${s.caso_id}`} className="text-sm font-medium hover:underline">
                    {s.caso?.nombre ?? "Caso"}
                  </Link>
                  <p className="text-muted text-xs">
                    {formatFecha(s.fecha)}
                    {s.hora && ` · ${s.hora.slice(0, 5)}`}
                  </p>
                </div>
              </div>
              <PsicopedagogiaQuickActions sesionId={s.id} estadoInicial={s.estado} notaInicial={s.nota} accionable={s.fecha <= hoy} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default async function AsistenciaPsicopedagogiaPage({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string; caso?: string }>;
}) {
  await requirePsicopedagogia();
  const { vista: vistaParam, caso: casoParam } = await searchParams;
  const vista = vistaParam === "caso" ? "caso" : "calendario";
  const supabase = await createClient();

  const [{ data: casos }, { data: sesiones }] = await Promise.all([
    supabase.from("psicopedagogia_casos").select("*").order("nombre"),
    supabase.from("psicopedagogia_sesiones").select("*"),
  ]);
  const casosList = (casos ?? []) as PsicopedagogiaCaso[];
  const sesionesList = (sesiones ?? []) as PsicopedagogiaSesion[];
  const casoPorId = new Map(casosList.map((c) => [c.id, c]));
  const ahora = new Date();
  const hoy = ahora.toISOString().slice(0, 10);
  const en7dias = new Date(ahora.getTime() + 1000 * 60 * 60 * 24 * 7).toISOString().slice(0, 10);
  const hace7dias = new Date(ahora.getTime() - 1000 * 60 * 60 * 24 * 7).toISOString().slice(0, 10);

  const alumnoIds = casosList.map((c) => c.alumno_id).filter((id): id is string => Boolean(id));
  const { data: alumnosVinculados } =
    alumnoIds.length > 0
      ? await supabase.from("profiles").select("id, avatar_url").in("id", alumnoIds)
      : { data: [] as { id: string; avatar_url: string | null }[] };
  const avatarPorAlumno = new Map((alumnosVinculados ?? []).map((a) => [a.id, a.avatar_url]));
  const avatarPorCaso = new Map(casosList.map((c) => [c.id, c.alumno_id ? (avatarPorAlumno.get(c.alumno_id) ?? null) : null]));

  const casoId = casoParam && casosList.some((c) => c.id === casoParam) ? casoParam : "";
  const casoSeleccionado = casoId ? casosList.find((c) => c.id === casoId) : null;

  const filas = casosList.map((c) => ({
    caso: c,
    ...calcularStats(sesionesList.filter((s) => s.caso_id === c.id), hoy),
  }));

  const citasPorConfirmar = casoId
    ? sesionesList
        .filter((s) => s.caso_id === casoId && s.estado === "pendiente" && s.fecha <= hoy)
        .sort((a, b) => a.fecha.localeCompare(b.fecha))
    : [];

  const citasEfectivas = casoId
    ? sesionesList.filter((s) => s.caso_id === casoId && s.estado === "asistio").sort((a, b) => b.fecha.localeCompare(a.fecha))
    : [];

  const tabClass = (activo: boolean) =>
    `rounded-full px-4 py-2 text-sm font-medium transition-colors ${
      activo ? "bg-jom-ink text-jom-white dark:bg-jom-white dark:text-jom-ink" : "glass hover:opacity-80"
    }`;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Asistencia</h1>
        <p className="text-muted text-sm">Control de asistencia a sesiones de psicopedagogía</p>
      </div>

      <div className="flex gap-1.5">
        <Link href="/portal/asistencia-psicopedagogia?vista=calendario" className={tabClass(vista === "calendario")}>
          Por calendario
        </Link>
        <Link href="/portal/asistencia-psicopedagogia?vista=caso" className={tabClass(vista === "caso")}>
          Por caso
        </Link>
      </div>

      {casosList.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center text-sm text-muted">Aún no hay casos registrados.</div>
      ) : vista === "calendario" ? (
        (() => {
          const conCaso = (lista: PsicopedagogiaSesion[]): SesionConCaso[] => lista.map((s) => ({ ...s, caso: casoPorId.get(s.caso_id) }));

          const deHoy = conCaso(sesionesList.filter((s) => s.fecha === hoy));
          const proximaSemana = conCaso(
            sesionesList.filter((s) => s.fecha > hoy && s.fecha <= en7dias).sort((a, b) => a.fecha.localeCompare(b.fecha))
          );
          const semanaPasada = conCaso(
            sesionesList.filter((s) => s.fecha < hoy && s.fecha >= hace7dias).sort((a, b) => b.fecha.localeCompare(a.fecha))
          );

          return (
            <>
              <Grupo titulo="Hoy" sesiones={deHoy} vacio="No hay sesiones agendadas para hoy." avatarPorCaso={avatarPorCaso} hoy={hoy} />
              <Grupo
                titulo="Próximos 7 días"
                sesiones={proximaSemana}
                vacio="No hay sesiones agendadas para los próximos 7 días."
                avatarPorCaso={avatarPorCaso}
                hoy={hoy}
              />
              <Grupo
                titulo="Últimos 7 días"
                sesiones={semanaPasada}
                vacio="No hay sesiones registradas en los últimos 7 días."
                avatarPorCaso={avatarPorCaso}
                hoy={hoy}
              />
            </>
          );
        })()
      ) : (
        <div className="flex flex-col gap-6">
          <AlumnoSelector
            alumnos={casosList.map((c) => ({ id: c.id, nombre: c.nombre }))}
            seleccionado={casoId}
            basePath="/portal/asistencia-psicopedagogia?vista=caso"
          />

          {!casoSeleccionado ? (
            <TablaAsistencia filasTabla={filas} />
          ) : (
            <div className="flex flex-col gap-6">
              <TablaAsistencia filasTabla={filas.filter((f) => f.caso.id === casoId)} mostrarNombre={false} />

              {citasPorConfirmar.length > 0 && (
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
                        <PsicopedagogiaQuickActions sesionId={s.id} estadoInicial={s.estado} notaInicial={s.nota} accionable />
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
                      <div key={s.id} className="flex flex-col gap-1.5 border-b border-black/5 pb-3 last:border-0 last:pb-0 dark:border-white/5">
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
