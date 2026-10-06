export type LiveRole = "host" | "cohost" | "moderator" | "audience";

export interface LiveParticipant {
  uid: string | number;
  name: string;
  avatarUrl?: string;
  role: LiveRole;
  videoEnabled: boolean;
  audioEnabled: boolean;
  isSpeaking?: boolean;
  networkQuality?: "excellent" | "good" | "poor" | "unknown";
  videoElementId?: string;
}

export interface LiveStats {
  viewers: number;
  likes?: number;
  comments?: number;
  gifts?: number;
}

export interface LiveAction {
  id: string;
  label: string;
  icon: string;
  visible?: boolean;
  disabled?: boolean;
  danger?: boolean;
  onClick: () => void;
}
