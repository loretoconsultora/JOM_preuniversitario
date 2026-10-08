import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Trash2, User } from "lucide-react";
import { requirePsicopedagogia } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { PsicopedagogiaCaso, PsicopedagogiaNota, PsicopedagogiaSesion, Profile } from "@/types/database";
import { NuevoAgendamientoPsicopedagogiaForm } from "@/components/nuevo-agendamiento-psicopedagogia-form";
import { PsicopedagogiaQuickActions } from "@/components/psicopedagogia-quick-actions";
import { NotasPsicopedagogiaSection } from "@/components/notas-psicopedagogia-section";
import { ArchivarCasoPsicopedagogiaButton } from "@/components/archivar-caso-psicopedagogia-button";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { eliminarCasoPsicopedagogia } from "../actions";

function formatFecha(fecha: string) {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" });
}

export default async function CasoPsicopedagogiaDetallePage({ params }: { params: Promise<{ id: string }> }) {
  await requirePsicopedagogia();
  const { id } = await params;
  const supabase = await createClient();

  const { data: caso } = await supabase.from("psicopedagogia_casos").select("*").eq("id", id).single();
  if (!caso) notFound();
  const casoData = caso as PsicopedagogiaCaso;

  const [{ data: sesiones }, { data: notas }, { data: alumnoVinculado }] = await Promise.all([
    supabase.from("psicopedagogia_sesiones").select("*").eq("caso_id", id).order("fecha", { ascending: false }),
    supabase.from("psicopedagogia_notas").select("*").eq("caso_id", id).order("created_at", { ascending: false }),
    casoData.alumno_id
      ? supabase.from("profiles").select("*").eq("id", casoData.alumno_id).single()
      : Promise.resolve({ data: null }),
  ]);

  const sesionesList = (sesiones ?? []) as PsicopedagogiaSesion[];
  const notasList = (notas ?? []) as PsicopedagogiaNota[];
  const alumnoPerfil = alumnoVinculado as Profile | null;

  const hoy = new Date().toISOString().slice(0, 10);
  const proximas = sesionesList.filter((s) => s.fecha >= hoy).sort((a, b) => a.fecha.localeCompare(b.fecha));
  const historial = sesionesList.filter((s) => s.fecha < hoy);
  const proximasVisibles = proximas.slice(0, 3);
  const historialVisible = historial.slice(0, 3);
  const proximaSesion = proximas.find((s) => s.estado === "pendiente") ?? proximas[0] ?? null;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link href="/portal/psicopedagogia" className="text-muted inline-flex w-fit items-center gap-1.5 text-sm hover:text-fg">
        <ArrowLeft size={14} /> Volver a psicopedagogía
      </Link>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {alumnoPerfil && (
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full">
              {alumnoPerfil.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element -- avatar subido por el alumno, no un asset estático
                <img src={alumnoPerfil.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="bg-jom-pink/30 flex h-full w-full items-center justify-center">
                  <User size={20} className="text-jom-ink/60" />
                </div>
              )}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-semibold">{casoData.nombre}</h1>
            {alumnoPerfil && <p className="text-muted text-sm">Vinculado a {alumnoPerfil.nombre_completo}</p>}
            {!casoData.activo && <p className="text-muted text-sm">Archivado</p>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Link
            href={`/portal/psicopedagogia/${id}/editar`}
            className="text-muted inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/10"
          >
            <Pencil size={13} /> Editar
          </Link>
          <ArchivarCasoPsicopedagogiaButton id={id} activo={casoData.activo} />
          {!casoData.activo && (
            <ConfirmDeleteButton
              accion={eliminarCasoPsicopedagogia.bind(null, id)}
              mensaje={`¿Eliminar definitivamente a ${casoData.nombre}? Se borrarán también sus sesiones y notas. Esto no se puede deshacer.`}
              className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium text-jom-pink hover:bg-jom-pink/20"
              redirectTo="/portal/psicopedagogia"
            >
              <Trash2 size={13} />
              Eliminar
            </ConfirmDeleteButton>
          )}
        </div>
      </div>

      <div className="glass flex flex-col gap-3 rounded-2xl p-5">
        <p className="text-sm font-semibold">Ficha</p>
        {casoData.motivo && <p className="text-sm">{casoData.motivo}</p>}
        <p className="text-sm">
          {proximaSesion ? (
            <>
              Próxima sesión: {formatFecha(proximaSesion.fecha)}
              {proximaSesion.hora && ` · ${proximaSesion.hora.slice(0, 5)}`}
            </>
          ) : (
            <span className="text-muted">Sin próxima sesión agendada</span>
          )}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Sesiones</p>
          <NuevoAgendamientoPsicopedagogiaForm casoId={id} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-3">
            <p className="text-muted text-xs font-medium uppercase">Próximas</p>
            {proximasVisibles.length === 0 ? (
              <p className="text-muted text-sm">No hay sesiones agendadas.</p>
            ) : (
              <div className="glass flex flex-col gap-3 rounded-2xl p-4">
                {proximasVisibles.map((s) => (
                  <div key={s.id} className="flex flex-col gap-1.5 border-b border-black/5 pb-3 last:border-0 last:pb-0 dark:border-white/5">
                    <span className="text-sm font-medium">
                      {formatFecha(s.fecha)}
                      {s.hora && ` · ${s.hora.slice(0, 5)}`}
                    </span>
                    <PsicopedagogiaQuickActions sesionId={s.id} estadoInicial={s.estado} notaInicial={s.nota} accionable={s.fecha <= hoy} permitirEliminar />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-muted text-xs font-medium uppercase">Historial</p>
            {historialVisible.length === 0 ? (
              <p className="text-muted text-sm">Todavía no hay sesiones pasadas.</p>
            ) : (
              <div className="glass flex flex-col gap-3 rounded-2xl p-4">
                {historialVisible.map((s) => (
                  <div key={s.id} className="flex flex-col gap-1.5 border-b border-black/5 pb-3 last:border-0 last:pb-0 dark:border-white/5">
                    <span className="text-sm font-medium">
                      {formatFecha(s.fecha)}
                      {s.hora && ` · ${s.hora.slice(0, 5)}`}
                    </span>
                    <PsicopedagogiaQuickActions sesionId={s.id} estadoInicial={s.estado} notaInicial={s.nota} accionable={s.fecha <= hoy} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <NotasPsicopedagogiaSection casoId={id} notas={notasList} />
    </div>
  );
}
