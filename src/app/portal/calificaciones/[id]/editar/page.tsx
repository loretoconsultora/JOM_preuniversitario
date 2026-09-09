import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireDocente } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Calificacion, Materia, Profile } from "@/types/database";
import { EditarCalificacionForm } from "@/components/editar-calificacion-form";

export default async function EditarCalificacionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireDocente();
  const { id } = await params;
  const supabase = await createClient();

  const { data: calificacion } = await supabase.from("calificaciones").select("*").eq("id", id).single();
  if (!calificacion) notFound();
  const calificacionData = calificacion as Calificacion;

  const [{ data: alumno }, { data: materia }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", calificacionData.alumno_id).single(),
    supabase.from("materias").select("*").eq("id", calificacionData.materia_id).single(),
  ]);

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <Link href="/portal/calificaciones" className="text-muted inline-flex items-center gap-1.5 text-sm hover:text-fg">
        <ArrowLeft size={14} /> Volver a calificaciones
      </Link>

      <div className="glass rounded-2xl p-6 sm:p-8">
        <h1 className="mb-1 text-xl font-semibold">Editar calificación</h1>
        <p className="text-muted mb-6 text-sm">
          {(alumno as Profile | null)?.nombre_completo ?? "Alumno"} · {(materia as Materia | null)?.nombre ?? "Materia"}
          {calificacionData.tarea_id && " · vinculada a una tarea"}
        </p>

        <EditarCalificacionForm id={id} calificacion={calificacionData} />
      </div>
    </div>
  );
}
