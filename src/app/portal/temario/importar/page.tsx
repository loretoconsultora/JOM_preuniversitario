import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireDocente } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { materiasGestionables } from "@/lib/materias-gestionables";
import { ImportarTemarioForm } from "@/components/importar-temario-form";

export default async function ImportarTemarioPage() {
  const profile = await requireDocente();
  const supabase = await createClient();
  const materiasList = await materiasGestionables(supabase, profile.id);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Link href="/portal/temario" className="text-muted inline-flex items-center gap-1.5 text-sm hover:text-fg">
        <ArrowLeft size={14} /> Volver al temario
      </Link>

      <div className="glass rounded-2xl p-6 sm:p-8">
        <h1 className="mb-1 text-xl font-semibold">Importar temario con IA</h1>
        <p className="text-muted mb-6 text-sm">
          Sube un documento (Word, PDF, Excel o CSV) con tu temario y la IA lo organiza en temas y subtemas, listos
          para revisar antes de guardar.
        </p>
        <ImportarTemarioForm materias={materiasList} />
      </div>
    </div>
  );
}
