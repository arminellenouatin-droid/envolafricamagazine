import React from "react";
import { LiveStats } from "./types";

type Props = {
  stats: LiveStats;
  onReact?: () => void;
  onChat?: () => void;
  onGift?: () => void;
  onParticipants?: () => void;
  onShare?: () => void;
};

function Action({ icon, label, value, onClick }: {
  icon: string; label: string; value?: number; onClick?: () => void
}) {
  return (
    <button className="ea-action" onClick={onClick} aria-label={label}>
      <span className="ea-action__icon">{icon}</span>
      {typeof value === "number" && <small>{value.toLocaleString("fr-FR")}</small>}
    </button>
  );
}

export function LiveActionRail({ stats, onReact, onChat, onGift, onParticipants, onShare }: Props) {
  return (
    <nav className="ea-action-rail" aria-label="Actions du Live">
      <Action icon="♡" label="Réagir" value={stats.likes} onClick={onReact} />
      <Action icon="◌" label="Commentaires" value={stats.comments} onClick={onChat} />
      <Action icon="🎁" label="Envoyer un cadeau" value={stats.gifts} onClick={onGift} />
      <Action icon="♙" label="Participants" onClick={onParticipants} />
      <Action icon="↗" label="Partager" onClick={onShare} />
    </nav>
  );
}
