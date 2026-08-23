// Route de compatibilité : le produit Crowdfunding est servi par l’espace historique /financement.
import { redirect } from "next/navigation";

export default function CrowdfundingRedirect() {
  redirect("/financement");
}
