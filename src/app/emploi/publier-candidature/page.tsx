import type { Metadata } from "next";
import CandidateForm from "./CandidateForm";

export const metadata: Metadata = {
  title: "Publier ma candidature",
  description: "Déposez votre candidature et CV gratuitement pour être contacté par des recruteurs en Afrique.",
};

export default function PublishCandidatePage() { return <CandidateForm />; }
