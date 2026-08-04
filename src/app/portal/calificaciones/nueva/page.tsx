import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireDocente } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { materiasGestionables } from "@/lib/materias-gestionables";
import type { Examen, Profile, Tarea, Tema } from "@/types/database";
import { CalificacionForm } from "@/components/calificacion-form";

export default async function NuevaCalificacionPage({
  searchParams,
}: {
  searchParams: Promise<{ tarea_id?: string; alumno_id?: string }>;
}) {
  const profile = await requireDocente();
  const { tarea_id: tareaIdPreseleccionada, alumno_id: alumnoIdPreseleccionado } = await searchParams;
  const supabase = await createClient();
  const materiasList = await materiasGestionables(supabase, profile.id);
  const materiaIds = materiasList.map((m) => m.id);

  const [{ data: alumnos }, { data: temas }, { data: tareas }, { data: examenes }] = await Promise.all([
    supabase.from("profiles").select("*").eq("role", "alumno").order("nombre_completo"),
    materiaIds.length > 0
      ? supabase.from("temas").select("*").in("materia_id", materiaIds).order("orden")
      : Promise.resolve({ data: [] as Tema[] }),
    materiaIds.length > 0
      ? supabase.from("tareas").select("*").in("materia_id", materiaIds).order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as Tarea[] }),
    materiaIds.length > 0
      ? supabase.from("examenes").select("*").in("materia_id", materiaIds).order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as Examen[] }),
  ]);
  const alumnosList = (alumnos ?? []) as Profile[];
  const temasList = (temas ?? []) as Tema[];
  const tareasList = (tareas ?? []) as Tarea[];
  const examenesList = (examenes ?? []) as Examen[];

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <Link href="/portal/calificaciones" className="text-muted inline-flex items-center gap-1.5 text-sm hover:text-fg">
        <ArrowLeft size={14} /> Volver a calificaciones
      </Link>

      <div className="glass rounded-2xl p-6 sm:p-8">
        <h1 className="mb-6 text-xl font-semibold">Nueva calificación</h1>

        {alumnosList.length === 0 ? (
          <p className="text-muted text-sm">
            Primero registra alumnos en la sección{" "}
            <Link href="/portal/alumnos/nuevo" className="font-medium underline">
              Alumnos
            </Link>
            .
          </p>
        ) : (
          <CalificacionForm
            materias={materiasList}
            temas={temasList}
            tareas={tareasList}
            examenes={examenesList}
            alumnos={alumnosList}
            tareaIdPreseleccionada={tareaIdPreseleccionada ?? null}
            alumnoIdPreseleccionado={alumnoIdPreseleccionado ?? null}
          />
        )}
      </div>
    </div>
  );
}
