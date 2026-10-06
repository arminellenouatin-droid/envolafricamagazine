import React from "react";

type Props = {
  title: string;
  hostName: string;
  hostAvatarUrl?: string;
  viewers: number;
  onLeave: () => void;
  showCreatorControls?: boolean;
  onEndLive: () => void;
};

export function LiveHeader({
  title, hostName, hostAvatarUrl, viewers, onLeave,
  showCreatorControls, onEndLive
}: Props) {
  return (
    <header className="ea-live-header">
      <button className="ea-icon-button ea-icon-button--glass" onClick={onLeave} aria-label="Quitter le Live">
        <span>×</span>
      </button>

      <div className="ea-live-identity">
        <img
          className="ea-avatar"
          src={hostAvatarUrl || "/images/default-avatar.png"}
          alt=""
        />
        <div className="ea-live-identity__text">
          <strong>{hostName}</strong>
          <span>{title}</span>
        </div>
        <span className="ea-live-badge">LIVE</span>
        <span className="ea-viewer-count">{viewers.toLocaleString("fr-FR")}</span>
      </div>

      {showCreatorControls && (
        <button
          className="ea-end-mini"
          onClick={onEndLive}
          aria-label="Arrêter le Live"
        >
          ●
        </button>
      )}
    </header>
  );
}
