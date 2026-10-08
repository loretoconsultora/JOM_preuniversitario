import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trash2, User } from "lucide-react";
import { requireCoachVocacionalODirectora } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Orientado, OrientacionNota, OrientacionPlan, OrientacionRecurso, OrientacionSesion, OrientacionTest, Profile } from "@/types/database";
import { ORIENTACION_RECURSOS_BUCKET, ORIENTACION_TESTS_BUCKET } from "@/lib/storage";
import { NuevoAgendamientoOrientacionForm } from "@/components/nuevo-agendamiento-orientacion-form";
import { OrientadoQuickActions } from "@/components/orientado-quick-actions";
import { PlanOrientacionForm } from "@/components/plan-orientacion-form";
import { PlanOrientacionResumen } from "@/components/plan-orientacion-resumen";
import { NotasOrientacionSection } from "@/components/notas-orientacion-section";
import { TestsOrientacionSection } from "@/components/tests-orientacion-section";
import { RecursosOrientacionSection } from "@/components/recursos-orientacion-section";
import { ArchivarOrientadoButton } from "@/components/archivar-orientado-button";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { eliminarOrientado } from "../actions";

function formatFecha(fecha: string) {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" });
}

export default async function OrientadoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireCoachVocacionalODirectora();
  const esCoach = profile.role === "coach_vocacional";
  const { id } = await params;
  const supabase = await createClient();

  const { data: orientado } = await supabase.from("orientados").select("*").eq("id", id).single();
  if (!orientado) notFound();
  const orientadoData = orientado as Orientado;

  const [
    { data: sesiones },
    { data: plan },
    { data: tests },
    { data: notas },
    { data: recursos },
    { data: alumnoVinculado },
  ] = await Promise.all([
    supabase.from("orientacion_sesiones").select("*").eq("orientado_id", id).order("fecha", { ascending: false }),
    supabase.from("orientacion_plan").select("*").eq("orientado_id", id).maybeSingle(),
    supabase.from("orientacion_tests").select("*").eq("orientado_id", id).order("fecha", { ascending: false }),
    supabase.from("orientacion_notas").select("*").eq("orientado_id", id).order("created_at", { ascending: false }),
    supabase.from("orientacion_recursos").select("*").eq("orientado_id", id).order("created_at", { ascending: false }),
    orientadoData.alumno_id
      ? supabase.from("profiles").select("*").eq("id", orientadoData.alumno_id).single()
      : Promise.resolve({ data: null }),
  ]);

  const sesionesList = (sesiones ?? []) as OrientacionSesion[];
  const planData = (plan ?? null) as OrientacionPlan | null;
  const testsList = (tests ?? []) as OrientacionTest[];
  const notasList = (notas ?? []) as OrientacionNota[];
  const recursosList = (recursos ?? []) as OrientacionRecurso[];
  const alumnoPerfil = alumnoVinculado as Profile | null;

  const rutasTest = testsList.filter((t) => t.storage_path).map((t) => t.storage_path as string);
  const urlPorTest: Record<string, string> = {};
  if (rutasTest.length > 0) {
    const { data: signedUrls } = await supabase.storage.from(ORIENTACION_TESTS_BUCKET).createSignedUrls(rutasTest, 3600);
    for (const s of signedUrls ?? []) {
      if (s.signedUrl && s.path) urlPorTest[s.path] = s.signedUrl;
    }
  }
  const rutasRecurso = recursosList.filter((r) => r.storage_path).map((r) => r.storage_path as string);
  const urlPorRecurso: Record<string, string> = {};
  if (rutasRecurso.length > 0) {
    const { data: signedUrls } = await supabase.storage.from(ORIENTACION_RECURSOS_BUCKET).createSignedUrls(rutasRecurso, 3600);
    for (const s of signedUrls ?? []) {
      if (s.signedUrl && s.path) urlPorRecurso[s.path] = s.signedUrl;
    }
  }

  const hoy = new Date().toISOString().slice(0, 10);
  const proximas = sesionesList.filter((s) => s.fecha >= hoy).sort((a, b) => a.fecha.localeCompare(b.fecha));
  const historial = sesionesList.filter((s) => s.fecha < hoy);
  const proximasVisibles = proximas.slice(0, 3);
  const historialVisible = historial.slice(0, 3);
  const proximaSesion = proximas.find((s) => s.estado === "pendiente") ?? proximas[0] ?? null;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link href="/portal/orientados" className="text-muted inline-flex w-fit items-center gap-1.5 text-sm hover:text-fg">
        <ArrowLeft size={14} /> Volver a orientación vocacional
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
            <h1 className="text-2xl font-semibold">{orientadoData.nombre}</h1>
            {alumnoPerfil && <p className="text-muted text-sm">Vinculado a {alumnoPerfil.nombre_completo}</p>}
            {!orientadoData.activo && <p className="text-muted text-sm">Archivado</p>}
          </div>
        </div>
        {esCoach && (
          <div className="flex shrink-0 items-center gap-1">
            <ArchivarOrientadoButton id={id} activo={orientadoData.activo} />
            {!orientadoData.activo && (
              <ConfirmDeleteButton
                accion={eliminarOrientado.bind(null, id)}
                mensaje={`¿Eliminar definitivamente a ${orientadoData.nombre}? Se borrarán también sus sesiones, tests, plan, notas y recursos. Esto no se puede deshacer.`}
                className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium text-jom-pink hover:bg-jom-pink/20"
                redirectTo="/portal/orientados"
              >
                <Trash2 size={13} />
                Eliminar
              </ConfirmDeleteButton>
            )}
          </div>
        )}
      </div>

      <div className="glass flex flex-col gap-3 rounded-2xl p-5">
        <p className="text-sm font-semibold">Ficha</p>
        {orientadoData.objetivo && <p className="text-sm">{orientadoData.objetivo}</p>}
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

      <div className="glass flex flex-col gap-3 rounded-2xl p-5">
        <p className="text-sm font-semibold">Plan</p>
        {esCoach ? (
          <PlanOrientacionForm orientadoId={id} plan={planData} />
        ) : planData ? (
          <PlanOrientacionResumen plan={planData} />
        ) : (
          <p className="text-muted text-sm">Todavía no hay un plan registrado.</p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Sesiones</p>
          {esCoach && <NuevoAgendamientoOrientacionForm orientadoId={id} />}
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
                    {esCoach ? (
                      <OrientadoQuickActions sesionId={s.id} estadoInicial={s.estado} notaInicial={s.nota} accionable={s.fecha <= hoy} permitirEliminar />
                    ) : (
                      <span className="text-muted text-xs">{s.nota ? "Con nota" : ""}</span>
                    )}
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
                    {esCoach ? (
                      <OrientadoQuickActions sesionId={s.id} estadoInicial={s.estado} notaInicial={s.nota} accionable={s.fecha <= hoy} />
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-5">
        <TestsOrientacionSection orientadoId={id} tests={testsList} urlPorArchivo={urlPorTest} soloLectura={!esCoach} />
      </div>

      <div className="glass rounded-2xl p-5">
        <NotasOrientacionSection orientadoId={id} notas={notasList} soloLectura={!esCoach} />
      </div>

      <div className="glass rounded-2xl p-5">
        <RecursosOrientacionSection
          orientadoId={id}
          recursos={recursosList}
          urlPorArchivo={urlPorRecurso}
          soloLectura={!esCoach}
          titulo="Recursos de este caso"
        />
      </div>
    </div>
  );
}
