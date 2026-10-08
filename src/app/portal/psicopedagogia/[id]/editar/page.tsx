import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requirePsicopedagogia } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { PsicopedagogiaCaso, Profile } from "@/types/database";
import { EditarCasoPsicopedagogiaForm } from "@/components/editar-caso-psicopedagogia-form";

export default async function EditarCasoPsicopedagogiaPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePsicopedagogia();
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: caso }, { data: alumnos }] = await Promise.all([
    supabase.from("psicopedagogia_casos").select("*").eq("id", id).single(),
    supabase.from("profiles").select("*").eq("role", "alumno").order("nombre_completo"),
  ]);
  if (!caso) notFound();
  const alumnosList = (alumnos ?? []) as Profile[];

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <Link href={`/portal/psicopedagogia/${id}`} className="text-muted inline-flex items-center gap-1.5 text-sm hover:text-fg">
        <ArrowLeft size={14} /> Volver al caso
      </Link>

      <div className="glass rounded-2xl p-6 sm:p-8">
        <h1 className="mb-6 text-xl font-semibold">Editar caso</h1>
        <EditarCasoPsicopedagogiaForm caso={caso as PsicopedagogiaCaso} alumnos={alumnosList} />
      </div>
    </div>
  );
}
