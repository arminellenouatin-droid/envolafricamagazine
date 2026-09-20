import type { Metadata } from "next";
import SubscriptionsClient from "./SubscriptionsClient";
export const metadata: Metadata = {
  title: "Abonnements & Forfaits Recrutement",
  description: "Formules d'accès et forfaits pour recruter des talents ou postuler aux offres sur Envol Africa Jobs.",
};
export default function JobsSubscriptionsPage() { return <SubscriptionsClient />; }
