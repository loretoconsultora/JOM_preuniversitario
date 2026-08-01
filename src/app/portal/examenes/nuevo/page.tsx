import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireDocente } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Materia, Profile, Tema } from "@/types/database";
import { ExamenBuilder } from "@/components/examen-builder";

export default async function NuevoExamenPage() {
  await requireDocente();
  const supabase = await createClient();
  const [{ data: materias }, { data: temas }, { data: alumnos }] = await Promise.all([
    supabase.from("materias").select("*").order("nombre"),
    supabase.from("temas").select("*").order("orden"),
    supabase.from("profiles").select("*").eq("role", "alumno").order("nombre_completo"),
  ]);
  const materiasList = (materias ?? []) as Materia[];
  const temasList = (temas ?? []) as Tema[];
  const alumnosList = (alumnos ?? []) as Profile[];

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Link href="/portal/examenes" className="text-muted inline-flex items-center gap-1.5 text-sm hover:text-fg">
        <ArrowLeft size={14} /> Volver a exámenes
      </Link>

      <div className="glass rounded-2xl p-6 sm:p-8">
        <h1 className="mb-1 text-xl font-semibold">Nuevo examen</h1>
        <p className="text-muted mb-6 text-sm">
          Agrega preguntas manualmente, genera preguntas con IA a partir de un tema, o sube una plantilla CSV. Puedes combinar los tres métodos y revisar todo antes de guardar.
        </p>
        <ExamenBuilder materias={materiasList} temas={temasList} alumnos={alumnosList} />
      </div>
    </div>
  );
}
