import Link from "next/link";
import { Sparkles } from "lucide-react";
import { requireCoachVocacionalODirectora } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type {
  Orientado,
  OrientacionAtributo,
  OrientacionEvaluacion,
  OrientacionEvaluacionCalificacion,
  OrientacionSesion,
} from "@/types/database";
import { NuevoAtributoOrientacionForm } from "@/components/nuevo-atributo-orientacion-form";
import { AtributoOrientacionChip } from "@/components/atributo-orientacion-chip";
import { NuevaEvaluacionOrientacionForm } from "@/components/nueva-evaluacion-orientacion-form";
import { DescargarTablaPDF } from "@/components/descargar-tabla-pdf";

function formatFecha(fecha: string, hora: string | null) {
  const texto = new Date(`${fecha}T00:00:00`).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
  return hora ? `${texto} · ${hora.slice(0, 5)}` : texto;
}

export default async function EvaluacionesOrientacionPage({
  searchParams,
}: {
  searchParams: Promise<{ orientado?: string; sesion?: string }>;
}) {
  const profile = await requireCoachVocacionalODirectora();
  const esCoach = profile.role === "coach_vocacional";
  const { orientado: orientadoParam, sesion: sesionParam } = await searchParams;
  const supabase = await createClient();

  const [{ data: orientados }, { data: atributos }, { data: sesionesAsistio }, { data: evaluaciones }] = await Promise.all([
    supabase.from("orientados").select("*").order("nombre"),
    supabase.from("orientacion_atributos").select("*").order("nombre"),
    supabase.from("orientacion_sesiones").select("*").eq("estado", "asistio"),
    supabase.from("orientacion_evaluaciones").select("*"),
  ]);
  const orientadosList = (orientados ?? []) as Orientado[];
  const atributosList = (atributos ?? []) as OrientacionAtributo[];
  const sesionesAsistioList = (sesionesAsistio ?? []) as OrientacionSesion[];
  const evaluacionesList = (evaluaciones ?? []) as OrientacionEvaluacion[];
  const evaluacionPorSesion = new Map(evaluacionesList.map((e) => [e.sesion_id, e]));

  // Si llega ?sesion= sin ?orientado=, se resuelve el orientado desde ahí.
  let orientadoId = orientadoParam && orientadosList.some((o) => o.id === orientadoParam) ? orientadoParam : "";
  if (!orientadoId && sesionParam) {
    const sesion = sesionesAsistioList.find((s) => s.id === sesionParam);
    if (sesion) orientadoId = sesion.orientado_id;
  }
  const orientadoSeleccionado = orientadoId ? orientadosList.find((o) => o.id === orientadoId) : null;

  const pendientesPorOrientado = new Map<string, number>();
  for (const s of sesionesAsistioList) {
    if (!evaluacionPorSesion.has(s.id)) {
      pendientesPorOrientado.set(s.orientado_id, (pendientesPorOrientado.get(s.orientado_id) ?? 0) + 1);
    }
  }

  const sesionesDelOrientado = orientadoId
    ? sesionesAsistioList.filter((s) => s.orientado_id === orientadoId).sort((a, b) => b.fecha.localeCompare(a.fecha))
    : [];
  const sesionParaEvaluar =
    sesionParam && sesionesDelOrientado.some((s) => s.id === sesionParam && !evaluacionPorSesion.has(s.id)) ? sesionParam : "";

  const evaluacionesOrientado = orientadoId ? evaluacionesList.filter((e) => e.orientado_id === orientadoId) : [];
  const calificacionesPorEvaluacion = new Map<string, OrientacionEvaluacionCalificacion[]>();
  if (evaluacionesOrientado.length > 0) {
    const { data: calificaciones } = await supabase
      .from("orientacion_evaluacion_calificaciones")
      .select("*")
      .in(
        "evaluacion_id",
        evaluacionesOrientado.map((e) => e.id)
      );
    for (const c of (calificaciones ?? []) as OrientacionEvaluacionCalificacion[]) {
      const lista = calificacionesPorEvaluacion.get(c.evaluacion_id) ?? [];
      lista.push(c);
      calificacionesPorEvaluacion.set(c.evaluacion_id, lista);
    }
  }
  const sesionPorId = new Map(sesionesDelOrientado.map((s) => [s.id, s]));
  const evaluacionesAsc = [...evaluacionesOrientado].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const atributosEvaluados = atributosList.filter((a) =>
    evaluacionesAsc.some((ev) => (calificacionesPorEvaluacion.get(ev.id) ?? []).some((c) => c.atributo_id === a.id))
  );
  const filasComparativo = atributosEvaluados.map((a) => {
    const puntajes = evaluacionesAsc.map((ev) => {
      const c = (calificacionesPorEvaluacion.get(ev.id) ?? []).find((c) => c.atributo_id === a.id);
      return c?.calificacion ?? null;
    });
    const conDato = puntajes.filter((v): v is number => v !== null);
    const ultimo = conDato[conDato.length - 1];
    const promedio = conDato.reduce((x, y) => x + y, 0) / conDato.length;
    const tendencia = conDato.length >= 2 ? (ultimo > promedio ? "up" : ultimo < promedio ? "down" : "same") : null;
    const cambioPct = conDato.length >= 2 ? Math.round(((ultimo - promedio) / promedio) * 100) : null;
    const tendenciaLabel =
      tendencia === "up" ? `▲ +${cambioPct}%` : tendencia === "down" ? `▼ ${cambioPct}%` : tendencia === "same" ? "= 0%" : "–";
    return { atributo: a.nombre, puntajes, tendenciaLabel };
  });

  const tituloSesionParaEvaluar = sesionParaEvaluar ? sesionPorId.get(sesionParaEvaluar) : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Evaluaciones de orientación vocacional</h1>
        <p className="text-muted text-sm">
          Disponible por sesión: una vez que una cita queda &quot;asistió&quot;, podés evaluarla (es opcional, no todas
          necesitan evaluación).
        </p>
      </div>

      {esCoach && (
        <div className="glass rounded-2xl p-5" style={{ background: "color-mix(in srgb, #b8e0c8 40%, var(--surface))" }}>
          <p className="mb-3 text-sm font-semibold">Catálogo de atributos</p>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {atributosList.length === 0 && <p className="text-muted text-xs">Aún no agregas atributos.</p>}
            {atributosList.map((a) => (
              <AtributoOrientacionChip key={a.id} atributo={a} />
            ))}
          </div>
          <NuevoAtributoOrientacionForm />
        </div>
      )}

      {orientadosList.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center text-sm text-muted">Aún no hay perfiles registrados.</div>
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5">
            {orientadosList.map((o) => {
              const pendientes = pendientesPorOrientado.get(o.id) ?? 0;
              const activo = o.id === orientadoId;
              return (
                <Link
                  key={o.id}
                  href={`/portal/evaluaciones-orientacion?orientado=${o.id}`}
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    activo ? "bg-jom-ink text-jom-white dark:bg-jom-white dark:text-jom-ink" : "glass hover:opacity-80"
                  }`}
                >
                  {o.nombre}
                  {pendientes > 0 && <Sparkles size={12} className={activo ? "" : "text-jom-pink"} />}
                </Link>
              );
            })}
          </div>

          {!orientadoSeleccionado ? (
            <div className="glass rounded-2xl p-8 text-center text-sm text-muted">Selecciona un perfil para evaluar o revisar su historial.</div>
          ) : (
            <>
              {esCoach && sesionesDelOrientado.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-semibold">Sesiones con asistencia confirmada</p>
                  <div className="flex flex-wrap gap-1.5">
                    {sesionesDelOrientado.map((s) => {
                      const evaluada = evaluacionPorSesion.has(s.id);
                      const activa = s.id === sesionParaEvaluar;
                      return (
                        <Link
                          key={s.id}
                          href={`/portal/evaluaciones-orientacion?orientado=${orientadoId}&sesion=${s.id}`}
                          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                            activa
                              ? "bg-jom-ink text-jom-white dark:bg-jom-white dark:text-jom-ink"
                              : evaluada
                                ? "bg-black/5 text-muted dark:bg-white/10"
                                : "bg-jom-yellow/40 text-jom-ink hover:opacity-80"
                          }`}
                        >
                          {formatFecha(s.fecha, s.hora)} {evaluada ? "· evaluada" : "· sin evaluar"}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {esCoach && sesionParaEvaluar && tituloSesionParaEvaluar && atributosList.length > 0 && (
                <NuevaEvaluacionOrientacionForm
                  orientadoId={orientadoId}
                  orientadoNombre={orientadoSeleccionado.nombre}
                  sesionId={sesionParaEvaluar}
                  sesionFechaLabel={formatFecha(tituloSesionParaEvaluar.fecha, tituloSesionParaEvaluar.hora)}
                  coachNombre={profile.nombre_completo}
                  atributos={atributosList}
                />
              )}

              {esCoach && atributosList.length === 0 && (
                <div className="glass rounded-2xl p-8 text-center text-sm text-muted">Agrega al menos un atributo al catálogo para poder evaluar.</div>
              )}

              {evaluacionesOrientado.length > 0 && (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold">Historial de evaluaciones</p>
                    <DescargarTablaPDF
                      label="Descargar comparativo PDF"
                      titulo="Comparativo de evaluaciones de orientación vocacional"
                      meta={[
                        `Perfil: ${orientadoSeleccionado.nombre}`,
                        `Coach: ${profile.nombre_completo}`,
                        `Fecha del reporte: ${new Date().toLocaleDateString("es-MX")}`,
                      ]}
                      head={["Atributo", ...evaluacionesAsc.map((ev) => formatFecha(sesionPorId.get(ev.sesion_id)?.fecha ?? ev.created_at.slice(0, 10), null)), "Tendencia"]}
                      body={filasComparativo.map((f) => [f.atributo, ...f.puntajes.map((v) => v ?? "–"), f.tendenciaLabel])}
                      archivo={`comparativo-evaluaciones-${orientadoSeleccionado.nombre.toLowerCase().replace(/\s+/g, "-")}.pdf`}
                      className="text-muted inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/10"
                    />
                  </div>
                  <div className="glass overflow-x-auto rounded-2xl p-5">
                    <table className="w-full min-w-[420px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-black/5 text-xs uppercase text-muted dark:border-white/10">
                          <th className="py-2 pr-3 font-medium">Atributo</th>
                          {evaluacionesAsc.map((ev) => (
                            <th key={ev.id} className="px-2 py-2 text-center font-medium normal-case">
                              {formatFecha(sesionPorId.get(ev.sesion_id)?.fecha ?? ev.created_at.slice(0, 10), null)}
                            </th>
                          ))}
                          {evaluacionesAsc.length >= 2 && <th className="px-2 py-2 text-center font-medium">Tendencia</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {atributosEvaluados.map((a, i) => {
                          const f = filasComparativo[i];
                          return (
                            <tr key={a.id} className="border-b border-black/5 last:border-0 dark:border-white/5">
                              <td className="py-2 pr-3 font-medium">{a.nombre}</td>
                              {f.puntajes.map((v, j) => (
                                <td key={j} className="px-2 py-2 text-center">
                                  {v ?? <span className="text-muted">–</span>}
                                </td>
                              ))}
                              {evaluacionesAsc.length >= 2 && (
                                <td className="px-2 py-2 text-center whitespace-nowrap">
                                  {f.tendenciaLabel.startsWith("▲") && <span className="text-green-600">{f.tendenciaLabel}</span>}
                                  {f.tendenciaLabel.startsWith("▼") && <span className="text-red-500">{f.tendenciaLabel}</span>}
                                  {!f.tendenciaLabel.startsWith("▲") && !f.tendenciaLabel.startsWith("▼") && (
                                    <span className="text-muted">{f.tendenciaLabel}</span>
                                  )}
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {evaluacionesOrientado.some((ev) => ev.conclusiones) && (
                    <div className="flex flex-col gap-2">
                      {evaluacionesOrientado
                        .filter((ev) => ev.conclusiones)
                        .sort((a, b) => b.created_at.localeCompare(a.created_at))
                        .map((ev) => (
                          <div key={ev.id} className="glass rounded-2xl p-4">
                            <p className="text-muted text-xs font-medium">{formatFecha(sesionPorId.get(ev.sesion_id)?.fecha ?? ev.created_at.slice(0, 10), null)}</p>
                            <p className="mt-1 whitespace-pre-line text-sm">{ev.conclusiones}</p>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
