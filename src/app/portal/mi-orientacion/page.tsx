import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type {
  Orientado,
  OrientacionNota,
  OrientacionPlan,
  OrientacionRecurso,
  OrientacionSesion,
  OrientacionTest,
  OrientacionTestPregunta,
  OrientacionTestRespuesta,
} from "@/types/database";
import { ORIENTACION_RECURSOS_BUCKET, ORIENTACION_TESTS_BUCKET } from "@/lib/storage";
import { NotasOrientacionSection } from "@/components/notas-orientacion-section";
import { PlanOrientacionResumen } from "@/components/plan-orientacion-resumen";
import { TestsOrientacionSection } from "@/components/tests-orientacion-section";
import { RecursosOrientacionSection } from "@/components/recursos-orientacion-section";
import { ESTADO_LABEL, ESTADO_CLASS } from "@/lib/estado-sesion";

function formatFecha(fecha: string) {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" });
}

export default async function MiOrientacionPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: orientado } = await supabase
    .from("orientados")
    .select("*")
    .eq("alumno_id", profile.id)
    .maybeSingle();

  if (!orientado) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <h1 className="text-2xl font-semibold">Orientación vocacional</h1>
        <div className="glass rounded-2xl p-8 text-center text-sm text-muted">
          Todavía no tienes un coach vocacional asignado.
        </div>
      </div>
    );
  }

  const orientadoData = orientado as Orientado;
  const id = orientadoData.id;

  const [{ data: sesiones }, { data: plan }, { data: tests }, { data: notas }, { data: recursosCaso }, { data: recursosGenerales }] =
    await Promise.all([
      supabase.from("orientacion_sesiones").select("*").eq("orientado_id", id).order("fecha", { ascending: false }),
      supabase.from("orientacion_plan").select("*").eq("orientado_id", id).maybeSingle(),
      supabase.from("orientacion_tests").select("*").eq("orientado_id", id).order("fecha", { ascending: false }),
      supabase.from("orientacion_notas").select("*").eq("orientado_id", id).order("created_at", { ascending: false }),
      supabase.from("orientacion_recursos").select("*").eq("orientado_id", id).order("created_at", { ascending: false }),
      supabase
        .from("orientacion_recursos")
        .select("*")
        .eq("coach_id", orientadoData.coach_id)
        .is("orientado_id", null)
        .order("created_at", { ascending: false }),
    ]);

  const sesionesList = (sesiones ?? []) as OrientacionSesion[];
  const planData = (plan ?? null) as OrientacionPlan | null;
  const testsList = (tests ?? []) as OrientacionTest[];
  const notasList = (notas ?? []) as OrientacionNota[];
  const recursosList = [...((recursosCaso ?? []) as OrientacionRecurso[]), ...((recursosGenerales ?? []) as OrientacionRecurso[])];

  const testIdsInteractivos = testsList.filter((t) => t.modo === "interactivo").map((t) => t.id);
  const [{ data: preguntasTests }, { data: respuestasTests }] =
    testIdsInteractivos.length > 0
      ? await Promise.all([
          supabase.from("orientacion_test_preguntas").select("*").in("test_id", testIdsInteractivos).order("orden"),
          supabase.from("orientacion_test_respuesta").select("*").in("test_id", testIdsInteractivos),
        ])
      : [{ data: [] as OrientacionTestPregunta[] }, { data: [] as OrientacionTestRespuesta[] }];
  const preguntasPorTest: Record<string, OrientacionTestPregunta[]> = {};
  for (const p of (preguntasTests ?? []) as OrientacionTestPregunta[]) {
    (preguntasPorTest[p.test_id] ??= []).push(p);
  }
  const respuestaPorTest: Record<string, OrientacionTestRespuesta | null> = {};
  for (const r of (respuestasTests ?? []) as OrientacionTestRespuesta[]) {
    respuestaPorTest[r.test_id] = r;
  }

  const rutas = [...testsList.map((t) => t.storage_path), ...recursosList.map((r) => r.storage_path)].filter(
    (p): p is string => Boolean(p)
  );
  const urlPorPath: Record<string, string> = {};
  if (rutas.length > 0) {
    const [testUrls, recursoUrls] = await Promise.all([
      supabase.storage.from(ORIENTACION_TESTS_BUCKET).createSignedUrls(rutas, 3600),
      supabase.storage.from(ORIENTACION_RECURSOS_BUCKET).createSignedUrls(rutas, 3600),
    ]);
    for (const s of [...(testUrls.data ?? []), ...(recursoUrls.data ?? [])]) {
      if (s.signedUrl && s.path) urlPorPath[s.path] = s.signedUrl;
    }
  }

  const hoy = new Date().toISOString().slice(0, 10);
  const proximas = sesionesList.filter((s) => s.fecha >= hoy).sort((a, b) => a.fecha.localeCompare(b.fecha));
  const historial = sesionesList.filter((s) => s.fecha < hoy);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Orientación vocacional</h1>
        {orientadoData.objetivo && <p className="text-muted text-sm">{orientadoData.objetivo}</p>}
      </div>

      <div className="glass flex flex-col gap-3 rounded-2xl p-5">
        <p className="text-sm font-semibold">Mi plan</p>
        {planData ? (
          <PlanOrientacionResumen plan={planData} />
        ) : (
          <p className="text-muted text-sm">Tu coach todavía no registró un plan.</p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold">Sesiones</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <p className="text-muted text-xs font-medium uppercase">Próximas</p>
            {proximas.length === 0 ? (
              <p className="text-muted text-sm">No hay sesiones agendadas.</p>
            ) : (
              <div className="glass flex flex-col gap-2 rounded-2xl p-4">
                {proximas.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-2 border-b border-black/5 pb-2 last:border-0 last:pb-0 dark:border-white/5">
                    <span className="text-sm">
                      {formatFecha(s.fecha)}
                      {s.hora && ` · ${s.hora.slice(0, 5)}`}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_CLASS[s.estado]}`}>{ESTADO_LABEL[s.estado]}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-muted text-xs font-medium uppercase">Historial</p>
            {historial.length === 0 ? (
              <p className="text-muted text-sm">Todavía no hay sesiones pasadas.</p>
            ) : (
              <div className="glass flex flex-col gap-2 rounded-2xl p-4">
                {historial.slice(0, 5).map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-2 border-b border-black/5 pb-2 last:border-0 last:pb-0 dark:border-white/5">
                    <span className="text-sm">{formatFecha(s.fecha)}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_CLASS[s.estado]}`}>{ESTADO_LABEL[s.estado]}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-5">
        <TestsOrientacionSection
          orientadoId={id}
          tests={testsList}
          urlPorArchivo={urlPorPath}
          preguntasPorTest={preguntasPorTest}
          respuestaPorTest={respuestaPorTest}
          soloLectura
          puedeResponder
        />
      </div>

      <div className="glass rounded-2xl p-5">
        <NotasOrientacionSection orientadoId={id} notas={notasList} soloLectura />
      </div>

      <div className="glass rounded-2xl p-5">
        <RecursosOrientacionSection orientadoId={id} recursos={recursosList} urlPorArchivo={urlPorPath} soloLectura titulo="Recursos" />
      </div>

      <Link href="/portal/tareas" className="text-muted text-center text-xs hover:text-fg">
        Volver al portal
      </Link>
    </div>
  );
}
