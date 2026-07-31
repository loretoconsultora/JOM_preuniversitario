"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean | null>(null);

  useEffect(() => {
    // Lee la preferencia guardada solo en cliente (evita mismatch de hidratación
    // frente al placeholder que se renderiza en el servidor).
    const stored = localStorage.getItem("jom-theme");
    if (stored === "dark") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync inicial desde localStorage, no estado derivado
      setIsDark(true);
    } else if (stored === "light") {
      setIsDark(false);
    } else {
      setIsDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
  }, []);

  useEffect(() => {
    if (isDark === null) return;
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    localStorage.setItem("jom-theme", isDark ? "dark" : "light");
  }, [isDark]);

  if (isDark === null) {
    return <div className="h-9 w-9" />;
  }

  return (
    <button
      type="button"
      onClick={() => setIsDark((prev) => !prev)}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      className="glass flex h-9 w-9 items-center justify-center rounded-full transition-opacity hover:opacity-80"
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
