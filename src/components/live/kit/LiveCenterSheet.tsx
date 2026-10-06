import React from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  viewers: number;
  participants: number;
  comments: number;
  onStageManagement?: () => void;
  onModeration?: () => void;
  onStats?: () => void;
  onEndLive: () => void;
};

export function LiveCenterSheet({
  open, onClose, viewers, participants, comments,
  onStageManagement, onModeration, onStats, onEndLive
}: Props) {
  if (!open) return null;

  return (
    <div className="ea-sheet-backdrop" onClick={onClose}>
      <aside className="ea-sheet" onClick={(e) => e.stopPropagation()}>
        <header>
          <strong>Live Center</strong>
          <button className="ea-icon-button" onClick={onClose}>×</button>
        </header>

        <div className="ea-center-stats">
          <span><b>{viewers.toLocaleString("fr-FR")}</b> spectateurs</span>
          <span><b>{participants}</b> participants</span>
          <span><b>{comments}</b> messages</span>
        </div>

        <button onClick={onStageManagement}>👥 Gestion de la scène</button>
        <button onClick={onModeration}>🛡 Modération</button>
        <button onClick={onStats}>📊 Statistiques</button>

        <button className="ea-sheet-danger" onClick={onEndLive}>
          🔴 Arrêter le Live
        </button>
      </aside>
    </div>
  );
}
