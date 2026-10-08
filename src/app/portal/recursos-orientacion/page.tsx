import { requireCoachVocacionalODirectora } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { OrientacionRecurso } from "@/types/database";
import { RecursosOrientacionSection } from "@/components/recursos-orientacion-section";
import { ORIENTACION_RECURSOS_BUCKET } from "@/lib/storage";

export default async function RecursosOrientacionPage() {
  const profile = await requireCoachVocacionalODirectora();
  const esCoach = profile.role === "coach_vocacional";
  const supabase = await createClient();

  const { data: recursos } = await supabase
    .from("orientacion_recursos")
    .select("*")
    .is("orientado_id", null)
    .order("created_at", { ascending: false });
  const recursosList = (recursos ?? []) as OrientacionRecurso[];

  const urlPorArchivo: Record<string, string> = {};
  const rutasArchivo = recursosList.filter((r) => r.storage_path).map((r) => r.storage_path as string);
  if (rutasArchivo.length > 0) {
    const { data: signedUrls } = await supabase.storage.from(ORIENTACION_RECURSOS_BUCKET).createSignedUrls(rutasArchivo, 3600);
    for (const s of signedUrls ?? []) {
      if (s.signedUrl && s.path) urlPorArchivo[s.path] = s.signedUrl;
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Recursos vocacionales</h1>
        <p className="text-muted text-sm">Biblioteca general, visible para todos los perfiles (guías, links de universidades, etc.).</p>
      </div>

      <div className="glass rounded-2xl p-5">
        <RecursosOrientacionSection orientadoId={null} recursos={recursosList} urlPorArchivo={urlPorArchivo} soloLectura={!esCoach} titulo="" />
      </div>
    </div>
  );
}
