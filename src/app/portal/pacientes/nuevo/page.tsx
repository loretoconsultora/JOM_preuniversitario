import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireTerapeuta } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";
import { CrearPacienteForm } from "@/components/crear-paciente-form";

export default async function NuevoPacientePage() {
  await requireTerapeuta();
  const supabase = await createClient();
  const { data: alumnos } = await supabase.from("profiles").select("*").eq("role", "alumno").order("nombre_completo");
  const alumnosList = (alumnos ?? []) as Profile[];

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <Link href="/portal/pacientes" className="text-muted inline-flex items-center gap-1.5 text-sm hover:text-fg">
        <ArrowLeft size={14} /> Volver a pacientes
      </Link>

      <div className="glass rounded-2xl p-6 sm:p-8">
        <h1 className="mb-1 text-xl font-semibold">Nuevo paciente</h1>
        <p className="text-muted mb-6 text-sm">
          Se creará su ficha de acompañamiento socioemocional. Esta información es privada: solo tú puedes verla.
        </p>
        <CrearPacienteForm alumnos={alumnosList} />
      </div>
    </div>
  );
}
