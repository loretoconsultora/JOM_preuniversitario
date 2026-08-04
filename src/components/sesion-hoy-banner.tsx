import { CalendarClock } from "lucide-react";
import type { SesionHoy } from "@/lib/sesiones-hoy-alumno";

function formatHora(hora: string | null) {
  if (!hora) return null;
  return new Date(`2000-01-01T${hora.slice(0, 5)}:00`).toLocaleTimeString("es-MX", {
    hour: "numeric",
    minute: "2-digit",
  });
}

// Aviso del día para el alumno, leído en vivo de la agenda del terapeuta —
// no es una notificación que se "marca como leída": simplemente aparece
// mientras siga vigente la sesión de hoy.
export function SesionHoyBanner({ sesiones }: { sesiones: SesionHoy[] }) {
  if (sesiones.length === 0) return null;

  return (
    <div className="mx-auto mb-4 flex max-w-7xl flex-col gap-1.5 px-4 sm:px-6">
      {sesiones.map((s) => {
        const hora = formatHora(s.hora);
        return (
          <div
            key={s.id}
            className="glass-strong flex items-center gap-2 rounded-2xl border border-jom-yellow px-4 py-2.5 text-sm"
          >
            <CalendarClock size={16} className="text-jom-ink shrink-0 dark:text-jom-yellow" />
            <span>
              Hoy tienes sesión de terapia con <strong>{s.terapeutaNombre}</strong>
              {hora ? (
                <>
                  {" "}
                  a las <strong>{hora}</strong>
                </>
              ) : (
                " (sin hora especificada todavía)"
              )}
              .
            </span>
          </div>
        );
      })}
    </div>
  );
}
