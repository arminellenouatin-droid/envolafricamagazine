import SalonClient from "./SalonClient";
export default async function SalonPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <SalonClient id={id} />; }
