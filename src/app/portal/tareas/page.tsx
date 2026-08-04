import Link from "next/link";
import { Plus, Trash2, Pencil, CalendarDays, GraduationCap, Paperclip, Download, FileCheck2 } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { materiasGestionables } from "@/lib/materias-gestionables";
import type { Calificacion, Materia, Tarea, TareaArchivo, TareaEntrega, TareaEntregaArchivo, TareaIntento } from "@/types/database";
import { TAREAS_BUCKET, TAREAS_ENTREGAS_BUCKET, formatBytes } from "@/lib/storage";
import { EntregaTareaSection } from "@/components/entrega-tarea-section";
import { eliminarTarea } from "./actions";

function formatFecha(fecha: string | null) {
  if (!fecha) return null;
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function TareasPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const isDocente = profile.role === "docente";
  const isStaff = profile.role === "docente" || profile.role === "directora";

  const [{ data: materias }, { data: tareas }, { data: calificaciones }, alumnosCountResult] = await Promise.all([
    supabase.from("materias").select("*").order("nombre"),
    supabase.from("tareas").select("*").order("fecha_entrega", { ascending: true, nullsFirst: false }),
    // RLS ya filtra: el alumno solo ve las suyas, docente/directora ven todas.
    supabase.from("calificaciones").select("*").not("tarea_id", "is", null),
    isStaff
      ? supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "alumno")
      : Promise.resolve({ count: 0 }),
  ]);

  const materiasList = isDocente
    ? await materiasGestionables(supabase, profile.id)
    : ((materias ?? []) as Materia[]);
  const materiaIds = new Set(materiasList.map((m) => m.id));
  const tareasList = ((tareas ?? []) as Tarea[]).filter((t) => materiaIds.has(t.materia_id));
  const calificacionesList = (calificaciones ?? []) as Calificacion[];
  const materiaById = new Map(materiasList.map((m) => [m.id, m]));
  const totalAlumnos = alumnosCountResult.count ?? 0;

  const tareaIds = tareasList.map((t) => t.id);
  const { data: archivos } =
    tareaIds.length > 0
      ? await supabase.from("tarea_archivos").select("*").in("tarea_id", tareaIds)
      : { data: [] as TareaArchivo[] };
  const archivosList = (archivos ?? []) as TareaArchivo[];

  const signedUrlByPath = new Map<string, string>();
  if (archivosList.length > 0) {
    const { data: signedUrls } = await supabase.storage
      .from(TAREAS_BUCKET)
      .createSignedUrls(
        archivosList.map((a) => a.storage_path),
        3600
      );
    for (const s of signedUrls ?? []) {
      if (s.signedUrl) signedUrlByPath.set(s.path ?? "", s.signedUrl);
    }
  }

  const archivosPorTarea = new Map<string, TareaArchivo[]>();
  for (const archivo of archivosList) {
    const list = archivosPorTarea.get(archivo.tarea_id) ?? [];
    list.push(archivo);
    archivosPorTarea.set(archivo.tarea_id, list);
  }

  const calificacionPropiaPorTarea = new Map<string, Calificacion>();
  const calificadosPorTarea = new Map<string, Set<string>>();
  for (const cal of calificacionesList) {
    if (!cal.tarea_id) continue;
    if (!isStaff) {
      calificacionPropiaPorTarea.set(cal.tarea_id, cal);
    } else {
      const set = calificadosPorTarea.get(cal.tarea_id) ?? new Set<string>();
      set.add(cal.alumno_id);
      calificadosPorTarea.set(cal.tarea_id, set);
    }
  }

  // tarea_preguntas es de solo-lectura para staff (evita filtrar la
  // respuesta correcta a los alumnos); un alumno solo necesita saber si
  // existen preguntas para esa tarea, así que se consulta con el cliente
  // admin (nunca se exponen enunciados/opciones al cliente en esta página).
  const tareaIdsConPreguntas = new Set<string>();
  const entregaPorTarea = new Map<string, TareaEntrega>();
  const archivosEntregaPorEntrega = new Map<string, { id: string; nombre_archivo: string; tamano_bytes: number | null; url: string | null }[]>();
  const intentoPorTarea = new Map<string, TareaIntento>();

  if (!isStaff && tareaIds.length > 0) {
    const admin = createAdminClient();
    const [{ data: preguntasTareaIds }, { data: misEntregas }, { data: misIntentos }] = await Promise.all([
      admin.from("tarea_preguntas").select("tarea_id").in("tarea_id", tareaIds),
      supabase.from("tarea_entregas").select("*").eq("alumno_id", profile.id),
      supabase.from("tarea_intentos").select("*").eq("alumno_id", profile.id),
    ]);
    for (const p of preguntasTareaIds ?? []) tareaIdsConPreguntas.add(p.tarea_id as string);
    for (const e of (misEntregas ?? []) as TareaEntrega[]) entregaPorTarea.set(e.tarea_id, e);
    for (const i of (misIntentos ?? []) as TareaIntento[]) intentoPorTarea.set(i.tarea_id, i);

    const entregaIds = [...entregaPorTarea.values()].map((e) => e.id);
    if (entregaIds.length > 0) {
      const { data: misArchivos } = await supabase
        .from("tarea_entrega_archivos")
        .select("*")
        .in("entrega_id", entregaIds);
      const misArchivosList = (misArchivos ?? []) as TareaEntregaArchivo[];
      const signedUrlEntregaByPath = new Map<string, string>();
      if (misArchivosList.length > 0) {
        const { data: signedUrls } = await supabase.storage
          .from(TAREAS_ENTREGAS_BUCKET)
          .createSignedUrls(
            misArchivosList.map((a) => a.storage_path),
            3600
          );
        for (const s of signedUrls ?? []) {
          if (s.signedUrl) signedUrlEntregaByPath.set(s.path ?? "", s.signedUrl);
        }
      }
      for (const a of misArchivosList) {
        const list = archivosEntregaPorEntrega.get(a.entrega_id) ?? [];
        list.push({
          id: a.id,
          nombre_archivo: a.nombre_archivo,
          tamano_bytes: a.tamano_bytes,
          url: signedUrlEntregaByPath.get(a.storage_path) ?? null,
        });
        archivosEntregaPorEntrega.set(a.entrega_id, list);
      }
    }
  }

  const entregasPorTarea = new Map<string, number>();
  if (isStaff && tareaIds.length > 0) {
    const { data: entregasTodas } = await supabase.from("tarea_entregas").select("tarea_id").in("tarea_id", tareaIds);
    for (const e of entregasTodas ?? []) {
      entregasPorTarea.set(e.tarea_id, (entregasPorTarea.get(e.tarea_id) ?? 0) + 1);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Tareas</h1>
          <p className="text-muted text-sm">Química, Física y Matemáticas</p>
        </div>
        {isDocente && (
          <Link
            href="/portal/tareas/nueva"
            className="inline-flex items-center gap-1.5 rounded-full bg-jom-ink px-4 py-2.5 text-sm font-semibold text-jom-white transition-opacity hover:opacity-90 dark:bg-jom-white dark:text-jom-ink"
          >
            <Plus size={15} /> Nueva tarea
          </Link>
        )}
      </div>

      {tareasList.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center text-sm text-muted">
          {isDocente ? "Aún no has creado tareas." : "Todavía no hay tareas asignadas."}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {tareasList.map((tarea) => {
            const materia = materiaById.get(tarea.materia_id);
            const fecha = formatFecha(tarea.fecha_entrega);
            const calificacionPropia = calificacionPropiaPorTarea.get(tarea.id);
            const numCalificados = calificadosPorTarea.get(tarea.id)?.size ?? 0;
            const tareaArchivos = archivosPorTarea.get(tarea.id) ?? [];

            return (
              <div key={tarea.id} id={`tarea-${tarea.id}`} className="glass flex flex-col gap-3 rounded-2xl p-5 scroll-mt-24">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="inline-block rounded-full bg-jom-yellow/40 px-2.5 py-0.5 text-xs font-medium text-jom-ink">
                      {materia?.nombre ?? "Materia"}
                    </span>
                    <h2 className="mt-2 font-semibold">{tarea.titulo}</h2>
                  </div>
                  {isDocente && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Link
                        href={`/portal/tareas/${tarea.id}/editar`}
                        aria-label="Editar tarea"
                        className="text-muted rounded-full p-1.5 transition-colors hover:bg-black/5 hover:text-fg dark:hover:bg-white/10"
                      >
                        <Pencil size={15} />
                      </Link>
                      <form action={eliminarTarea.bind(null, tarea.id)}>
                        <button
                          type="submit"
                          aria-label="Eliminar tarea"
                          className="text-muted rounded-full p-1.5 transition-colors hover:bg-jom-pink/30 hover:text-jom-ink"
                        >
                          <Trash2 size={15} />
                        </button>
                      </form>
                    </div>
                  )}
                </div>
                {tarea.descripcion && (
                  <div
                    className="rich-content whitespace-pre-line text-sm text-fg/80"
                    dangerouslySetInnerHTML={{ __html: tarea.descripcion }}
                  />
                )}
                {fecha && (
                  <div className="text-muted flex items-center gap-1.5 text-xs">
                    <CalendarDays size={13} /> Entrega: {fecha}
                  </div>
                )}

                {tareaArchivos.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    {tareaArchivos.map((archivo) => {
                      const url = signedUrlByPath.get(archivo.storage_path);
                      return (
                        <a
                          key={archivo.id}
                          href={url ?? "#"}
                          download={archivo.nombre_archivo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="glass flex items-center gap-2 rounded-xl px-3 py-2 text-xs transition-opacity hover:opacity-80"
                        >
                          <Paperclip size={13} className="text-muted shrink-0" />
                          <span className="flex-1 truncate">{archivo.nombre_archivo}</span>
                          {archivo.tamano_bytes && (
                            <span className="text-muted shrink-0">{formatBytes(archivo.tamano_bytes)}</span>
                          )}
                          <Download size={13} className="text-muted shrink-0" />
                        </a>
                      );
                    })}
                  </div>
                )}

                <div className="mt-1 flex items-center justify-between">
                  {!isStaff && (
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                        calificacionPropia
                          ? "bg-jom-pink/30 text-jom-ink dark:text-jom-white"
                          : "bg-black/5 text-muted dark:bg-white/10"
                      }`}
                    >
                      <GraduationCap size={13} />
                      {calificacionPropia
                        ? `Calificación: ${calificacionPropia.calificacion ?? "—"}`
                        : "Sin calificar"}
                    </span>
                  )}
                  {isStaff && (
                    <span className="text-muted text-xs">
                      {numCalificados}/{totalAlumnos} alumnos calificados
                    </span>
                  )}
                  {isDocente && (
                    <Link
                      href={`/portal/calificaciones/nueva?tarea_id=${tarea.id}`}
                      className="text-xs font-medium underline underline-offset-2 hover:text-jom-pink"
                    >
                      Calificar
                    </Link>
                  )}
                </div>

                {isStaff && (
                  <Link
                    href={`/portal/tareas/${tarea.id}/entregas`}
                    className="text-muted inline-flex w-fit items-center gap-1.5 text-xs hover:text-fg"
                  >
                    <FileCheck2 size={13} /> Ver entregas ({entregasPorTarea.get(tarea.id) ?? 0})
                  </Link>
                )}

                {!isStaff && (
                  <EntregaTareaSection
                    tareaId={tarea.id}
                    alumnoId={profile.id}
                    archivosIniciales={
                      entregaPorTarea.has(tarea.id)
                        ? (archivosEntregaPorEntrega.get(entregaPorTarea.get(tarea.id)!.id) ?? [])
                        : []
                    }
                    pideRespuestaTexto={tarea.pide_respuesta_texto}
                    respuestaTextoInicial={entregaPorTarea.get(tarea.id)?.respuesta_texto ?? ""}
                    tienePreguntas={tareaIdsConPreguntas.has(tarea.id)}
                    intentoInicial={intentoPorTarea.get(tarea.id) ?? null}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
