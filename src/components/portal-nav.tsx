"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, GraduationCap, Users } from "lucide-react";
import type { Role } from "@/types/database";

const ALL_ITEMS = [
  { href: "/portal/tareas", label: "Tareas", icon: ClipboardList, roles: ["alumno", "docente", "directora"] },
  { href: "/portal/evaluaciones", label: "Evaluaciones", icon: GraduationCap, roles: ["alumno", "docente", "directora"] },
  { href: "/portal/alumnos", label: "Alumnos", icon: Users, roles: ["docente", "directora"] },
] as const;

export function PortalNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = ALL_ITEMS.filter((item) => (item.roles as readonly string[]).includes(role));

  return (
    <nav className="flex items-center gap-1">
      {items.map((item) => {
        const active = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors sm:px-4 ${
              active
                ? "bg-jom-ink text-jom-white dark:bg-jom-white dark:text-jom-ink"
                : "text-fg/70 hover:bg-black/5 dark:hover:bg-white/10"
            }`}
          >
            <Icon size={15} />
            <span className="hidden sm:inline">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
