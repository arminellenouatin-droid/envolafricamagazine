import React from "react";

type Props = {
  state: "idle" | "pending" | "accepted" | "joining";
  onRequest: () => void;
  onJoin: () => void;
};

export function StageRequestButton({ state, onRequest, onJoin }: Props) {
  if (state === "pending") {
    return <button className="ea-stage-cta ea-stage-cta--pending" disabled>⏳ Demande envoyée</button>;
  }

  if (state === "accepted") {
    return <button className="ea-stage-cta ea-stage-cta--accepted" onClick={onJoin}>✓ Rejoindre la scène</button>;
  }

  if (state === "joining") {
    return <button className="ea-stage-cta" disabled>Connexion à la scène…</button>;
  }

  return <button className="ea-stage-cta" onClick={onRequest}>🎤 Monter sur scène</button>;
}
