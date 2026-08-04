import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireDocente } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { materiasGestionables } from "@/lib/materias-gestionables";
import { RecursoForm } from "@/components/recurso-form";

export default async function NuevoRecursoPage() {
  const profile = await requireDocente();
  const supabase = await createClient();
  const materiasList = await materiasGestionables(supabase, profile.id);

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <Link href="/portal/recursos" className="text-muted inline-flex items-center gap-1.5 text-sm hover:text-fg">
        <ArrowLeft size={14} /> Volver a recursos
      </Link>

      <div className="glass rounded-2xl p-6 sm:p-8">
        <h1 className="mb-6 text-xl font-semibold">Nuevo recurso</h1>
        <RecursoForm materias={materiasList} />
      </div>
    </div>
  );
}
