import Link from "next/link";
import { Plus, ChevronRight, User } from "lucide-react";
import { requirePsicopedagogia } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { PsicopedagogiaCaso } from "@/types/database";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { eliminarCasoPsicopedagogia } from "./actions";

export default async function PsicopedagogiaPage() {
  await requirePsicopedagogia();
  const supabase = await createClient();

  const { data: casos } = await supabase.from("psicopedagogia_casos").select("*").order("nombre");
  const casosList = (casos ?? []) as PsicopedagogiaCaso[];
  const activos = casosList.filter((c) => c.activo);
  const inactivos = casosList.filter((c) => !c.activo);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Psicopedagogía</h1>
          <p className="text-muted text-sm">{activos.length} en seguimiento activo</p>
        </div>
        <Link
          href="/portal/psicopedagogia/nuevo"
          className="inline-flex items-center gap-1.5 rounded-full bg-jom-ink px-4 py-2.5 text-sm font-semibold text-jom-white transition-opacity hover:opacity-90 dark:bg-jom-white dark:text-jom-ink"
        >
          <Plus size={15} /> Nuevo caso
        </Link>
      </div>

      {activos.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center text-sm text-muted">Aún no hay casos en seguimiento.</div>
      ) : (
        <div className="glass overflow-hidden rounded-2xl">
          {activos.map((c, i) => (
            <Link
              key={c.id}
              href={`/portal/psicopedagogia/${c.id}`}
              className={`flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-black/5 dark:hover:bg-white/5 ${
                i !== 0 ? "border-t border-black/5 dark:border-white/5" : ""
              }`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="bg-jom-pink/30 flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
                  <User size={15} className="text-jom-ink/60" />
                </div>
                <div className="min-w-0">
                  <span className="font-medium">{c.nombre}</span>
                  {c.motivo && <p className="text-muted mt-0.5 truncate text-xs">{c.motivo}</p>}
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
            {inactivos.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3">
                <Link href={`/portal/psicopedagogia/${c.id}`} className="text-sm hover:underline">
                  {c.nombre}
                </Link>
                <ConfirmDeleteButton
                  accion={eliminarCasoPsicopedagogia.bind(null, c.id)}
                  mensaje={`¿Eliminar definitivamente a ${c.nombre}? Se borrarán también sus sesiones y notas. Esto no se puede deshacer.`}
                  className="text-muted inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs hover:bg-jom-pink/20 hover:text-jom-ink"
                >
                  Eliminar
                </ConfirmDeleteButton>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
