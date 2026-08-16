import { notFound } from "next/navigation";
import { readJobsDB } from "@/lib/jobs-db";
import DecryptClient from "./DecryptClient";

export default async function DecryptOfferPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const offer = readJobsDB().offers.find((item) => item.id === id && item.status === "published");
  if (!offer) notFound();
  return <DecryptClient offerId={offer.id} offerTitle={offer.title} />;
}
