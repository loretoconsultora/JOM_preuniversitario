"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { setVistaActiva } from "@/app/portal/vista-actions";
import type { Role } from "@/types/database";

const ROLE_LABEL: Record<Role, string> = {
  alumno: "Alumno",
  docente: "Docente",
  directora: "Directora",
  terapeuta: "Terapeuta",
};

export function VistaSwitcher({ roles, vistaActual }: { roles: Role[]; vistaActual: Role }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [pendiente, startTransition] = useTransition();

  function elegir(rol: Role) {
    setAbierto(false);
    startTransition(async () => {
      await setVistaActiva(rol);
      router.refresh();
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        disabled={pendiente}
        className="text-muted flex items-center gap-1 whitespace-nowrap text-xs hover:text-fg disabled:opacity-60"
      >
        Vista {ROLE_LABEL[vistaActual]} <ChevronDown size={12} />
      </button>
      {abierto && (
        <div className="glass-strong absolute right-0 top-full z-20 mt-1 flex flex-col gap-0.5 rounded-xl p-1.5">
          {roles.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => elegir(r)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-left text-xs font-medium transition-colors ${
                r === vistaActual
                  ? "bg-jom-ink text-jom-white dark:bg-jom-white dark:text-jom-ink"
                  : "hover:bg-black/5 dark:hover:bg-white/10"
              }`}
            >
              {ROLE_LABEL[r]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
