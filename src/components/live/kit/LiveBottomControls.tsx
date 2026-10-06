import React from "react";
import { LiveRole } from "./types";

type Props = {
  role: LiveRole;
  isCreator: boolean;
  onMicrophone?: () => void;
  onCamera?: () => void;
  onFlipCamera?: () => void;
  onStage?: () => void;
  onChat?: () => void;
  onGift?: () => void;
  onLeave: () => void;
  onEndLive: () => void;
};

export function LiveBottomControls(props: Props) {
  return (
    <div className="ea-bottom-bar">
      {props.isCreator && (
        <>
          <button className="ea-control" onClick={props.onMicrophone}>🎤<span>Micro</span></button>
          <button className="ea-control" onClick={props.onCamera}>📹<span>Caméra</span></button>
          <button className="ea-control" onClick={props.onFlipCamera}>↻<span>Retourner</span></button>
        </>
      )}

      {!props.isCreator && (
        <button className="ea-stage-cta" onClick={props.onStage}>
          🎤 <span>Monter sur scène</span>
        </button>
      )}

      <button className="ea-control" onClick={props.onChat}>💬<span>Chat</span></button>

      {props.onGift && (
        <button className="ea-control" onClick={props.onGift}>🎁<span>Cadeau</span></button>
      )}

      <button className="ea-control ea-control--leave" onClick={props.onLeave}>
        ✕<span>Quitter</span>
      </button>

      {props.isCreator && (
        <button className="ea-control ea-control--end" onClick={props.onEndLive}>
          ⏹<span>Arrêter</span>
        </button>
      )}
    </div>
  );
}
