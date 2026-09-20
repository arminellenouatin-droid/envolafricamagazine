import type { Metadata } from "next";
import OfferForm from "./OfferForm";

export const metadata: Metadata = {
  title: "Publier une offre d'emploi",
  description: "Recrutez les meilleurs talents en Afrique. Deux premières publications d'offres offertes.",
};

export default function PublishOfferPage() { return <OfferForm />; }
