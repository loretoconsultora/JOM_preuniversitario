import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireDocente } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { materiasGestionables } from "@/lib/materias-gestionables";
import type { Tema } from "@/types/database";
import { NuevaTareaForm } from "@/components/nueva-tarea-form";

export default async function NuevaTareaPage() {
  const profile = await requireDocente();
  const supabase = await createClient();
  const [materiasList, { data: temas }] = await Promise.all([
    materiasGestionables(supabase, profile.id),
    supabase.from("temas").select("*").order("orden"),
  ]);
  const temasList = (temas ?? []) as Tema[];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <Link href="/portal/tareas" className="text-muted inline-flex items-center gap-1.5 text-sm hover:text-fg">
        <ArrowLeft size={14} /> Volver a tareas
      </Link>

      <div className="glass rounded-2xl p-6 sm:p-8">
        <h1 className="mb-1 text-xl font-semibold">Nueva tarea</h1>
        <p className="text-muted mb-6 text-xs">
          El alumno siempre podrá subir evidencia (fotos JPG/PNG/HEIC, PDF o Word) para esta tarea; además puedes
          pedir una respuesta de texto y/o agregar preguntas.
        </p>
        <NuevaTareaForm materias={materiasList} temas={temasList} />
      </div>
    </div>
  );
}
