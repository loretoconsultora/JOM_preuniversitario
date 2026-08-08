import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { materiasGestionables } from "@/lib/materias-gestionables";
import { materiasInscritas } from "@/lib/materias-inscritas";
import { FORO_BUCKET } from "@/lib/storage";
import { MateriaSelector } from "@/components/materia-selector";
import { NuevaPublicacionForo } from "@/components/nueva-publicacion-foro";
import { PublicacionForo, type PublicacionVM } from "@/components/publicacion-foro";
import type { ForoComentario, ForoPublicacion, Materia, Profile } from "@/types/database";

export default async function ForoPage({
  searchParams,
}: {
  searchParams: Promise<{ materia?: string }>;
}) {
  const profile = await requireProfile();
  const { materia: materiaParam } = await searchParams;
  const supabase = await createClient();
  const isStaff = profile.role === "docente" || profile.role === "directora";

  const materiasList =
    profile.role === "docente"
      ? await materiasGestionables(supabase, profile.id)
      : profile.role === "alumno"
        ? await materiasInscritas(supabase, profile.id)
        : (((await supabase.from("materias").select("*").order("nombre")).data ?? []) as Materia[]);
  const materiaIds = new Set(materiasList.map((m) => m.id));
  const materiaSel =
    materiaParam && materiaIds.has(materiaParam) ? materiaParam : (materiasList[0]?.id ?? "");

  let feed: PublicacionVM[] = [];
  if (materiaSel) {
    const { data: publicacionesData } = await supabase
      .from("foro_publicaciones")
      .select("*")
      .eq("materia_id", materiaSel)
      .order("created_at", { ascending: false });
    const publicaciones = (publicacionesData ?? []) as ForoPublicacion[];

    const publicacionIds = publicaciones.map((p) => p.id);
    const { data: comentariosData } =
      publicacionIds.length > 0
        ? await supabase.from("foro_comentarios").select("*").in("publicacion_id", publicacionIds).order("created_at")
        : { data: [] as ForoComentario[] };
    const comentarios = (comentariosData ?? []) as ForoComentario[];

    const autorIds = new Set([...publicaciones.map((p) => p.autor_id), ...comentarios.map((c) => c.autor_id)]);
    const { data: perfilesData } =
      autorIds.size > 0
        ? await supabase.from("profiles").select("id, nombre_completo, avatar_url").in("id", [...autorIds])
        : { data: [] as Pick<Profile, "id" | "nombre_completo" | "avatar_url">[] };
    const perfilPorId = new Map((perfilesData ?? []).map((p) => [p.id, p]));

    const rutasConArchivo = publicaciones.filter((p) => p.storage_path).map((p) => p.storage_path!);
    const signedUrlByPath = new Map<string, string>();
    if (rutasConArchivo.length > 0) {
      const { data: signedUrls } = await supabase.storage.from(FORO_BUCKET).createSignedUrls(rutasConArchivo, 3600);
      for (const s of signedUrls ?? []) {
        if (s.signedUrl) signedUrlByPath.set(s.path ?? "", s.signedUrl);
      }
    }

    const comentariosPorPublicacion = new Map<string, ForoComentario[]>();
    for (const c of comentarios) {
      const lista = comentariosPorPublicacion.get(c.publicacion_id) ?? [];
      lista.push(c);
      comentariosPorPublicacion.set(c.publicacion_id, lista);
    }

    feed = publicaciones.map((p) => {
      const autor = perfilPorId.get(p.autor_id);
      return {
        id: p.id,
        autorNombre: autor?.nombre_completo ?? "—",
        autorAvatar: autor?.avatar_url ?? null,
        texto: p.texto,
        link: p.link,
        archivo: p.storage_path
          ? {
              url: signedUrlByPath.get(p.storage_path) ?? null,
              nombre: p.nombre_archivo ?? "Archivo",
              tamano: p.tamano_bytes,
            }
          : null,
        created_at: p.created_at,
        puedeEliminar: p.autor_id === profile.id || isStaff,
        comentarios: (comentariosPorPublicacion.get(p.id) ?? []).map((c) => {
          const autorComentario = perfilPorId.get(c.autor_id);
          return {
            id: c.id,
            autorNombre: autorComentario?.nombre_completo ?? "—",
            autorAvatar: autorComentario?.avatar_url ?? null,
            texto: c.texto,
            created_at: c.created_at,
            puedeEliminar: c.autor_id === profile.id || isStaff,
          };
        }),
      };
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Foro</h1>
        <p className="text-muted text-sm">
          Comparte tu proyecto, un link o un archivo, y comenta el de tus compañeros.
        </p>
      </div>

      {materiasList.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center text-sm text-muted">
          {profile.role === "alumno"
            ? "Todavía no estás inscrito en ninguna materia."
            : "Todavía no tienes materias asignadas."}
        </div>
      ) : (
        <>
          {materiasList.length > 1 && (
            <MateriaSelector
              materias={materiasList.map((m) => ({ id: m.id, nombre: m.nombre }))}
              seleccionada={materiaSel}
              basePath="/portal/foro"
            />
          )}

          <NuevaPublicacionForo materiaId={materiaSel} autorId={profile.id} />

          {feed.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center text-sm text-muted">
              Todavía no hay publicaciones en esta materia. ¡Sé el primero!
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {feed.map((p) => (
                <PublicacionForo key={p.id} publicacion={p} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
