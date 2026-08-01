import Link from "next/link";
import { requireTerapeuta } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SesionQuickActions } from "@/components/sesion-quick-actions";
import type { EstadoSesion, Paciente } from "@/types/database";

type SesionConPaciente = {
  id: string;
  paciente_id: string;
  fecha: string;
  hora: string | null;
  estado: EstadoSesion;
  nota: string | null;
  pacientes: { nombre: string } | null;
};

function formatFecha(fecha: string) {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
}

function Grupo({ titulo, sesiones, hoy }: { titulo: string; sesiones: SesionConPaciente[]; hoy: string }) {
  if (sesiones.length === 0) return null;
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold">{titulo}</p>
      <div className="glass flex flex-col gap-3 rounded-2xl p-5">
        {sesiones.map((s) => (
          <div
            key={s.id}
            className="flex flex-col gap-1.5 border-b border-black/5 pb-3 last:border-0 last:pb-0 dark:border-white/5 sm:flex-row sm:items-start sm:justify-between"
          >
            <div>
              <Link href={`/portal/pacientes/${s.paciente_id}`} className="text-sm font-medium hover:underline">
                {s.pacientes?.nombre ?? "Paciente"}
              </Link>
              <p className="text-muted text-xs">
                {formatFecha(s.fecha)}
                {s.hora && ` · ${s.hora.slice(0, 5)}`}
              </p>
            </div>
            <SesionQuickActions sesionId={s.id} estadoInicial={s.estado} notaInicial={s.nota} accionable={s.fecha <= hoy} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ColumnaCategoria({
  titulo,
  sesiones,
}: {
  titulo: string;
  sesiones: SesionConPaciente[];
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold">
        {titulo} <span className="text-muted font-normal">({sesiones.length})</span>
      </p>
      {sesiones.length === 0 ? (
        <p className="text-muted text-sm">Sin sesiones en esta categoría.</p>
      ) : (
        <div className="glass flex flex-col gap-2.5 rounded-2xl p-4">
          {sesiones.map((s) => (
            <div key={s.id} className="border-b border-black/5 pb-2.5 last:border-0 last:pb-0 dark:border-white/5">
              <p className="text-sm font-medium">
                {formatFecha(s.fecha)}
                {s.hora && ` · ${s.hora.slice(0, 5)}`}
              </p>
              {s.nota && <p className="text-muted mt-0.5 whitespace-pre-line text-xs">{s.nota}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default async function AsistenciaPage({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string; paciente?: string }>;
}) {
  await requireTerapeuta();
  const { vista: vistaParam, paciente: pacienteIdParam } = await searchParams;
  const vista = vistaParam === "paciente" ? "paciente" : "calendario";
  const supabase = await createClient();

  const ahora = new Date();
  const hoy = ahora.toISOString().slice(0, 10);
  const en7dias = new Date(ahora.getTime() + 1000 * 60 * 60 * 24 * 7).toISOString().slice(0, 10);
  const hace7dias = new Date(ahora.getTime() - 1000 * 60 * 60 * 24 * 7).toISOString().slice(0, 10);

  const [{ data: sesiones, error }, { data: pacientes }] = await Promise.all([
    supabase
      .from("paciente_sesiones")
      .select("id, paciente_id, fecha, hora, estado, nota, pacientes(nombre)")
      .order("fecha")
      .order("hora"),
    supabase.from("pacientes").select("*").order("nombre"),
  ]);
  if (error) throw new Error(`paciente_sesiones: ${error.message}`);

  const sesionesList = (sesiones ?? []) as unknown as SesionConPaciente[];
  const pacientesList = (pacientes ?? []) as Paciente[];

  const tabClass = (activo: boolean) =>
    `rounded-full px-4 py-2 text-sm font-medium transition-colors ${
      activo ? "bg-jom-ink text-jom-white dark:bg-jom-white dark:text-jom-ink" : "glass hover:opacity-80"
    }`;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Asistencia</h1>
        <p className="text-muted text-sm">Agenda y control de asistencia de todos tus pacientes</p>
      </div>

      <div className="flex gap-1.5">
        <Link href="/portal/asistencia?vista=calendario" className={tabClass(vista === "calendario")}>
          Por calendario
        </Link>
        <Link href="/portal/asistencia?vista=paciente" className={tabClass(vista === "paciente")}>
          Por paciente
        </Link>
      </div>

      {vista === "calendario" ? (
        (() => {
          const deHoy = sesionesList.filter((s) => s.fecha === hoy);
          const proximaSemana = sesionesList.filter((s) => s.fecha > hoy && s.fecha <= en7dias);
          const semanaPasada = sesionesList
            .filter((s) => s.fecha < hoy && s.fecha >= hace7dias)
            .sort((a, b) => b.fecha.localeCompare(a.fecha));

          return deHoy.length === 0 && proximaSemana.length === 0 && semanaPasada.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center text-sm text-muted">
              No hay sesiones en los últimos ni próximos 7 días. Agenda nuevas sesiones desde la ficha de cada
              paciente.
            </div>
          ) : (
            <>
              <Grupo titulo="Hoy" sesiones={deHoy} hoy={hoy} />
              <Grupo titulo="Próximos 7 días" sesiones={proximaSemana} hoy={hoy} />
              <Grupo titulo="Últimos 7 días" sesiones={semanaPasada} hoy={hoy} />
            </>
          );
        })()
      ) : pacientesList.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center text-sm text-muted">Aún no tienes pacientes.</div>
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5">
            {pacientesList.map((p) => (
              <Link
                key={p.id}
                href={`/portal/asistencia?vista=paciente&paciente=${p.id}`}
                className={tabClass(p.id === pacienteIdParam)}
              >
                {p.nombre}
              </Link>
            ))}
          </div>

          {!pacienteIdParam ? (
            <div className="glass rounded-2xl p-8 text-center text-sm text-muted">
              Selecciona un paciente para ver su historial de asistencia.
            </div>
          ) : (
            (() => {
              const delPaciente = sesionesList
                .filter((s) => s.paciente_id === pacienteIdParam)
                .sort((a, b) => b.fecha.localeCompare(a.fecha));
              const completadas = delPaciente.filter((s) => s.estado === "asistio");
              const reprogramadas = delPaciente.filter((s) => s.estado === "reagendada");
              const canceladas = delPaciente.filter((s) => s.estado === "no_asistio");

              return (
                <div className="grid gap-4 sm:grid-cols-3">
                  <ColumnaCategoria titulo="Completadas" sesiones={completadas} />
                  <ColumnaCategoria titulo="Reprogramadas" sesiones={reprogramadas} />
                  <ColumnaCategoria titulo="Canceladas" sesiones={canceladas} />
                </div>
              );
            })()
          )}
        </>
      )}
    </div>
  );
}
