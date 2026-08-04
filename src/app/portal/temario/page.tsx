import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowLeft, Plus, Sparkles, Trash2, LinkIcon, ChevronDown, ClipboardList, FileQuestion } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { materiasGestionables } from "@/lib/materias-gestionables";
import { materiasInscritas } from "@/lib/materias-inscritas";
import { TEMARIO_BUCKET } from "@/lib/storage";
import { toYoutubeEmbedUrl } from "@/lib/youtube";
import type {
  Examen,
  Materia,
  Role,
  Subtema,
  SubtemaEjercicio,
  SubtemaVideo,
  Tarea,
  Tema,
  TemaArchivo,
} from "@/types/database";
import { TemaEditLink } from "@/components/tema-edit-link";
import { MateriaBannerUpload } from "@/components/materia-banner-upload";
import { ArchivoPreview } from "@/components/archivo-preview";
import { SubirMaterialModal } from "@/components/subir-material-modal";
import { eliminarTema } from "./actions";

// Los tonos se mezclan siempre con blanco (no con el fondo de la página) para
// que las tarjetas de tema/subtema se vean claras aunque el modo oscuro esté activo.
const TEMA_ACCENTS = [
  {
    borderColor: "color-mix(in srgb, var(--color-jom-pink) 45%, white)",
    background: "color-mix(in srgb, var(--color-jom-pink) 16%, white)",
    subtemaBorder: "color-mix(in srgb, var(--color-jom-pink) 28%, white)",
    subtemaBackground: "color-mix(in srgb, var(--color-jom-pink) 8%, white)",
    archivoBorder: "color-mix(in srgb, var(--color-jom-pink) 65%, white)",
    archivoBackground: "color-mix(in srgb, var(--color-jom-pink) 42%, white)",
  },
  {
    borderColor: "color-mix(in srgb, var(--color-jom-yellow) 55%, white)",
    background: "color-mix(in srgb, var(--color-jom-yellow) 24%, white)",
    subtemaBorder: "color-mix(in srgb, var(--color-jom-yellow) 40%, white)",
    subtemaBackground: "color-mix(in srgb, var(--color-jom-yellow) 13%, white)",
    archivoBorder: "color-mix(in srgb, var(--color-jom-yellow) 75%, white)",
    archivoBackground: "color-mix(in srgb, var(--color-jom-yellow) 50%, white)",
  },
] as const;

// Fuerza texto e íconos "muted" a tonos oscuros dentro de la tarjeta, sin
// importar el modo oscuro global, porque el fondo aquí siempre es claro.
const forceLightCardVars = {
  color: "var(--color-jom-ink)",
  "--muted": "var(--color-jom-gray)",
} as CSSProperties;

