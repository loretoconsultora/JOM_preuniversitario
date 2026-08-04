import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Paperclip } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { TAREAS_ENTREGAS_BUCKET, formatBytes } from "@/lib/storage";
import type {
  Materia,
  Profile,
  Tarea,
  TareaEntrega,
  TareaEntregaArchivo,
  TareaIntento,
  TareaPregunta,
} from "@/types/database";

export default async function EntregasTareaPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: tarea }, { data: alumnos }, { data: entregas }, { data: preguntas }, { data: intentos }] =
    await Promise.all([
      supabase.from("tareas").select("*").eq("id", id).single(),
      supabase.from("profiles").select("*").eq("role", "alumno").order("nombre_completo"),
      supabase.from("tarea_entregas").select("*").eq("tarea_id", id),
      supabase.from("tarea_preguntas").select("*").eq("tarea_id", id),
      supabase.from("tarea_intentos").select("*").eq("tarea_id", id),
    ]);

  if (!tarea) notFound();
  const tareaData = tarea as Tarea;
  const { data: materia } = await supabase.from("materias").select("*").eq("id", tareaData.materia_id).single();

  const alumnosList = (alumnos ?? []) as Profile[];
  const entregasList = (entregas ?? []) as TareaEntrega[];
  const entregaPorAlumno = new Map(entregasList.map((e) => [e.alumno_id, e]));
  const preguntasList = (preguntas ?? []) as TareaPregunta[];
  const intentosList = (intentos ?? []) as TareaIntento[];
  const intentoPorAlumno = new Map(intentosList.map((i) => [i.alumno_id, i]));

  const entregaIds = entregasList.map((e) => e.id);
  const { data: archivos } =
    entregaIds.length > 0
      ? await supabase.from("tarea_entrega_archivos").select("*").in("entrega_id", entregaIds)
      : { data: [] as TareaEntregaArchivo[] };
  const archivosList = (archivos ?? []) as TareaEntregaArchivo[];

  const signedUrlByPath = new Map<string, string>();
  if (archivosList.length > 0) {
    const { data: signedUrls } = await supabase.storage
      .from(TAREAS_ENTREGAS_BUCKET)
      .createSignedUrls(
        archivosList.map((a) => a.storage_path),
        3600
      );
    for (const s of signedUrls ?? []) {
      if (s.signedUrl) signedUrlByPath.set(s.path ?? "", s.signedUrl);
    }
  }

  const archivosPorEntrega = new Map<string, TareaEntregaArchivo[]>();
  for (const a of archivosList) {
    const list = archivosPorEntrega.get(a.entrega_id) ?? [];
    list.push(a);
    archivosPorEntrega.set(a.entrega_id, list);
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Link href="/portal/tareas" className="text-muted inline-flex items-center gap-1.5 text-sm hover:text-fg">
        <ArrowLeft size={14} /> Volver a tareas
      </Link>

      <div>
        <span className="inline-block rounded-full bg-jom-yellow/40 px-2.5 py-0.5 text-xs font-medium text-jom-ink">
          {(materia as Materia | null)?.nombre ?? "Materia"}
        </span>
        <h1 className="mt-2 text-2xl font-semibold">{tareaData.titulo}</h1>
        <p className="text-muted text-sm">Entregas de los alumnos</p>
      </div>

      {alumnosList.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center text-sm text-muted">Aún no hay alumnos registrados.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {alumnosList.map((alumno) => {
            const entrega = entregaPorAlumno.get(alumno.id);
            const archivosEntrega = entrega ? (archivosPorEntrega.get(entrega.id) ?? []) : [];
            const intento = intentoPorAlumno.get(alumno.id);

            if (!entrega && !intento) {
              return (
                <div key={alumno.id} className="glass flex items-center justify-between rounded-2xl p-4">
                  <span className="text-sm font-medium">{alumno.nombre_completo}</span>
                  <span className="text-muted text-xs">Sin entrega</span>
                </div>
              );
            }

            return (
              <div key={alumno.id} className="glass flex flex-col gap-3 rounded-2xl p-4">
                <p className="text-sm font-medium">{alumno.nombre_completo}</p>

                {entrega?.respuesta_texto && (
                  <div className="rounded-xl bg-black/5 px-3 py-2 text-sm dark:bg-white/5">
                    <p className="text-muted text-xs font-medium">Respuesta de texto</p>
                    <p className="whitespace-pre-line">{entrega.respuesta_texto}</p>
                  </div>
                )}

                {archivosEntrega.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <p className="text-muted text-xs font-medium">Evidencia</p>
                    {archivosEntrega.map((a) => (
                      <a
                        key={a.id}
                        href={signedUrlByPath.get(a.storage_path) ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="glass flex items-center gap-2 rounded-xl px-3 py-2 text-xs hover:opacity-80"
                      >
                        <Paperclip size={13} className="text-muted shrink-0" />
                        <span className="flex-1 truncate">{a.nombre_archivo}</span>
                        {a.tamano_bytes && <span className="text-muted shrink-0">{formatBytes(a.tamano_bytes)}</span>}
                      </a>
                    ))}
                  </div>
                )}

                {intento && preguntasList.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <p className="text-muted text-xs font-medium">Preguntas</p>
                    <p className="text-sm">
                      {intento.calificacion !== null
                        ? `Calificación: ${intento.calificacion}% (${intento.aciertos}/${intento.total} correctas)`
                        : "Pendiente de revisión manual"}
                    </p>
                    {preguntasList
                      .filter((p) => p.tipo === "abierta")
                      .map((p) => (
                        <div key={p.id} className="rounded-xl bg-black/5 px-3 py-2 text-xs dark:bg-white/5">
                          <p className="text-muted font-medium">{p.enunciado}</p>
                          <p>{String(intento.respuestas[p.id] ?? "Sin responder")}</p>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
