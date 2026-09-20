import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUserFromCookie } from "@/lib/auth";
import InvestisseurDashboardClient from "./InvestisseurDashboardClient";

export const metadata: Metadata = {
  title: "Espace Investisseur — Crowdfunding",
  description: "Suivez vos investissements en dons, prises de participation et prêts participatifs sur Envol Africa.",
};

export default async function InvestisseurDashboardPage() {
  const user = await getCurrentUserFromCookie();
  if (!user) {
    redirect("/auth/login?next=/financement/dashboard/investisseur");
  }

  return <InvestisseurDashboardClient user={user} />;
}
