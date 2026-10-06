import React from "react";
import { LiveParticipant } from "./types";

export function ParticipantGrid({ participants }: { participants: LiveParticipant[] }) {
  const visible = participants.slice(0, 4);

  return (
    <section className={`ea-participant-grid ea-participant-grid--${visible.length || 1}`}>
      {visible.map((p) => (
        <article className="ea-participant" key={String(p.uid)}>
          <div
            className="ea-participant__video"
            id={p.videoElementId}
            aria-label={`Vidéo de ${p.name}`}
          >
            {!p.videoEnabled && <div className="ea-participant__avatar">
              {p.avatarUrl ? <img src={p.avatarUrl} alt="" /> : p.name.slice(0, 1).toUpperCase()}
            </div>}
          </div>

          <div className="ea-participant__label">
            <span>{p.name}</span>
            <span>{p.audioEnabled ? "🎤" : "🔇"}</span>
          </div>
        </article>
      ))}
    </section>
  );
}
