import { Info } from "lucide-react";
import type { Homoclave } from "@/types/database";
import { HOMOCLAVE_LABEL, HOMOCLAVE_DESCRIPCION, HOMOCLAVE_CLASS } from "@/lib/estado-sesion";

const ORDEN: Homoclave[] = ["SR", "CNA", "CT", "SC"];

export function HomoclaveLeyenda() {
  return (
    <details className="glass rounded-2xl p-5">
      <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold">
        <Info size={15} /> ¿Qué significan SR / CNA / CT / SC?
      </summary>
      <div className="mt-3 flex flex-col gap-2.5">
        {ORDEN.map((h) => (
          <div key={h} className="flex items-start gap-2.5">
            <span className={`mt-0.5 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${HOMOCLAVE_CLASS[h]}`}>
              {h}
            </span>
            <p className="text-sm">
              <span className="font-medium">{HOMOCLAVE_LABEL[h]}.</span>{" "}
              <span className="text-muted">{HOMOCLAVE_DESCRIPCION[h]}</span>
            </p>
          </div>
        ))}
      </div>
    </details>
  );
}
