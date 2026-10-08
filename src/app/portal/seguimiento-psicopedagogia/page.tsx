import { Brain } from "lucide-react";
import { requireDirectora } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type CasoDirectorio = { id: string; nombre: string; activo: boolean; profesional_id: string };

export default async function SeguimientoPsicopedagogiaPage() {
  await requireDirectora();
  const supabase = await createClient();

  const [{ data: casos }, { data: profesionales }] = await Promise.all([
    supabase.rpc("psicopedagogia_directorio"),
    supabase.from("profiles").select("id, nombre_completo").or("role.eq.psicopedagogia,roles.cs.{psicopedagogia}"),
  ]);

  const casosList = ((casos ?? []) as CasoDirectorio[]).filter((c) => c.activo);
  const nombrePorProfesional = new Map(
    ((profesionales ?? []) as { id: string; nombre_completo: string }[]).map((p) => [p.id, p.nombre_completo]),
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Psicopedagogía</h1>
        <p className="text-muted text-sm">
          Casos en seguimiento activo. Esta vista no incluye sesiones ni notas: ese contenido es privado de cada
          profesional, igual que en terapia.
        </p>
      </div>

      {casosList.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center text-sm text-muted">Aún no hay casos registrados.</div>
      ) : (
        <div className="glass overflow-hidden rounded-2xl">
          {casosList.map((c, i) => (
            <div
              key={c.id}
              className={`flex items-center justify-between gap-3 px-5 py-4 ${
                i !== 0 ? "border-t border-black/5 dark:border-white/5" : ""
              }`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="bg-jom-pink/30 flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
                  <Brain size={15} className="text-jom-ink/60" />
                </div>
                <span className="font-medium">{c.nombre}</span>
              </div>
              <span className="text-muted shrink-0 text-xs">
                {nombrePorProfesional.get(c.profesional_id) ?? "—"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
