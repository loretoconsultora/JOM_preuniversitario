import { Check } from "lucide-react";
import type { OrientacionPlan } from "@/types/database";

function formatFecha(fecha: string) {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
}

export function PlanOrientacionResumen({ plan }: { plan: OrientacionPlan }) {
  const pendientes = plan.proximos_pasos
    .filter((p) => !p.completado)
    .sort((a, b) => {
      if (a.fecha && b.fecha) return a.fecha.localeCompare(b.fecha);
      if (a.fecha) return -1;
      if (b.fecha) return 1;
      return 0;
    });
  const completados = plan.proximos_pasos.filter((p) => p.completado);

  const sinNada =
    !plan.metas && plan.carreras_interes.length === 0 && plan.universidades_interes.length === 0 && plan.proximos_pasos.length === 0;

  if (sinNada) return <p className="text-muted text-sm">Todavía no hay un plan registrado.</p>;

  return (
    <div className="flex flex-col gap-3 text-sm">
      {plan.metas && (
        <p>
          <span className="text-muted">Metas:</span> {plan.metas}
        </p>
      )}

      {plan.carreras_interes.length > 0 && (
        <div>
          <span className="text-muted">Carreras de interés:</span>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {plan.carreras_interes.map((c, i) => (
              <span
                key={`${c}-${i}`}
                className={`rounded-full px-3 py-1 text-xs font-medium text-jom-ink ${i % 2 === 0 ? "bg-jom-pink/40" : "bg-jom-yellow/50"}`}
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {plan.universidades_interes.length > 0 && (
        <div>
          <span className="text-muted">Universidades de interés:</span>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {plan.universidades_interes.map((u, i) => (
              <span
                key={`${u}-${i}`}
                className={`rounded-full px-3 py-1 text-xs font-medium text-jom-ink ${i % 2 === 0 ? "bg-jom-pink/40" : "bg-jom-yellow/50"}`}
              >
                {u}
              </span>
            ))}
          </div>
        </div>
      )}

      {plan.proximos_pasos.length > 0 && (
        <div>
          <span className="text-muted">Próximos pasos:</span>
          <div className={`mt-1 grid gap-3 ${completados.length > 0 ? "sm:grid-cols-2" : ""}`}>
            <div className="flex flex-col gap-1.5">
              {pendientes.length === 0 ? (
                <p className="text-muted text-xs">No hay pasos pendientes.</p>
              ) : (
                pendientes.map((p) => (
                  <div key={p.id} className="flex items-baseline gap-2">
                    <span className="text-sm">{p.texto}</span>
                    {p.fecha && <span className="text-muted text-xs">{formatFecha(p.fecha)}</span>}
                  </div>
                ))
              )}
            </div>
            {completados.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <p className="text-muted text-xs font-medium uppercase">Completados</p>
                {completados.map((p) => (
                  <div key={p.id} className="flex items-baseline gap-2 opacity-70">
                    <Check size={12} className="text-jom-pink shrink-0" />
                    <span className="text-sm line-through">{p.texto}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
