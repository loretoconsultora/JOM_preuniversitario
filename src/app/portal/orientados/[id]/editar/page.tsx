import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireCoachVocacional } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Orientado, Profile } from "@/types/database";
import { EditarOrientadoForm } from "@/components/editar-orientado-form";

export default async function EditarOrientadoPage({ params }: { params: Promise<{ id: string }> }) {
  await requireCoachVocacional();
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: orientado }, { data: alumnos }] = await Promise.all([
    supabase.from("orientados").select("*").eq("id", id).single(),
    supabase.from("profiles").select("*").eq("role", "alumno").order("nombre_completo"),
  ]);
  if (!orientado) notFound();
  const alumnosList = (alumnos ?? []) as Profile[];

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <Link href={`/portal/orientados/${id}`} className="text-muted inline-flex items-center gap-1.5 text-sm hover:text-fg">
        <ArrowLeft size={14} /> Volver al caso
      </Link>

      <div className="glass rounded-2xl p-6 sm:p-8">
        <h1 className="mb-6 text-xl font-semibold">Editar caso</h1>
        <EditarOrientadoForm orientado={orientado as Orientado} alumnos={alumnosList} />
      </div>
    </div>
  );
}