export default async function TemarioPage({
  searchParams,
}: {
  searchParams: Promise<{ materia?: string }>;
}) {
  const profile = await requireProfile();
  const { materia: materiaSeleccionadaParam } = await searchParams;
  const isDocente = profile.role === "docente";
  const supabase = await createClient();

  let materiasList: Materia[];
  if (isDocente) {
    materiasList = await materiasGestionables(supabase, profile.id);
  } else if (profile.role === "alumno") {
    materiasList = await materiasInscritas(supabase, profile.id);
  } else {
    const { data: materias, error: eMaterias } = await supabase.from("materias").select("*").order("nombre");
    if (eMaterias) throw new Error(`materias: ${eMaterias.message}`);
    materiasList = (materias ?? []) as Materia[];
  }

  const materiaValida = materiaSeleccionadaParam && materiasList.some((m) => m.id === materiaSeleccionadaParam);
  if (!materiaValida) {
    return renderPortada(supabase, materiasList, isDocente, profile.role, profile.id);
  }
  const materiaSeleccionada = materiaSeleccionadaParam;

  if (profile.role === "alumno") {
    await supabase
      .from("materia_vistas")
      .upsert(
        { alumno_id: profile.id, materia_id: materiaSeleccionada, last_viewed_at: new Date().toISOString() },
        { onConflict: "alumno_id,materia_id" }
      );
  }

  const { data: temas, error: eTemas } = await supabase
    .from("temas")
    .select("*")
    .eq("materia_id", materiaSeleccionada)
    .order("orden");
  if (eTemas) throw new Error(`temas: ${eTemas.message}`);
  const temasList = (temas ?? []) as Tema[];
  const temaIds = temasList.map((t) => t.id);

  const [
    { data: archivos, error: eArchivos },
    { data: subtemas, error: eSubtemas },
    { data: tareasVinculadas, error: eTareasVinc },
    { data: examenesVinculados, error: eExamenesVinc },
  ] =
    temaIds.length > 0
      ? await Promise.all([
          supabase.from("tema_archivos").select("*").in("tema_id", temaIds),
          supabase.from("subtemas").select("*").in("tema_id", temaIds).order("orden"),
          supabase.from("tareas").select("*").in("tema_id", temaIds),
          supabase.from("examenes").select("*").in("tema_id", temaIds),
        ])
      : [
          { data: [] as TemaArchivo[], error: null },
          { data: [] as Subtema[], error: null },
          { data: [] as Tarea[], error: null },
          { data: [] as Examen[], error: null },
        ];
  if (eArchivos) throw new Error(`tema_archivos: ${eArchivos.message}`);
  if (eSubtemas) throw new Error(`subtemas: ${eSubtemas.message}`);
  if (eTareasVinc) throw new Error(`tareas: ${eTareasVinc.message}`);
  if (eExamenesVinc) throw new Error(`examenes: ${eExamenesVinc.message}`);

  const archivosList = (archivos ?? []) as TemaArchivo[];
  const subtemasList = (subtemas ?? []) as Subtema[];
  const tareasVinculadasList = (tareasVinculadas ?? []) as Tarea[];
  const examenesVinculadosList = (examenesVinculados ?? []) as Examen[];
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

  const tareasPorTema = new Map<string, Tarea[]>();
  for (const t of tareasVinculadasList) {
    if (!t.tema_id) continue;
    const list = tareasPorTema.get(t.tema_id) ?? [];
    list.push(t);
    tareasPorTema.set(t.tema_id, list);
  }

  const examenesPorTema = new Map<string, Examen[]>();
  for (const ex of examenesVinculadosList) {
    if (!ex.tema_id) continue;
    const list = examenesPorTema.get(ex.tema_id) ?? [];
    list.push(ex);
    examenesPorTema.set(ex.tema_id, list);
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

  const materiaActual = materiasList.find((m) => m.id === materiaSeleccionada);

  return (
    <div className="flex flex-col gap-6">
      <Link href="/portal/temario" className="text-muted inline-flex w-fit items-center gap-1.5 text-sm hover:text-fg">
        <ArrowLeft size={14} /> Mis materias
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{materiaActual?.nombre ?? "Temario"}</h1>
          <p className="text-muted text-sm">Temas y subtemas de esta materia, con material y ejercicios</p>
        </div>
        {isDocente && (
          <div className="flex items-center gap-2">
            <SubirMaterialModal materias={materiasList} materiaInicialId={materiaSeleccionada} />
            <Link
              href="/portal/temario/importar"
              className="inline-flex items-center gap-1.5 rounded-full bg-black/5 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15"
            >
              <Sparkles size={15} /> Importar con IA
            </Link>
            <Link
              href="/portal/temario/nuevo"
              className="inline-flex items-center gap-1.5 rounded-full bg-jom-ink px-4 py-2.5 text-sm font-semibold text-jom-white transition-opacity hover:opacity-90 dark:bg-jom-white dark:text-jom-ink"
            >
              <Plus size={15} /> Nuevo tema
            </Link>
          </div>
        )}
      </div>

      {temasList.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center text-sm text-muted">
          {isDocente ? "Aún no has creado temas para esta materia." : "Todavía no hay temario disponible para esta materia."}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {temasList.map((tema, temaIndex) => {
            const temaArchivos = archivosPorTema.get(tema.id) ?? [];
            const temaSubtemas = subtemasPorTema.get(tema.id) ?? [];
            const temaTareas = tareasPorTema.get(tema.id) ?? [];
            const temaExamenes = examenesPorTema.get(tema.id) ?? [];
            const accent = TEMA_ACCENTS[temaIndex % TEMA_ACCENTS.length];

            return (
              <details
                key={tema.id}
                className="group rounded-2xl border p-5 shadow-sm open:pb-5"
                style={{
                  borderColor: accent.borderColor,
                  background: accent.background,
                  ...forceLightCardVars,
                }}
                open
              >
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
                        <TemaEditLink temaId={tema.id} />
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
                        <ArchivoPreview
                          key={archivo.id}
                          nombre={archivo.nombre_archivo}
                          url={signedUrlByPath.get(archivo.storage_path) ?? "#"}
                          tipoMime={archivo.tipo_mime}
                          tamanoBytes={archivo.tamano_bytes}
                          accent={{ background: accent.archivoBackground, border: accent.archivoBorder }}
                        />
                      ))}
                    </div>
                  )}

                  {(temaTareas.length > 0 || temaExamenes.length > 0) && (
                    <div className="flex flex-wrap gap-1.5">
                      {temaTareas.map((t) => (
                        <Link
                          key={t.id}
                          href={`/portal/tareas#tarea-${t.id}`}
                          className="inline-flex items-center gap-1.5 rounded-full bg-black/5 px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-80"
                        >
                          <ClipboardList size={12} /> {t.titulo}
                        </Link>
                      ))}
                      {temaExamenes.map((ex) => (
                        <Link
                          key={ex.id}
                          href={`/portal/examenes/${ex.id}`}
                          className="inline-flex items-center gap-1.5 rounded-full bg-black/5 px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-80"
                        >
                          <FileQuestion size={12} /> {ex.titulo}
                        </Link>
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
                          <div
                            key={subtema.id}
                            className="rounded-xl border p-3"
                            style={{ borderColor: accent.subtemaBorder, background: accent.subtemaBackground }}
                          >
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
                                    className="inline-flex items-center gap-1.5 rounded-full bg-jom-pink/30 px-3 py-1.5 text-xs font-medium text-jom-ink transition-opacity hover:opacity-80"
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

async function renderPortada(
  supabase: Awaited<ReturnType<typeof createClient>>,
  materiasList: Materia[],
  isDocente: boolean,
  role: Role,
  alumnoId: string
) {
  // Para el alumno, "Mis materias" se ordena por la última vez que abrió
  // cada una (más reciente primero); las nunca abiertas van al final.
  if (role === "alumno" && materiasList.length > 0) {
    const { data: vistas } = await supabase
      .from("materia_vistas")
      .select("materia_id, last_viewed_at")
      .eq("alumno_id", alumnoId);
    const vistaPorMateria = new Map((vistas ?? []).map((v) => [v.materia_id as string, v.last_viewed_at as string]));
    materiasList = [...materiasList].sort((a, b) => {
      const va = vistaPorMateria.get(a.id);
      const vb = vistaPorMateria.get(b.id);
      if (va && vb) return vb.localeCompare(va);
      if (va) return -1;
      if (vb) return 1;
      return a.nombre.localeCompare(b.nombre);
    });
  }

  const materiaIds = materiasList.map((m) => m.id);

  const { data: allTemas, error: eAllTemas } =
    materiaIds.length > 0
      ? await supabase.from("temas").select("id, materia_id").in("materia_id", materiaIds)
      : { data: [] as { id: string; materia_id: string }[], error: null };
  if (eAllTemas) throw new Error(`temas: ${eAllTemas.message}`);
  const allTemasList = allTemas ?? [];
  const allTemaIds = allTemasList.map((t) => t.id);

  const [{ data: allArchivos, error: eAllArchivos }, { data: allSubtemas, error: eAllSubtemas }] =
    allTemaIds.length > 0
      ? await Promise.all([
          supabase.from("tema_archivos").select("tema_id").in("tema_id", allTemaIds),
          supabase.from("subtemas").select("tema_id").in("tema_id", allTemaIds),
        ])
      : [
          { data: [] as { tema_id: string }[], error: null },
          { data: [] as { tema_id: string }[], error: null },
        ];
  if (eAllArchivos) throw new Error(`tema_archivos: ${eAllArchivos.message}`);
  if (eAllSubtemas) throw new Error(`subtemas: ${eAllSubtemas.message}`);

  const temasConContenido = new Set<string>();
  for (const a of allArchivos ?? []) temasConContenido.add(a.tema_id);
  for (const s of allSubtemas ?? []) temasConContenido.add(s.tema_id);

  const progresoPorMateria = new Map<string, { total: number; completos: number; pct: number }>();
  for (const m of materiasList) {
    const temasMateria = allTemasList.filter((t) => t.materia_id === m.id);
    const completos = temasMateria.filter((t) => temasConContenido.has(t.id)).length;
    const total = temasMateria.length;
    const pct = total > 0 ? Math.round((completos / total) * 100) : 0;
    progresoPorMateria.set(m.id, { total, completos, pct });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Mis <span className="text-jom-pink">materias</span>
          </h1>
          <p className="text-muted text-sm">Elige una materia para ver su temario, ejercicios y evaluaciones</p>
        </div>
        {isDocente && <SubirMaterialModal materias={materiasList} />}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {materiasList.map((m) => {
          const progreso = progresoPorMateria.get(m.id) ?? { total: 0, completos: 0, pct: 0 };
          return (
            <div key={m.id} className="relative">
              {isDocente && <MateriaBannerUpload materiaId={m.id} />}
              <Link
                href={`/portal/temario?materia=${m.id}`}
                className="glass relative flex h-48 flex-col justify-end overflow-hidden rounded-2xl p-5 transition-opacity hover:opacity-90"
              >
                {m.banner_url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- banner subido por el docente, no un asset estático
                  <img src={m.banner_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <div className="from-jom-yellow/60 via-jom-pink/50 to-jom-ink/20 absolute inset-0 bg-gradient-to-br" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="relative flex flex-col gap-2">
                  <h2 className="text-lg font-semibold text-white drop-shadow">{m.nombre}</h2>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/30">
                      <div className="bg-jom-yellow h-full rounded-full" style={{ width: `${progreso.pct}%` }} />
                    </div>
                    <span className="text-xs font-medium text-white">{progreso.pct}%</span>
                  </div>
                  <p className="text-xs text-white/80">
                    {progreso.total === 0
                      ? "Sin temas cargados todavía"
                      : `${progreso.completos} de ${progreso.total} temas con material`}
                  </p>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
