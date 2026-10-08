import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { requireCoachVocacionalODirectora } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Orientado, OrientacionSesion } from "@/types/database";

function formatFecha(fecha: string) {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "short", year: "numeric" });
}

export default async function EvaluacionesOrientacionPage({
  searchParams,
}: {
  searchParams: Promise<{ sesion?: string }>;
}) {
  await requireCoachVocacionalODirectora();
  const { sesion: sesionId } = await searchParams;
  const supabase = await createClient();

  let sesion: OrientacionSesion | null = null;
  let orientado: Orientado | null = null;
  if (sesionId) {
    const { data: sesionData } = await supabase.from("orientacion_sesiones").select("*").eq("id", sesionId).maybeSingle();
    sesion = sesionData as OrientacionSesion | null;
    if (sesion) {
      const { data: orientadoData } = await supabase.from("orientados").select("*").eq("id", sesion.orientado_id).maybeSingle();
      orientado = orientadoData as Orientado | null;
    }
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <Link href="/portal/asistencia-orientacion" className="text-muted inline-flex items-center gap-1.5 text-sm hover:text-fg">
        <ArrowLeft size={14} /> Volver a asistencia
      </Link>

      <div className="glass flex flex-col items-center gap-3 rounded-2xl p-8 text-center">
        <Sparkles size={22} className="text-jom-pink" />
        <h1 className="text-xl font-semibold">Evaluaciones de orientación vocacional</h1>
        <p className="text-muted text-sm">
          Esta sección todavía está en construcción. Va a permitir evaluar en vivo distintos atributos o variables
          durante la cita, igual que las evaluaciones del rol de terapeuta.
        </p>
        {orientado && sesion && (
          <p className="text-sm">
            Cita de <span className="font-medium">{orientado.nombre}</span> — {formatFecha(sesion.fecha)}
            {sesion.hora && ` · ${sesion.hora.slice(0, 5)}`}
          </p>
        )}
      </div>
    </div>
  );
}
