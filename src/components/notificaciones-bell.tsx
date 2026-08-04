"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { marcarNotificacionLeida, marcarTodasNotificacionesLeidas } from "@/app/portal/notificaciones-actions";
import type { NotificacionDocente } from "@/types/database";

function formatRelativo(fechaISO: string) {
  const minutos = Math.round((Date.now() - new Date(fechaISO).getTime()) / 60000);
  if (minutos < 1) return "justo ahora";
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.round(horas / 24);
  return `hace ${dias} d`;
}

export function NotificacionesBell({ notificacionesIniciales }: { notificacionesIniciales: NotificacionDocente[] }) {
  const [abierto, setAbierto] = useState(false);
  const [notificaciones, setNotificaciones] = useState(notificacionesIniciales);
  const [, startTransition] = useTransition();

  const noLeidas = notificaciones.filter((n) => !n.leida).length;

  function marcarLeida(id: string) {
    setNotificaciones((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)));
    startTransition(() => {
      marcarNotificacionLeida(id);
    });
  }

  function marcarTodas() {
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
    startTransition(() => {
      marcarTodasNotificacionesLeidas();
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-label="Notificaciones"
        className="glass relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-opacity hover:opacity-80"
      >
        <Bell size={16} />
        {noLeidas > 0 && (
          <span className="bg-jom-pink text-jom-ink absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold">
            {noLeidas > 9 ? "9+" : noLeidas}
          </span>
        )}
      </button>

      {abierto && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setAbierto(false)} />
          <div className="glass-strong absolute right-0 z-20 mt-2 flex max-h-96 w-80 flex-col overflow-hidden rounded-2xl shadow-lg">
            <div className="flex items-center justify-between border-b border-black/10 px-4 py-3 dark:border-white/10">
              <p className="text-sm font-semibold">Notificaciones</p>
              {noLeidas > 0 && (
                <button
                  type="button"
                  onClick={marcarTodas}
                  className="text-muted text-xs underline underline-offset-2 hover:text-fg"
                >
                  Marcar todas como leídas
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto">
              {notificaciones.length === 0 ? (
                <p className="text-muted p-4 text-center text-xs">Sin notificaciones todavía.</p>
              ) : (
                notificaciones.map((n) => {
                  const href = n.tarea_id
                    ? `/portal/tareas#tarea-${n.tarea_id}`
                    : n.examen_id
                      ? `/portal/examenes/${n.examen_id}`
                      : "/portal/tareas";
                  return (
                    <Link
                      key={n.id}
                      href={href}
                      onClick={() => {
                        if (!n.leida) marcarLeida(n.id);
                        setAbierto(false);
                      }}
                      className={`flex items-start gap-2 border-b border-black/5 px-4 py-3 text-xs last:border-0 hover:bg-black/5 dark:border-white/5 dark:hover:bg-white/5 ${
                        n.leida ? "text-muted" : "font-medium"
                      }`}
                    >
                      {!n.leida && <span className="bg-jom-pink mt-1 h-1.5 w-1.5 shrink-0 rounded-full" />}
                      <span className="flex-1">
                        {n.mensaje}
                        <span className="text-muted mt-0.5 block text-[10px] font-normal">
                          {formatRelativo(n.created_at)}
                        </span>
                      </span>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
