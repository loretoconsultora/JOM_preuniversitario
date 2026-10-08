import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireTerapeuta } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Paciente, Profile } from "@/types/database";
import { EditarPacienteForm } from "@/components/editar-paciente-form";

export default async function EditarPacientePage({ params }: { params: Promise<{ id: string }> }) {
  await requireTerapeuta();
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: paciente }, { data: alumnos }] = await Promise.all([
    supabase.from("pacientes").select("*").eq("id", id).single(),
    supabase.from("profiles").select("*").eq("role", "alumno").order("nombre_completo"),
  ]);
  if (!paciente) notFound();
  const alumnosList = (alumnos ?? []) as Profile[];

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <Link href={`/portal/pacientes/${id}`} className="text-muted inline-flex items-center gap-1.5 text-sm hover:text-fg">
        <ArrowLeft size={14} /> Volver al paciente
      </Link>

      <div className="glass rounded-2xl p-6 sm:p-8">
        <h1 className="mb-6 text-xl font-semibold">Editar paciente</h1>
        <EditarPacienteForm paciente={paciente as Paciente} alumnos={alumnosList} />
      </div>
    </div>
  );
}
