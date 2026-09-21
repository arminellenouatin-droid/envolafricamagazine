import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export type LiveEventType =
  | "comment"
  | "reaction"
  | "gift"
  | "donation"
  | "pot_increase"
  | "candidate_join"
  | "candidate_leave"
  | "candidate_stage_request"
  | "speaker_change"
  | "announcement"
  | "pin_comment"
  | "mod_alert"
  | "mod_action";

export interface LiveEventPayload {
  id?: string;
  user_name?: string;
  user_id?: string;
  user_avatar?: string;
  content?: string;
  gift_name?: string;
  gift_icon?: string;
  amount_xof?: number;
  points?: number;
  candidate_id?: string;
  candidate_name?: string;
  candidate_avatar?: string;
  speaker_id?: string;
  announcement?: string;
  pinned_comment_id?: string;
  reaction_type?: string;
  mod_action_type?: "delete" | "hide" | "warn" | "mute" | "ban" | "unban";
  target_user_id?: string;
  target_user_name?: string;
  reason?: string;
  created_at?: string;
}

export interface LiveMessageItem {
  id: string;
  user: string;
  userId?: string;
  avatar?: string;
  text: string;
  time: string;
  isGift?: boolean;
  giftIcon?: string;
  giftName?: string;
  isDonation?: boolean;
  amountXof?: number;
  isPinned?: boolean;
  isFlagged?: boolean;
  isModerated?: boolean;
  isBanned?: boolean;
}

export interface RankingCandidate {
  id: string;
  name: string;
  photoUrl?: string;
  votes: number;
  points?: number;
  pos: number;
  change: "up" | "down" | "stable";
  isLiveSpeaker?: boolean;
}

// Mots sensibles pour surlignage automatique côté modérateur
export const SENSITIVE_WORDS = [
  "arnaque", "fraude", "voleur", "faux", "escroc", "merde", "putain", "con",
  "salaud", "idiot", "bâtard", "tuer", "fake", "scam", "cheat", "triche", "nul"
];

export function checkIsFlagged(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return SENSITIVE_WORDS.some(word => lower.includes(word));
}

export class LiveRealtimeSession {
  private channel: any = null;
  private channelName: string;
  private listeners: Map<string, Set<(payload: any) => void>> = new Map();

  constructor(sessionId: string) {
    this.channelName = `awards_live_${sessionId}`;
  }

  public connect(onPresenceUpdate?: (count: number) => void) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    this.channel = supabase.channel(this.channelName, {
      config: {
        broadcast: { self: true },
        presence: { key: `viewer_${Math.random().toString(36).slice(2, 9)}` },
      },
    });

    this.channel
      .on("broadcast", { event: "live_event" }, ({ payload }: { payload: { type: LiveEventType; data: LiveEventPayload } }) => {
        if (!payload || !payload.type) return;
        const set = this.listeners.get(payload.type);
        if (set) {
          set.forEach(cb => cb(payload.data));
        }
        const globalSet = this.listeners.get("*");
        if (globalSet) {
          globalSet.forEach(cb => cb({ type: payload.type, data: payload.data }));
        }
      })
      .on("presence", { event: "sync" }, () => {
        if (!this.channel) return;
        const state = this.channel.presenceState();
        const total = Object.keys(state).length;
        if (onPresenceUpdate) onPresenceUpdate(Math.max(1, total));
      })
      .subscribe(async (status: string) => {
        if (status === "SUBSCRIBED") {
          await this.channel.track({ online_at: new Date().toISOString() }).catch(() => {});
        }
      });
  }

  public on(eventType: LiveEventType | "*", callback: (payload: any) => void) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);
  }

  public off(eventType: LiveEventType | "*", callback: (payload: any) => void) {
    const set = this.listeners.get(eventType);
    if (set) {
      set.delete(callback);
    }
  }

  public async broadcast(type: LiveEventType, data: LiveEventPayload) {
    if (!this.channel) {
      // Local fallback trigger
      const set = this.listeners.get(type);
      if (set) set.forEach(cb => cb(data));
      const globalSet = this.listeners.get("*");
      if (globalSet) globalSet.forEach(cb => cb({ type, data }));
      return;
    }

    try {
      await this.channel.send({
        type: "broadcast",
        event: "live_event",
        payload: { type, data: { ...data, created_at: new Date().toISOString() } },
      });
    } catch (e) {
      console.warn("Realtime broadcast failed, fallback local", e);
      const set = this.listeners.get(type);
      if (set) set.forEach(cb => cb(data));
    }
  }

  public async sendReaction(reactionType = "heart") {
    await this.broadcast("reaction", { reaction_type: reactionType });
  }

  public async sendModAlert(reason: string) {
    await this.broadcast("mod_alert", { reason });
  }

  public async sendCandidateStageRequest(payload: {
    candidate_id: string;
    candidate_name: string;
    status: "wants_stage" | "left_stage";
  }) {
    await this.broadcast("candidate_stage_request", {
      candidate_id: payload.candidate_id,
      candidate_name: payload.candidate_name,
      reason: payload.status,
    });
  }

  public disconnect() {
    if (this.channel) {
      const supabase = getSupabaseBrowserClient();
      if (supabase) supabase.removeChannel(this.channel);
      this.channel = null;
    }
    this.listeners.clear();
  }
}
