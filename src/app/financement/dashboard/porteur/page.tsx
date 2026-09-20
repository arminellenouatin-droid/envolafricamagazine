import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUserFromCookie } from "@/lib/auth";
import PorteurDashboardClient from "./PorteurDashboardClient";

export const metadata: Metadata = {
  title: "Espace Porteur de Projet — Crowdfunding",
  description: "Pilotez vos campagnes, suivez les contributions, déposez vos documents et échangez avec vos investisseurs sur Envol Africa.",
};

export default async function PorteurDashboardPage() {
  const user = await getCurrentUserFromCookie();
  if (!user) {
    redirect("/auth/login?next=/financement/dashboard/porteur");
  }

  return <PorteurDashboardClient user={user} />;
}
