import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Paperclip, Trash2 } from "lucide-react";
import { requireDocente } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { TEMARIO_BUCKET, formatBytes } from "@/lib/storage";
import type { Materia, Subtema, SubtemaBorrador, SubtemaEjercicio, SubtemaVideo, Tema, TemaArchivo } from "@/types/database";
import { TemaBuilder } from "@/components/tema-builder";
import { TemaArchivoUploader } from "@/components/tema-archivo-uploader";
import { eliminarArchivoTema } from "../../actions";

export default async function EditarTemaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireDocente();
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: tema }, { data: materias }, { data: archivos }, { data: subtemas }] = await Promise.all([
    supabase.from("temas").select("*").eq("id", id).single(),
    supabase.from("materias").select("*").order("nombre"),
    supabase.from("tema_archivos").select("*").eq("tema_id", id),
    supabase.from("subtemas").select("*").eq("tema_id", id).order("orden"),
  ]);

  if (!tema) notFound();
  const temaData = tema as Tema;
  const materiasList = (materias ?? []) as Materia[];
  const archivosList = (archivos ?? []) as TemaArchivo[];
  const subtemasList = (subtemas ?? []) as Subtema[];
  const subtemaIds = subtemasList.map((s) => s.id);

  const [{ data: ejercicios }, { data: videos }] =
    subtemaIds.length > 0
      ? await Promise.all([
          supabase.from("subtema_ejercicios").select("*").in("subtema_id", subtemaIds).order("orden"),
          supabase.from("subtema_videos").select("*").in("subtema_id", subtemaIds).order("orden"),
        ])
      : [{ data: [] as SubtemaEjercicio[] }, { data: [] as SubtemaVideo[] }];

  const ejerciciosList = (ejercicios ?? []) as SubtemaEjercicio[];
  const videosList = (videos ?? []) as SubtemaVideo[];

  const subtemasBorrador: SubtemaBorrador[] = subtemasList.map((s) => ({
    titulo: s.titulo,
    detalle: s.detalle ?? "",
    ejercicios: ejerciciosList
      .filter((e) => e.subtema_id === s.id)
      .map((e) => ({ titulo: e.titulo, url: e.url })),
    videos: videosList
      .filter((v) => v.subtema_id === s.id)
      .map((v) => ({ titulo: v.titulo ?? "", youtube_url: v.youtube_url })),
  }));

  const signedUrlByPath = new Map<string, string>();
  if (archivosList.length > 0) {
    const { data: signedUrls } = await supabase.storage
      .from(TEMARIO_BUCKET)
      .createSignedUrls(
        archivosList.map((a) => a.storage_path),
        3600
      );
    for (const s of signedUrls ?? []) {
      if (s.signedUrl) signedUrlByPath.set(s.path ?? "", s.signedUrl);
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Link href="/portal/temario" className="text-muted inline-flex items-center gap-1.5 text-sm hover:text-fg">
        <ArrowLeft size={14} /> Volver al temario
      </Link>

      <div className="glass rounded-2xl p-6 sm:p-8">
        <h1 className="mb-6 text-xl font-semibold">Editar tema</h1>

        <div className="mb-6 flex flex-col gap-2">
          <p className="text-sm font-medium">Archivos y presentaciones</p>
          {archivosList.map((archivo) => (
            <div key={archivo.id} className="glass flex items-center gap-2 rounded-xl px-3 py-2 text-xs">
              <Paperclip size={13} className="text-muted shrink-0" />
              <a
                href={signedUrlByPath.get(archivo.storage_path) ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 truncate hover:underline"
              >
                {archivo.nombre_archivo}
              </a>
              {archivo.tamano_bytes && (
                <span className="text-muted shrink-0">{formatBytes(archivo.tamano_bytes)}</span>
              )}
              <form action={eliminarArchivoTema.bind(null, archivo.id, id)}>
                <button
                  type="submit"
                  aria-label="Eliminar archivo"
                  className="text-muted shrink-0 rounded-full p-1 transition-colors hover:bg-jom-pink/30 hover:text-jom-ink"
                >
                  <Trash2 size={13} />
                </button>
              </form>
            </div>
          ))}
          <TemaArchivoUploader temaId={id} />
        </div>

        <TemaBuilder
          materias={materiasList}
          temaId={id}
          initial={{
            titulo: temaData.titulo,
            descripcion: temaData.descripcion ?? "",
            materia_id: temaData.materia_id,
            orden: temaData.orden,
            subtemas: subtemasBorrador,
          }}
        />
      </div>
    </div>
  );
}
