import Link from "next/link";
import { Plus, Trash2, Pencil, Paperclip, Download, LinkIcon, ChevronDown } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { TEMARIO_BUCKET, formatBytes } from "@/lib/storage";
import { toYoutubeEmbedUrl } from "@/lib/youtube";
import type {
  Materia,
  Subtema,
  SubtemaEjercicio,
  SubtemaVideo,
  Tema,
  TemaArchivo,
} from "@/types/database";
import { eliminarTema } from "./actions";

export default async function TemarioPage({
  searchParams,
}: {
  searchParams: Promise<{ materia?: string }>;
}) {
  try {
    const profile = await requireProfile();
    const { materia: materiaSeleccionadaParam } = await searchParams;
    const isDocente = profile.role === "docente";
    return await renderTemario(materiaSeleccionadaParam, isDocente);
  } catch (e) {
    const digest = (e as { digest?: string })?.digest;
    if (typeof digest === "string" && digest.startsWith("NEXT_")) throw e;
    const message = e instanceof Error ? e.message : String(e);
    const stack = e instanceof Error ? e.stack : undefined;
    return (
      <div className="glass mx-auto flex max-w-2xl flex-col gap-2 rounded-2xl p-6 text-left text-sm">
        <p className="font-semibold text-red-500">Error real (debug temporal):</p>
        <pre className="overflow-x-auto whitespace-pre-wrap break-words text-xs">{message}</pre>
        {stack && <pre className="text-muted overflow-x-auto whitespace-pre-wrap break-words text-[10px]">{stack}</pre>}
      </div>
    );
  }
}

