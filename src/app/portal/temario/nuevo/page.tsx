import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireDocente } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Materia } from "@/types/database";
import { TemaBuilder } from "@/components/tema-builder";

export default async function NuevoTemaPage() {
  await requireDocente();
  const supabase = await createClient();
  const { data: materias } = await supabase.from("materias").select("*").order("nombre");
  const materiasList = (materias ?? []) as Materia[];

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Link href="/portal/temario" className="text-muted inline-flex items-center gap-1.5 text-sm hover:text-fg">
        <ArrowLeft size={14} /> Volver al temario
      </Link>

      <div className="glass rounded-2xl p-6 sm:p-8">
        <h1 className="mb-1 text-xl font-semibold">Nuevo tema</h1>
        <p className="text-muted mb-6 text-sm">
          Agrega los subtemas del tema; en cada uno puedes poner botones a ejercicios y videos de YouTube.
        </p>
        <TemaBuilder materias={materiasList} />
      </div>
    </div>
  );
}
