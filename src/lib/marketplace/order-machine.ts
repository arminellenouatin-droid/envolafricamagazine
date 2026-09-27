import { MarketplaceConversationStatus, MarketplaceOrderInfo } from "./types";

export const ACCEPTANCE_HOURS_DEFAULT = 48; // 48h par défaut (règle ComeUp)
export const AUTO_VALIDATION_HOURS_DEFAULT = 72; // 72h par défaut après livraison

export function calculateAcceptanceDeadline(fromDate: Date = new Date()): Date {
  const d = new Date(fromDate);
  d.setHours(d.getHours() + ACCEPTANCE_HOURS_DEFAULT);
  return d;
}

export function calculateAutoValidationDeadline(fromDate: Date = new Date()): Date {
  const d = new Date(fromDate);
  d.setHours(d.getHours() + AUTO_VALIDATION_HOURS_DEFAULT);
  return d;
}

export function isAcceptanceExpired(acceptanceDeadline?: string | null): boolean {
  if (!acceptanceDeadline) return false;
  return new Date(acceptanceDeadline).getTime() < Date.now();
}

export function isAutoValidationExpired(autoValidationDeadline?: string | null): boolean {
  if (!autoValidationDeadline) return false;
  return new Date(autoValidationDeadline).getTime() < Date.now();
}

export interface OrderActionDef {
  action:
    | "accept_order"
    | "reject_order"
    | "submit_delivery"
    | "request_revision"
    | "validate_delivery"
    | "open_dispute";
  label: string;
  role: "buyer" | "supplier" | "both";
  variant: "primary" | "secondary" | "danger";
}

/**
 * Retourne les actions contextuelles disponibles selon le statut et le rôle
 */
export function getAvailableOrderActions(
  status: MarketplaceConversationStatus,
  role: "buyer" | "supplier"
): OrderActionDef[] {
  switch (status) {
    case "order_pending_acceptance":
      if (role === "supplier") {
        return [
          { action: "accept_order", label: "Accepter la commande (48h max)", role: "supplier", variant: "primary" },
          { action: "reject_order", label: "Refuser la commande", role: "supplier", variant: "danger" },
        ];
      }
      return [
        { action: "open_dispute", label: "Signaler un problème", role: "buyer", variant: "secondary" },
      ];

    case "in_progress":
      if (role === "supplier") {
        return [
          { action: "submit_delivery", label: "Livrer la commande", role: "supplier", variant: "primary" },
          { action: "open_dispute", label: "Signaler un litige", role: "supplier", variant: "secondary" },
        ];
      }
      return [
        { action: "open_dispute", label: "Signaler un litige", role: "buyer", variant: "secondary" },
      ];

    case "delivered_pending_validation":
      if (role === "buyer") {
        return [
          { action: "validate_delivery", label: "Valider la livraison & Libérer les fonds", role: "buyer", variant: "primary" },
          { action: "request_revision", label: "Demander une révision", role: "buyer", variant: "secondary" },
          { action: "open_dispute", label: "Signaler un litige", role: "buyer", variant: "danger" },
        ];
      }
      return [
        { action: "open_dispute", label: "Signaler un litige", role: "supplier", variant: "secondary" },
      ];

    case "revision_requested":
      if (role === "supplier") {
        return [
          { action: "submit_delivery", label: "Soumettre une nouvelle livraison", role: "supplier", variant: "primary" },
          { action: "open_dispute", label: "Signaler un litige", role: "supplier", variant: "danger" },
        ];
      }
      return [
        { action: "open_dispute", label: "Signaler un litige", role: "buyer", variant: "secondary" },
      ];

    default:
      return [];
  }
}

/**
 * Message système correspondant à un changement d'état de la commande
 */
export function getStatusChangeSystemMessage(
  newStatus: MarketplaceConversationStatus,
  authorName?: string,
  extra?: { reason?: string }
): string {
  switch (newStatus) {
    case "order_pending_acceptance":
      return "Une nouvelle commande a été passée et les fonds sont sécurisés en séquestre. Le vendeur dispose de 48h pour l'accepter.";
    case "in_progress":
      return `${authorName || "Le vendeur"} a accepté la commande. Le travail de réalisation commence.`;
    case "order_rejected":
      return `La commande a été refusée ou a expiré après 48h sans acceptation. L'acheteur est intégralement remboursé.`;
    case "delivered_pending_validation":
      return `${authorName || "Le vendeur"} a soumis la livraison finale du travail. L'acheteur a 72h pour vérifier et valider la commande.`;
    case "revision_requested":
      return `${authorName || "L'acheteur"} a demandé une révision : "${extra?.reason || "Veuillez apporter les corrections demandées"}".`;
    case "completed":
      return `Commande validée avec succès ! Les fonds retenus en séquestre ont été libérés au vendeur.`;
    case "disputed":
      return `Un litige a été ouvert (${extra?.reason || "intervention demandée"}). La conversation est temporairement gelée en attente de la décision du support Envol Africa.`;
    case "refunded":
      return `Le support a procédé au remboursement de la commande.`;
    default:
      return `Statut mis à jour : ${newStatus}`;
  }
}