async function renderTemario(materiaSeleccionadaParam: string | undefined, isDocente: boolean) {
  const supabase = await createClient();

  const { data: materias, error: eMaterias } = await supabase.from("materias").select("*").order("nombre");
  if (eMaterias) throw new Error(`materias: ${eMaterias.message}`);
  const materiasList = (materias ?? []) as Materia[];
  const materiaSeleccionada = materiaSeleccionadaParam || materiasList[0]?.id || "";

  const { data: temas, error: eTemas } = await supabase
    .from("temas")
    .select("*")
    .eq("materia_id", materiaSeleccionada)
    .order("orden");
  if (eTemas) throw new Error(`temas: ${eTemas.message}`);
  const temasList = (temas ?? []) as Tema[];
  const temaIds = temasList.map((t) => t.id);

  const [{ data: archivos, error: eArchivos }, { data: subtemas, error: eSubtemas }] =
    temaIds.length > 0
      ? await Promise.all([
          supabase.from("tema_archivos").select("*").in("tema_id", temaIds),
          supabase.from("subtemas").select("*").in("tema_id", temaIds).order("orden"),
        ])
      : [
          { data: [] as TemaArchivo[], error: null },
          { data: [] as Subtema[], error: null },
        ];
  if (eArchivos) throw new Error(`tema_archivos: ${eArchivos.message}`);
  if (eSubtemas) throw new Error(`subtemas: ${eSubtemas.message}`);

  const archivosList = (archivos ?? []) as TemaArchivo[];
  const subtemasList = (subtemas ?? []) as Subtema[];
  const subtemaIds = subtemasList.map((s) => s.id);

  const [{ data: ejercicios, error: eEjercicios }, { data: videos, error: eVideos }] =
    subtemaIds.length > 0
      ? await Promise.all([
          supabase.from("subtema_ejercicios").select("*").in("subtema_id", subtemaIds).order("orden"),
          supabase.from("subtema_videos").select("*").in("subtema_id", subtemaIds).order("orden"),
        ])
      : [
          { data: [] as SubtemaEjercicio[], error: null },
          { data: [] as SubtemaVideo[], error: null },
        ];
  if (eEjercicios) throw new Error(`subtema_ejercicios: ${eEjercicios.message}`);
  if (eVideos) throw new Error(`subtema_videos: ${eVideos.message}`);

  const ejerciciosList = (ejercicios ?? []) as SubtemaEjercicio[];
  const videosList = (videos ?? []) as SubtemaVideo[];

  const signedUrlByPath = new Map<string, string>();
  if (archivosList.length > 0) {
    const { data: signedUrls, error: eSigned } = await supabase.storage
      .from(TEMARIO_BUCKET)
      .createSignedUrls(
        archivosList.map((a) => a.storage_path),
        3600
      );
    if (eSigned) throw new Error(`signed urls: ${eSigned.message}`);
    for (const s of signedUrls ?? []) {
      if (s.signedUrl) signedUrlByPath.set(s.path ?? "", s.signedUrl);
    }
  }

  const archivosPorTema = new Map<string, TemaArchivo[]>();
  for (const a of archivosList) {
    const list = archivosPorTema.get(a.tema_id) ?? [];
    list.push(a);
    archivosPorTema.set(a.tema_id, list);
  }

  const subtemasPorTema = new Map<string, Subtema[]>();
  for (const s of subtemasList) {
    const list = subtemasPorTema.get(s.tema_id) ?? [];
    list.push(s);
    subtemasPorTema.set(s.tema_id, list);
  }

  const ejerciciosPorSubtema = new Map<string, SubtemaEjercicio[]>();
  for (const e of ejerciciosList) {
    const list = ejerciciosPorSubtema.get(e.subtema_id) ?? [];
    list.push(e);
    ejerciciosPorSubtema.set(e.subtema_id, list);
  }

  const videosPorSubtema = new Map<string, SubtemaVideo[]>();
  for (const v of videosList) {
    const list = videosPorSubtema.get(v.subtema_id) ?? [];
    list.push(v);
    videosPorSubtema.set(v.subtema_id, list);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Temario</h1>
          <p className="text-muted text-sm">Temas y subtemas por materia, con material y ejercicios</p>
        </div>
        {isDocente && (
          <Link
            href="/portal/temario/nuevo"
            className="inline-flex items-center gap-1.5 rounded-full bg-jom-ink px-4 py-2.5 text-sm font-semibold text-jom-white transition-opacity hover:opacity-90 dark:bg-jom-white dark:text-jom-ink"
          >
            <Plus size={15} /> Nuevo tema
          </Link>
        )}
      </div>

      <div className="flex gap-1.5">
        {materiasList.map((m) => (
          <Link
            key={m.id}
            href={`/portal/temario?materia=${m.id}`}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              m.id === materiaSeleccionada
                ? "bg-jom-ink text-jom-white dark:bg-jom-white dark:text-jom-ink"
                : "glass text-fg/70 hover:opacity-80"
            }`}
          >
            {m.nombre}
          </Link>
        ))}
      </div>

      {temasList.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center text-sm text-muted">
          {isDocente ? "Aún no has creado temas para esta materia." : "Todavía no hay temario disponible para esta materia."}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {temasList.map((tema) => {
            const temaArchivos = archivosPorTema.get(tema.id) ?? [];
            const temaSubtemas = subtemasPorTema.get(tema.id) ?? [];

            return (
              <details key={tema.id} className="glass group rounded-2xl p-5 open:pb-5" open>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">{tema.titulo}</h2>
                    {tema.descripcion && (
                      <p className="text-muted mt-1 whitespace-pre-line text-sm">{tema.descripcion}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {isDocente && (
                      <>
                        <Link
                          href={`/portal/temario/${tema.id}/editar`}
                          aria-label="Editar tema"
                          onClick={(e) => e.stopPropagation()}
                          className="text-muted rounded-full p-1.5 transition-colors hover:bg-black/5 hover:text-fg dark:hover:bg-white/10"
                        >
                          <Pencil size={15} />
                        </Link>
                        <form action={eliminarTema.bind(null, tema.id)}>
                          <button
                            type="submit"
                            aria-label="Eliminar tema"
                            className="text-muted rounded-full p-1.5 transition-colors hover:bg-jom-pink/30 hover:text-jom-ink"
                          >
                            <Trash2 size={15} />
                          </button>
                        </form>
                      </>
                    )}
                    <ChevronDown size={16} className="text-muted transition-transform group-open:rotate-180" />
                  </div>
                </summary>

                <div className="mt-4 flex flex-col gap-4">
                  {temaArchivos.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      {temaArchivos.map((archivo) => (
                        <a
                          key={archivo.id}
                          href={signedUrlByPath.get(archivo.storage_path) ?? "#"}
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
                      ))}
                    </div>
                  )}

                  {temaSubtemas.length === 0 ? (
                    <p className="text-muted text-sm">Este tema aún no tiene subtemas.</p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {temaSubtemas.map((subtema) => {
                        const subEjercicios = ejerciciosPorSubtema.get(subtema.id) ?? [];
                        const subVideos = videosPorSubtema.get(subtema.id) ?? [];
                        return (
                          <div key={subtema.id} className="rounded-xl bg-black/5 p-3 dark:bg-white/5">
                            <p className="text-sm font-medium">{subtema.titulo}</p>
                            {subtema.detalle && (
                              <p className="text-muted mt-1 whitespace-pre-line text-xs">{subtema.detalle}</p>
                            )}

                            {subEjercicios.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {subEjercicios.map((ej) => (
                                  <a
                                    key={ej.id}
                                    href={ej.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 rounded-full bg-jom-pink/30 px-3 py-1.5 text-xs font-medium text-jom-ink transition-opacity hover:opacity-80 dark:text-jom-white"
                                  >
                                    <LinkIcon size={12} /> {ej.titulo}
                                  </a>
                                ))}
                              </div>
                            )}

                            {subVideos.length > 0 && (
                              <div className="mt-3 flex flex-col gap-3">
                                {subVideos.map((video) => {
                                  const embed = toYoutubeEmbedUrl(video.youtube_url);
                                  if (!embed) return null;
                                  return (
                                    <div key={video.id}>
                                      {video.titulo && <p className="text-muted mb-1.5 text-xs">{video.titulo}</p>}
                                      <div className="aspect-video overflow-hidden rounded-xl">
                                        <iframe
                                          src={embed}
                                          title={video.titulo ?? subtema.titulo}
                                          allowFullScreen
                                          className="h-full w-full"
                                        />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}
