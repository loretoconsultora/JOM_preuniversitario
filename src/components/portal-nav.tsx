"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  GraduationCap,
  Users,
  FileQuestion,
  FolderOpen,
  BookOpen,
  HeartHandshake,
  HeartPulse,
  CalendarCheck,
  ClipboardCheck,
  Presentation,
  UserCheck,
  MessagesSquare,
  Compass,
  Brain,
} from "lucide-react";
import type { Role } from "@/types/database";

const ALL_ITEMS = [
  { href: "/portal/temario", label: "Temario", icon: BookOpen, roles: ["alumno", "docente", "directora"] },
  { href: "/portal/tareas", label: "Tareas", icon: ClipboardList, roles: ["alumno", "docente", "directora"] },
  { href: "/portal/examenes", label: "Exámenes", icon: FileQuestion, roles: ["alumno", "docente", "directora"] },
  { href: "/portal/calificaciones", label: "Calificaciones", icon: GraduationCap, roles: ["alumno", "docente", "directora"] },
  { href: "/portal/recursos", label: "Recursos", icon: FolderOpen, roles: ["alumno", "docente", "directora"] },
  { href: "/portal/foro", label: "Foro", icon: MessagesSquare, roles: ["alumno", "docente", "directora"] },
  { href: "/portal/asistencia-academica", label: "Asistencia", icon: UserCheck, roles: ["docente", "directora"] },
  {
    href: "/portal/alumnos",
    label: "Alumnos",
    icon: Users,
    roles: ["docente", "directora"],
    ocultoSiAcotado: true,
  },
  {
    href: "/portal/docentes",
    label: "Docentes",
    icon: Presentation,
    roles: ["docente", "directora"],
    ocultoSiAcotado: true,
  },
  { href: "/portal/pacientes", label: "Pacientes", icon: HeartHandshake, roles: ["terapeuta"] },
  { href: "/portal/asistencia", label: "Asistencia", icon: CalendarCheck, roles: ["terapeuta"] },
  { href: "/portal/evaluaciones-habilidades", label: "Evaluaciones", icon: ClipboardCheck, roles: ["terapeuta"] },
  { href: "/portal/orientados", label: "Orientación vocacional", icon: Compass, roles: ["coach_vocacional", "directora"] },
  { href: "/portal/psicopedagogia", label: "Psicopedagogía", icon: Brain, roles: ["psicopedagogia"] },
  { href: "/portal/seguimiento-psicopedagogia", label: "Psicopedagogía", icon: Brain, roles: ["directora"] },
  { href: "/portal/seguimiento-salud", label: "Seguimiento de salud", icon: HeartPulse, roles: ["directora"] },
  {
    href: "/portal/mi-orientacion",
    label: "Mi orientación vocacional",
    icon: Compass,
    roles: ["alumno"],
    ocultoSiSinOrientacion: true,
  },
  {
    href: "/portal/mi-psicopedagogia",
    label: "Mi psicopedagogía",
    icon: Brain,
    roles: ["alumno"],
    ocultoSiSinPsicopedagogia: true,
  },
] as const;

export function PortalNav({
  role,
  acotado = false,
  tieneOrientacion = false,
  tienePsicopedagogia = false,
}: {
  role: Role;
  acotado?: boolean;
  tieneOrientacion?: boolean;
  tienePsicopedagogia?: boolean;
}) {
  const pathname = usePathname();
  const items = ALL_ITEMS.filter((item) => {
    if (!(item.roles as readonly string[]).includes(role)) return false;
    if (acotado && "ocultoSiAcotado" in item && item.ocultoSiAcotado) return false;
    if ("ocultoSiSinOrientacion" in item && item.ocultoSiSinOrientacion && !tieneOrientacion) return false;
    if ("ocultoSiSinPsicopedagogia" in item && item.ocultoSiSinPsicopedagogia && !tienePsicopedagogia) return false;
    return true;
  });

  return (
    <nav className="flex items-center gap-1">
      {items.map((item) => {
        const active = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium transition-colors sm:px-4 ${
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
