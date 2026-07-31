"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { JomLogo } from "@/components/jom-logo";
import { ThemeToggle } from "@/components/theme-toggle";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: correo,
      password,
    });

    if (signInError) {
      setError("Correo o contraseña incorrectos.");
      setCargando(false);
      return;
    }

    const next = searchParams.get("next") || "/portal";
    router.push(next);
    router.refresh();
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 sm:px-6">
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>

      <div className="glass-strong w-full max-w-md rounded-3xl p-8 sm:p-10">
        <div className="mb-8 flex flex-col items-center">
          <JomLogo className="mb-3 text-4xl" />
          <h1 className="text-lg font-semibold">Preuniversitario</h1>
          <p className="text-muted mt-1 text-sm">Ingresa a tu portal de tareas y evaluaciones</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="relative">
            <Mail size={16} className="text-muted absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              required
              type="email"
              autoComplete="email"
              placeholder="Correo electrónico"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className="glass w-full rounded-xl py-2.5 pl-11 pr-4 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-jom-pink"
            />
          </div>
          <div className="relative">
            <Lock size={16} className="text-muted absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              required
              type="password"
              autoComplete="current-password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="glass w-full rounded-xl py-2.5 pl-11 pr-4 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-jom-pink"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-500">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-jom-ink px-6 py-3 text-sm font-semibold text-jom-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-jom-white dark:text-jom-ink"
          >
            {cargando ? "Ingresando…" : "Iniciar sesión"} {!cargando && <ArrowRight size={15} />}
          </button>
        </form>

        <p className="text-muted mt-6 text-center text-xs">
          ¿No tienes cuenta? Pide a tu profesora que te dé acceso.
        </p>
      </div>
    </main>
  );
}
