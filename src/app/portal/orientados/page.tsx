import Link from "next/link";
import { Plus, ChevronRight, User } from "lucide-react";
import { requireCoachVocacionalODirectora } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Orientado, OrientacionRecurso } from "@/types/database";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { RecursosOrientacionSection } from "@/components/recursos-orientacion-section";
import { ORIENTACION_RECURSOS_BUCKET } from "@/lib/storage";
import { eliminarOrientado } from "./actions";

export default async function OrientadosPage() {
  const profile = await requireCoachVocacionalODirectora();
  const esCoach = profile.role === "coach_vocacional";
  const supabase = await createClient();

  const [{ data: orientados }, { data: recursos }] = await Promise.all([
    supabase.from("orientados").select("*").order("nombre"),
    esCoach
      ? supabase.from("orientacion_recursos").select("*").is("orientado_id", null).order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as OrientacionRecurso[] }),
  ]);

  const orientadosList = (orientados ?? []) as Orientado[];
  const recursosList = (recursos ?? []) as OrientacionRecurso[];
  const activos = orientadosList.filter((o) => o.activo);
  const inactivos = orientadosList.filter((o) => !o.activo);

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Orientación vocacional</h1>
          <p className="text-muted text-sm">{activos.length} en seguimiento activo</p>
        </div>
        {esCoach && (
          <Link
            href="/portal/orientados/nuevo"
            className="inline-flex items-center gap-1.5 rounded-full bg-jom-ink px-4 py-2.5 text-sm font-semibold text-jom-white transition-opacity hover:opacity-90 dark:bg-jom-white dark:text-jom-ink"
          >
            <Plus size={15} /> Nuevo caso
          </Link>
        )}
      </div>

      {activos.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center text-sm text-muted">Aún no hay casos en seguimiento.</div>
      ) : (
        <div className="glass overflow-hidden rounded-2xl">
          {activos.map((o, i) => (
            <Link
              key={o.id}
              href={`/portal/orientados/${o.id}`}
              className={`flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-black/5 dark:hover:bg-white/5 ${
                i !== 0 ? "border-t border-black/5 dark:border-white/5" : ""
              }`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="bg-jom-pink/30 flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
                  <User size={15} className="text-jom-ink/60" />
                </div>
                <div className="min-w-0">
                  <span className="font-medium">{o.nombre}</span>
                  {o.objetivo && <p className="text-muted mt-0.5 truncate text-xs">{o.objetivo}</p>}
                </div>
              </div>
              <ChevronRight size={16} className="text-muted shrink-0" />
            </Link>
          ))}
        </div>
      )}

      {inactivos.length > 0 && (
        <details className="glass rounded-2xl p-5">
          <summary className="text-muted cursor-pointer text-sm font-medium">Archivados ({inactivos.length})</summary>
          <div className="mt-3 flex flex-col gap-1.5">
            {inactivos.map((o) => (
              <div key={o.id} className="flex items-center justify-between gap-3">
                <Link href={`/portal/orientados/${o.id}`} className="text-sm hover:underline">
                  {o.nombre}
                </Link>
                {esCoach && (
                  <ConfirmDeleteButton
                    accion={eliminarOrientado.bind(null, o.id)}
                    mensaje={`¿Eliminar definitivamente a ${o.nombre}? Se borrarán también sus sesiones, tests, plan, notas y recursos. Esto no se puede deshacer.`}
                    className="text-muted inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs hover:bg-jom-pink/20 hover:text-jom-ink"
                  >
                    Eliminar
                  </ConfirmDeleteButton>
                )}
              </div>
            ))}
          </div>
        </details>
      )}

      {esCoach && (
        <div className="glass flex flex-col gap-3 rounded-2xl p-5">
          <div>
            <p className="text-sm font-semibold">Biblioteca general</p>
            <p className="text-muted text-xs">
              Recursos visibles para todos tus orientados (guías, links de universidades, etc.).
            </p>
          </div>
          <RecursosOrientacionSection orientadoId={null} recursos={recursosList} urlPorArchivo={urlPorArchivo} titulo="" />
        </div>
      )}
    </div>
  );
}
