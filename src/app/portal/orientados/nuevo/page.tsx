import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireCoachVocacional } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";
import { CrearOrientadoForm } from "@/components/crear-orientado-form";

export default async function NuevoOrientadoPage() {
  await requireCoachVocacional();
  const supabase = await createClient();
  const { data: alumnos } = await supabase.from("profiles").select("*").eq("role", "alumno").order("nombre_completo");
  const alumnosList = (alumnos ?? []) as Profile[];

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <Link href="/portal/orientados" className="text-muted inline-flex items-center gap-1.5 text-sm hover:text-fg">
        <ArrowLeft size={14} /> Volver a orientación vocacional
      </Link>

      <div className="glass rounded-2xl p-6 sm:p-8">
        <h1 className="mb-1 text-xl font-semibold">Nuevo caso</h1>
        <p className="text-muted mb-6 text-sm">
          Se creará el seguimiento de orientación vocacional. Si lo vinculas a una cuenta de alumno, esa persona va a
          poder ver su plan, tests y notas.
        </p>
        <CrearOrientadoForm alumnos={alumnosList} />
      </div>
    </div>
  );
}
