import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireDocente } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { materiasGestionables } from "@/lib/materias-gestionables";
import { RecursoForm } from "@/components/recurso-form";
import type { Subtema, Tema } from "@/types/database";

export default async function NuevoRecursoPage() {
  const profile = await requireDocente();
  const supabase = await createClient();
  const materiasList = await materiasGestionables(supabase, profile.id);
  const materiaIds = materiasList.map((m) => m.id);

  const { data: temas } =
    materiaIds.length > 0
      ? await supabase.from("temas").select("*").in("materia_id", materiaIds).order("orden")
      : { data: [] as Tema[] };
  const temasList = (temas ?? []) as Tema[];
  const temaIds = temasList.map((t) => t.id);

  const { data: subtemas } =
    temaIds.length > 0
      ? await supabase.from("subtemas").select("*").in("tema_id", temaIds).order("orden")
      : { data: [] as Subtema[] };
  const subtemasList = (subtemas ?? []) as Subtema[];

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <Link href="/portal/recursos" className="text-muted inline-flex items-center gap-1.5 text-sm hover:text-fg">
        <ArrowLeft size={14} /> Volver a recursos
      </Link>

      <div className="glass rounded-2xl p-6 sm:p-8">
        <h1 className="mb-6 text-xl font-semibold">Nuevo recurso</h1>
        <RecursoForm materias={materiasList} temas={temasList} subtemas={subtemasList} />
      </div>
    </div>
  );
}
