"use client";

import type {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  ConnectionState,
} from "agora-rtc-sdk-ng";
import { canPublish, type LiveRole, type TokenPayload } from "../roles";

export type RemoteParticipant = { uid: number; hasVideo: boolean; hasAudio: boolean };
export type NetworkQuality = { uplink: number; downlink: number }; // 0 inconnu, 1 excellent … 6 déconnecté

export type EngineCallbacks = {
  onRemoteChange: (users: RemoteParticipant[]) => void;
  onConnection: (state: ConnectionState) => void;
  onNetwork: (q: NetworkQuality) => void;
  onAutoplayBlocked: () => void;
  onError: (code: string) => void;
};

type AgoraModule = typeof import("agora-rtc-sdk-ng").default;

/**
 * Moteur vidéo : c'est la SEULE partie qui parle à Agora.
 * Il ne gère ni les votes, ni les cadeaux, ni le classement, ni le chat : ces systèmes restent les tiens.
 */
export class AgoraLiveEngine {
  private AgoraRTC: AgoraModule | null = null;
  private client: IAgoraRTCClient | null = null;
  private mic: IMicrophoneAudioTrack | null = null;
  private cam: ICameraVideoTrack | null = null;
  private remote = new Map<number, IAgoraRTCRemoteUser>();
  private role: LiveRole = "audience";
  private leaving = false;

  constructor(
    private cb: EngineCallbacks,
    private fetchToken: () => Promise<TokenPayload>,
  ) {}

  async join(first: TokenPayload) {
    this.leaving = false;
    this.role = first.role;
    const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
    this.AgoraRTC = AgoraRTC;
    AgoraRTC.setLogLevel(3); // erreurs uniquement en production

    AgoraRTC.onAutoplayFailed = () => this.cb.onAutoplayBlocked();

    // mode "live" = diffusion à grande audience (hôtes qui publient, spectateurs qui regardent)
    const client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
    this.client = client;
    this.bindEvents(client);

    if (canPublish(first.role)) {
      await client.setClientRole("host");
    } else {
      // level 1 = faible latence, plus tolérant et plus scalable que "ultra faible latence"
      await client.setClientRole("audience", { level: 1 });
    }

    await client.join(first.appId, first.channel, first.token, first.uid);

    if (canPublish(first.role)) await this.startPublishing(client);
  }

  private bindEvents(client: IAgoraRTCClient) {
    client.on("user-published", async (user, mediaType) => {
      try {
        await client.subscribe(user, mediaType);
        if (mediaType === "video") {
          // Réseau faible : bascule auto sur flux basse qualité, puis audio seul si besoin (le show reste audible)
          await client.setStreamFallbackOption(user.uid, 2).catch(() => undefined);
        }
        if (mediaType === "audio") user.audioTrack?.play();
        this.remote.set(Number(user.uid), user);
        this.emitRemote();
      } catch {
        this.cb.onError("subscribe_failed");
      }
    });
    client.on("user-unpublished", (user) => {
      this.remote.set(Number(user.uid), user);
      this.emitRemote();
    });
    client.on("user-left", (user) => {
      this.remote.delete(Number(user.uid));
      this.emitRemote();
    });
    client.on("connection-state-change", (cur) => this.cb.onConnection(cur));
    client.on("network-quality", (s) =>
      this.cb.onNetwork({ uplink: s.uplinkNetworkQuality, downlink: s.downlinkNetworkQuality }),
    );
    client.on("token-privilege-will-expire", () => void this.renew());
    client.on("token-privilege-did-expire", () => void this.renew());
    client.on("exception", () => {
      /* avertissements non bloquants du SDK */
    });
  }

  private async renew() {
    if (this.leaving || !this.client) return;
    try {
      const fresh = await this.fetchToken();
      await this.client.renewToken(fresh.token);
    } catch {
      this.cb.onError("token_renew_failed");
    }
  }

  private async startPublishing(client: IAgoraRTCClient) {
    const AgoraRTC = this.AgoraRTC!;
    try {
      const [mic, cam] = await AgoraRTC.createMicrophoneAndCameraTracks(
        { AEC: true, ANS: true, AGC: true },
        { encoderConfig: { width: 1280, height: 720, frameRate: 24, bitrateMin: 600, bitrateMax: 1800 }, optimizationMode: "motion" },
      );
      this.mic = mic;
      this.cam = cam;

      // Double flux : les spectateurs en mauvaise connexion reçoivent automatiquement la version légère
      await client.enableDualStream().catch(() => undefined);
      client.setLowStreamParameter({ width: 320, height: 180, framerate: 15, bitrate: 200 });

      await client.publish([mic, cam]);
    } catch (e) {
      const name = (e as { code?: string; name?: string })?.code ?? (e as Error)?.name ?? "";
      this.cb.onError(/PERMISSION|NotAllowed/i.test(name) ? "permission_denied" : "publish_failed");
    }
  }

  private emitRemote() {
    this.cb.onRemoteChange(
      [...this.remote.values()].map((u) => ({ uid: Number(u.uid), hasVideo: !!u.hasVideo, hasAudio: !!u.hasAudio })),
    );
  }

  // ───────────── Rendu vidéo (appelé par <AgoraStage />) ─────────────
  playLocal(el: HTMLElement) {
    this.cam?.play(el, { fit: "cover", mirror: true });
  }
  playRemote(uid: number, el: HTMLElement) {
    this.remote.get(uid)?.videoTrack?.play(el, { fit: "cover" });
  }
  /** À appeler suite à un geste de l'utilisateur si le navigateur a bloqué le son. */
  resumeAudio() {
    for (const u of this.remote.values()) u.audioTrack?.play();
  }

  // ───────────── Contrôles animateur / candidats ─────────────
  async setMic(on: boolean) {
    await this.mic?.setMuted(!on);
  }
  async setCam(on: boolean) {
    await this.cam?.setMuted(!on);
  }
  async switchCamera() {
    if (!this.AgoraRTC || !this.cam) return;
    const cams = await this.AgoraRTC.getCameras();
    if (cams.length < 2) return;
    const currentLabel = this.cam.getTrackLabel();
    const idx = cams.findIndex((c) => c.label === currentLabel);
    await this.cam.setDevice(cams[(idx + 1) % cams.length].deviceId);
  }

  async leave() {
    this.leaving = true;
    try {
      this.mic?.stop();
      this.mic?.close();
      this.cam?.stop();
      this.cam?.close();
      this.mic = null;
      this.cam = null;
      this.remote.clear();
      this.client?.removeAllListeners();
      await this.client?.leave();
    } finally {
      this.client = null;
    }
  }
}
