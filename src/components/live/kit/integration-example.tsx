import React, { useState } from "react";
import { LiveShell } from "./LiveShell";
import { StageRequestButton } from "./StageRequestButton";
import { LiveCenterSheet } from "./LiveCenterSheet";
import { LiveParticipant } from "./types";
import "./live.css";

export default function ExampleLiveScreen() {
  const [centerOpen, setCenterOpen] = useState(false);
  const [stageState, setStageState] = useState<"idle"|"pending"|"accepted"|"joining">("idle");

  const participants: LiveParticipant[] = [
    {
      uid: "host",
      name: "Animateur",
      role: "host",
      videoEnabled: true,
      audioEnabled: true,
      videoElementId: "agora-video-host"
    }
  ];

  const endLive = () => {
    // IMPORTANT:
    // Ici, appeler votre vraie fonction existante:
    // 1. confirmer
    // 2. mettre le Live en ended côté serveur
    // 3. broadcast LIVE_ENDED
    // 4. Agora unpublish
    // 5. Agora leave
    // 6. cleanup
  };

  return (
    <>
      <LiveShell
        title="Salon Business"
        hostName="Envol Africa"
        stats={{ viewers: 1245, likes: 2300, comments: 382, gifts: 18 }}
        role="audience"
        participants={participants}
        onLeave={() => {/* Agora leave + cleanup */}}
        onEndLive={endLive}
        onChat={() => {/* ouvrir votre chat */}}
        onGift={() => {/* ouvrir vos cadeaux */}}
        onShare={() => {/* partager */}}
        onParticipants={() => {/* participants */}}
        onReact={() => {/* réaction */}}
        onStage={() => setStageState("pending")}
        onCamera={() => {/* Agora camera */}}
        onMicrophone={() => {/* Agora microphone */}}
        onFlipCamera={() => {/* Agora switch camera */}}
      />

      <div style={{ position: "fixed", left: 16, top: "50%", zIndex: 20 }}>
        <StageRequestButton
          state={stageState}
          onRequest={() => setStageState("pending")}
          onJoin={() => setStageState("joining")}
        />
      </div>

      <LiveCenterSheet
        open={centerOpen}
        onClose={() => setCenterOpen(false)}
        viewers={1245}
        participants={1}
        comments={382}
        onStageManagement={() => {}}
        onModeration={() => {}}
        onStats={() => {}}
        onEndLive={endLive}
      />
    </>
  );
}
