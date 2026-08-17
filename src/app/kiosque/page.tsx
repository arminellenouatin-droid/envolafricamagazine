import { listMagazines } from "@/lib/core-db";
import KiosqueExperience from "@/components/kiosque/KiosqueExperience";

export default async function KiosquePage() {
  const magazines = await listMagazines();
  return <KiosqueExperience initialMagazines={magazines} />;
}
