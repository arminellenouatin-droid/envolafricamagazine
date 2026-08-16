import type { Metadata } from "next";
import WabClient from "./WabClient";
export const metadata: Metadata = { title: "World Africa Business | Réseau professionnel africain", description: "Le réseau africain dédié à l’entrepreneuriat, au business, aux opportunités et à la formation." };
export default function WabPage() { return <WabClient />; }
