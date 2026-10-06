import React from "react";
import { LiveHeader } from "./LiveHeader";
import { LiveActionRail } from "./LiveActionRail";
import { LiveBottomControls } from "./LiveBottomControls";
import { LiveComments } from "./LiveComments";
import { ParticipantGrid } from "./ParticipantGrid";
import { LiveParticipant, LiveRole, LiveStats } from "./types";

type Props = {
  title: string;
  hostName: string;
  hostAvatarUrl?: string;
  stats: LiveStats;
  role: LiveRole;
  participants: LiveParticipant[];
  children?: React.ReactNode;
  onLeave: () => void;
  onEndLive: () => void;
  onChat: () => void;
  onGift?: () => void;
  onShare?: () => void;
  onParticipants?: () => void;
  onReact?: () => void;
  onCamera?: () => void;
  onMicrophone?: () => void;
  onFlipCamera?: () => void;
  onStage?: () => void;
};

export function LiveShell(props: Props) {
  const isCreator = props.role === "host" || props.role === "cohost";

  return (
    <main className="ea-live">
      <div className="ea-live__video-layer">
        <ParticipantGrid participants={props.participants} />
        {props.children}
      </div>

      <div className="ea-live__overlay">
        <LiveHeader
          title={props.title}
          hostName={props.hostName}
          hostAvatarUrl={props.hostAvatarUrl}
          viewers={props.stats.viewers}
          onLeave={props.onLeave}
          showCreatorControls={props.role === "host"}
          onEndLive={props.onEndLive}
        />

        <LiveActionRail
          stats={props.stats}
          onReact={props.onReact}
          onChat={props.onChat}
          onGift={props.onGift}
          onParticipants={props.onParticipants}
          onShare={props.onShare}
        />

        <LiveComments onOpenChat={props.onChat} />

        <LiveBottomControls
          role={props.role}
          isCreator={isCreator}
          onMicrophone={props.onMicrophone}
          onCamera={props.onCamera}
          onFlipCamera={props.onFlipCamera}
          onStage={props.onStage}
          onChat={props.onChat}
          onGift={props.onGift}
          onLeave={props.onLeave}
          onEndLive={props.onEndLive}
        />
      </div>
    </main>
  );
}
