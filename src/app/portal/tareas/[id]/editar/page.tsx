import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireDocente } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { materiasGestionables } from "@/lib/materias-gestionables";
import type { PreguntaBorrador, Tarea, TareaArchivo, TareaPregunta, Tema } from "@/types/database";
import { TAREAS_BUCKET } from "@/lib/storage";
import { EditarTareaForm } from "@/components/editar-tarea-form";

export default async function EditarTareaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireDocente();
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: tarea }, materiasList, { data: archivos }, { data: temas }, { data: preguntas }] =
    await Promise.all([
      supabase.from("tareas").select("*").eq("id", id).single(),
      materiasGestionables(supabase, profile.id),
      supabase.from("tarea_archivos").select("*").eq("tarea_id", id),
      supabase.from("temas").select("*").order("orden"),
      supabase.from("tarea_preguntas").select("*").eq("tarea_id", id).order("orden"),
    ]);

  if (!tarea) notFound();
  const tareaData = tarea as Tarea;
  const archivosList = (archivos ?? []) as TareaArchivo[];
  const temasList = (temas ?? []) as Tema[];
  const preguntasIniciales: PreguntaBorrador[] = ((preguntas ?? []) as TareaPregunta[]).map((p) => ({
    tipo: p.tipo,
    enunciado: p.enunciado,
    opciones: p.opciones ?? ["", "", "", ""],
    respuesta_correcta: p.respuesta_correcta ?? 0,
  }));

  const urlPorArchivo: Record<string, string> = {};
  if (archivosList.length > 0) {
    const { data: signedUrls } = await supabase.storage
      .from(TAREAS_BUCKET)
      .createSignedUrls(
        archivosList.map((a) => a.storage_path),
        3600
      );
    for (const s of signedUrls ?? []) {
      if (s.signedUrl && s.path) urlPorArchivo[s.path] = s.signedUrl;
    }
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <Link href="/portal/tareas" className="text-muted inline-flex items-center gap-1.5 text-sm hover:text-fg">
        <ArrowLeft size={14} /> Volver a tareas
      </Link>

      <div className="glass rounded-2xl p-6 sm:p-8">
        <h1 className="mb-6 text-xl font-semibold">Editar tarea</h1>

        <EditarTareaForm
          id={id}
          tarea={tareaData}
          materias={materiasList}
          temas={temasList}
          archivosIniciales={archivosList}
          urlPorArchivo={urlPorArchivo}
          preguntasIniciales={preguntasIniciales}
        />
      </div>
    </div>
  );
}
