import type { Metadata } from "next";
import CandidatesClient from "./CandidatesClient";

export const metadata: Metadata = {
  title: "Candidats & Talents Africains",
  description: "Explorez la CVthèque des talents et professionnels qualifiés disponibles dans 54 pays d'Afrique.",
};

export default function CandidatesPage() { return <CandidatesClient />; }
