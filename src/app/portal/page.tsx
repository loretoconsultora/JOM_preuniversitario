import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";

export default async function PortalHome() {
  await requireProfile();
  redirect("/portal/tareas");
}
