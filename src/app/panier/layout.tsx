import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Panier d'achat | Envol Africa",
  description: "Finalisez vos commandes en toute sécurité.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function PanierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
