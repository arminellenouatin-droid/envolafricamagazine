"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { ActiveAudioCall } from "@/app/api/messages/call/route";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

interface AudioCallModalProps {
  currentUserId: string;
  call: ActiveAudioCall;
  onCallUpdate: (updatedCall: ActiveAudioCall | null) => void;
  onClose: () => void;
}

export default function AudioCallModal({
  currentUserId,
  call,
  onCallUpdate,
  onClose,
}: AudioCallModalProps) {
  const isCaller = call.callerId === currentUserId;
  const isRecipient = call.recipientId === currentUserId;

  const [callStatus, setCallStatus] = useState<ActiveAudioCall["status"]>(call.status);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const ringtoneCtxRef = useRef<AudioContext | null>(null);
  const ringtoneIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const channelRef = useRef<any>(null);
  const offerRef = useRef<RTCSessionDescriptionInit | null>(call.offer || null);
  const answerRef = useRef<RTCSessionDescriptionInit | null>(call.answer || null);
  const callerStartedRef = useRef(false);
  const recipientRingtoneStartedRef = useRef(false);

  // Play Gentle Ringtone via Web Audio API
  const startRingtone = useCallback(() => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      if (ringtoneCtxRef.current) return;

      const ctx = new AudioCtx();
      ringtoneCtxRef.current = ctx;

      const playBeep = () => {
        if (!ringtoneCtxRef.current) return;
        if (ctx.state === "suspended") ctx.resume();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.8);
      };

      playBeep();
      ringtoneIntervalRef.current = setInterval(playBeep, 2400);
    } catch {}
  }, []);

  const stopRingtone = useCallback(() => {
    if (ringtoneIntervalRef.current) {
      clearInterval(ringtoneIntervalRef.current);
      ringtoneIntervalRef.current = null;
    }
    if (ringtoneCtxRef.current) {
      ringtoneCtxRef.current.close().catch(() => {});
      ringtoneCtxRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  const cleanupMedia = useCallback(() => {
    stopRingtone();
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (channelRef.current) {
      try {
        const supabase = getSupabaseBrowserClient();
        if (supabase) supabase.removeChannel(channelRef.current);
      } catch {}
      channelRef.current = null;
    }
  }, [stopRingtone]);

  // Setup WebRTC PeerConnection
  const initWebRTC = useCallback(async () => {
    if (pcRef.current) return pcRef.current;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
        ],
      });
      pcRef.current = pc;

      // Add local audio tracks
      stream.getAudioTracks().forEach((track) => pc.addTrack(track, stream));

      // Handle remote audio stream
      pc.ontrack = (event) => {
        if (remoteAudioRef.current && event.streams[0]) {
          remoteAudioRef.current.srcObject = event.streams[0];
          remoteAudioRef.current.volume = isSpeakerOn ? 1.0 : 0.2;
          remoteAudioRef.current.muted = false;
          const playPromise = remoteAudioRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch((err) => {
              console.warn("[WebRTC] Lecture audio automatique en attente :", err);
            });
          }
        }
      };

      // Handle ICE Candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const candidateData = event.candidate.toJSON();

          // Broadcast via Supabase Realtime
          if (channelRef.current) {
            channelRef.current.send({
              type: "broadcast",
              event: "webrtc_ice",
              payload: { candidate: candidateData, senderId: currentUserId },
            });
          }

          // Fallback via API
          fetch("/api/messages/call", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "signal",
              callId: call.id,
              candidate: candidateData,
            }),
          }).catch(() => {});
        }
      };

      return pc;
    } catch (err: any) {
      console.error("[WebRTC] Erreur microphone :", err);
      setErrorMessage("Impossible d'accéder au microphone. Veuillez autoriser l'accès audio.");
      return null;
    }
  }, [call.id, currentUserId, isSpeakerOn]);

  // Caller: create Offer
  const startCallingAsCaller = useCallback(async () => {
    if (callerStartedRef.current) return;
    callerStartedRef.current = true;

    startRingtone();
    const pc = await initWebRTC();
    if (!pc) return;

    try {
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
      });
      await pc.setLocalDescription(offer);
      offerRef.current = { type: offer.type, sdp: offer.sdp };

      // Broadcast offer via Supabase Realtime
      if (channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "webrtc_offer",
          payload: { offer: { type: offer.type, sdp: offer.sdp } },
        });
      }

      // Persist offer via API
      await fetch("/api/messages/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "signal",
          callId: call.id,
          offer: { type: offer.type, sdp: offer.sdp },
        }),
      });
    } catch (e) {
      console.error("[WebRTC] Erreur création offre :", e);
    }
  }, [call.id, initWebRTC, startRingtone]);

  // Recipient: Accept Call
  const handleAcceptCall = async () => {
    stopRingtone();
    setCallStatus("connected");

    const pc = await initWebRTC();
    if (!pc) return;

    // Débloquer l'élément audio de façon synchrone suite au clic utilisateur
    if (remoteAudioRef.current) {
      remoteAudioRef.current.play().catch(() => {});
    }

    let currentOffer = offerRef.current;

    // Si l'offre n'a pas encore été reçue, demander via Supabase Realtime et interroger l'API
    if (!currentOffer) {
      if (channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "request_offer",
          payload: {},
        });
      }

      for (let attempt = 0; attempt < 6; attempt++) {
        try {
          const res = await fetch(`/api/messages/call?callId=${encodeURIComponent(call.id)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.call?.offer) {
              currentOffer = data.call.offer;
              offerRef.current = currentOffer;
              break;
            }
          }
        } catch {}
        await new Promise((r) => setTimeout(r, 400));
      }
    }

    try {
      if (currentOffer) {
        if (!pc.currentRemoteDescription) {
          await pc.setRemoteDescription(new RTCSessionDescription(currentOffer));
        }
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        answerRef.current = { type: answer.type, sdp: answer.sdp };

        // Broadcast answer via Supabase Realtime
        if (channelRef.current) {
          channelRef.current.send({
            type: "broadcast",
            event: "webrtc_answer",
            payload: { answer: { type: answer.type, sdp: answer.sdp } },
          });
        }

        // Persist acceptation via API
        await fetch("/api/messages/call", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "accept",
            callId: call.id,
            answer: { type: answer.type, sdp: answer.sdp },
          }),
        });
      } else {
        // Envoi simple de l'action accept si l'offre n'est pas encore prête
        await fetch("/api/messages/call", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "accept",
            callId: call.id,
          }),
        });
      }
    } catch (e) {
      console.error("[WebRTC] Erreur acceptation appel :", e);
    }
  };

  // Reject / Hang up
  const handleEndCall = async () => {
    cleanupMedia();

    if (channelRef.current) {
      try {
        channelRef.current.send({
          type: "broadcast",
          event: "call_ended",
          payload: { by: currentUserId },
        });
      } catch {}
    }

    const action = callStatus === "ringing" && isRecipient ? "reject" : "end";
    try {
      await fetch("/api/messages/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, callId: call.id }),
      });
    } catch {}
    onCallUpdate(null);
    onClose();
  };

  // Toggle Mute
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted;
        setIsMuted(!isMuted);
      }
    }
  };

  // Connect to Supabase Realtime for instant WebRTC signaling
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const ch = supabase.channel(`wab_audio_call_${call.id}`, {
      config: { broadcast: { self: false } },
    });

    ch.on("broadcast", { event: "webrtc_offer" }, async ({ payload }: { payload: any }) => {
      if (payload?.offer) {
        offerRef.current = payload.offer;
        if (isRecipient && pcRef.current && !pcRef.current.currentRemoteDescription) {
          try {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.offer));
            const answer = await pcRef.current.createAnswer();
            await pcRef.current.setLocalDescription(answer);
            ch.send({
              type: "broadcast",
              event: "webrtc_answer",
              payload: { answer: { type: answer.type, sdp: answer.sdp } },
            });
            fetch("/api/messages/call", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "accept",
                callId: call.id,
                answer: { type: answer.type, sdp: answer.sdp },
              }),
            }).catch(() => {});
          } catch (e) {
            console.warn("[WebRTC] Erreur réponse automatique sur offre :", e);
          }
        }
      }
    });

    ch.on("broadcast", { event: "webrtc_answer" }, async ({ payload }: { payload: any }) => {
      if (payload?.answer) {
        answerRef.current = payload.answer;
        stopRingtone();
        setCallStatus("connected");
        if (pcRef.current && !pcRef.current.currentRemoteDescription) {
          try {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.answer));
          } catch (e) {
            console.warn("[WebRTC] Erreur enregistrement réponse :", e);
          }
        }
      }
    });

    ch.on("broadcast", { event: "webrtc_ice" }, async ({ payload }: { payload: any }) => {
      if (payload?.candidate && pcRef.current) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
        } catch {}
      }
    });

    ch.on("broadcast", { event: "request_offer" }, () => {
      if (isCaller && pcRef.current?.localDescription) {
        ch.send({
          type: "broadcast",
          event: "webrtc_offer",
          payload: { offer: pcRef.current.localDescription },
        });
      }
    });

    ch.on("broadcast", { event: "call_ended" }, () => {
      cleanupMedia();
      onCallUpdate(null);
      onClose();
    });

    ch.subscribe();
    channelRef.current = ch;

    return () => {
      if (supabase && ch) {
        supabase.removeChannel(ch);
      }
    };
  }, [call.id, cleanupMedia, isCaller, isRecipient, onClose, onCallUpdate, stopRingtone]);

  // Initial call behavior (Caller starts, Recipient rings)
  useEffect(() => {
    if (isCaller && callStatus === "ringing") {
      startCallingAsCaller();
    } else if (isRecipient && callStatus === "ringing" && !recipientRingtoneStartedRef.current) {
      recipientRingtoneStartedRef.current = true;
      startRingtone();
    }
  }, [isCaller, isRecipient, callStatus, startCallingAsCaller, startRingtone]);

  // Polling fallback to ensure synchronization with disk/API
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/messages/call?callId=${encodeURIComponent(call.id)}`);
        if (!res.ok) return;
        const data = await res.json();
        const latestCall: ActiveAudioCall | null = data.call;

        if (!latestCall || latestCall.status === "ended" || latestCall.status === "rejected") {
          cleanupMedia();
          onCallUpdate(null);
          onClose();
          return;
        }

        if (latestCall.status === "connected" && callStatus === "ringing") {
          stopRingtone();
          setCallStatus("connected");
        }

        if (latestCall.offer && !offerRef.current) {
          offerRef.current = latestCall.offer;
        }

        // Caller handling answer
        if (isCaller && latestCall.status === "connected" && latestCall.answer && pcRef.current) {
          stopRingtone();
          if (!pcRef.current.currentRemoteDescription) {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(latestCall.answer));
            if (Array.isArray(latestCall.recipientCandidates)) {
              for (const cand of latestCall.recipientCandidates) {
                try {
                  await pcRef.current.addIceCandidate(new RTCIceCandidate(cand));
                } catch {}
              }
            }
          }
        }
      } catch {}
    };

    pollTimerRef.current = setInterval(poll, 1500);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [call.id, callStatus, cleanupMedia, isCaller, onClose, onCallUpdate, stopRingtone]);

  // Duration timer when connected
  useEffect(() => {
    if (callStatus === "connected") {
      stopRingtone();
      durationTimerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    }
    return () => {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    };
  }, [callStatus, stopRingtone]);

  // Synchronize speaker volume
  useEffect(() => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.volume = isSpeakerOn ? 1.0 : 0.2;
    }
  }, [isSpeakerOn]);

  const otherPersonName = isCaller ? call.recipientName || "Contact" : call.callerName || "Contact";
  const otherPersonAvatar = isCaller ? call.recipientAvatar : call.callerAvatar;

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins < 10 ? "0" : ""}${mins}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
    >
      {/* Hidden audio element for remote stream */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-gradient-to-b from-[#0c233c] via-[#08182b] to-[#040d18] border border-white/15 p-6 text-center text-white shadow-2xl">
        {/* Top Header Badge */}
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold text-teal-300 backdrop-blur border border-white/10">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Appel audio WAB sécurisé</span>
        </div>

        {/* Avatar with Pulsing Waves */}
        <div className="relative mx-auto my-6 h-28 w-28">
          {callStatus === "connected" && (
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
          )}
          {callStatus === "ringing" && (
            <div className="absolute inset-0 rounded-full bg-teal-400/20 animate-ping" />
          )}
          <div className="relative h-full w-full overflow-hidden rounded-full border-4 border-teal-500/50 shadow-xl bg-[#082843] flex items-center justify-center">
            {otherPersonAvatar ? (
              <img src={otherPersonAvatar} alt={otherPersonName} className="h-full w-full object-cover" />
            ) : (
              <span className="font-display text-4xl font-extrabold text-teal-200">
                {otherPersonName.slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Contact Info */}
        <h3 className="font-display text-xl font-black text-white">{otherPersonName}</h3>
        <p className="mt-1 text-xs font-medium text-gray-300">
          {callStatus === "connected" ? (
            <span className="text-emerald-400 font-bold tracking-wider">{formatTimer(duration)}</span>
          ) : callStatus === "ringing" ? (
            isCaller ? "Sonnerie en cours…" : "Appel audio entrant…"
          ) : (
            "Connexion…"
          )}
        </p>

        {errorMessage && (
          <p className="mt-3 rounded-xl bg-red-900/60 p-2 text-xs font-semibold text-red-200">
            {errorMessage}
          </p>
        )}

        {/* Controls */}
        <div className="mt-8 flex items-center justify-center gap-5">
          {/* If Ringing & Recipient: Show Accept button */}
          {callStatus === "ringing" && isRecipient ? (
            <>
              {/* Refuse */}
              <button
                type="button"
                onClick={handleEndCall}
                aria-label="Refuser"
                className="flex flex-col items-center gap-1 group"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition-transform group-hover:scale-110 active:scale-95">
                  <span className="material-symbols-outlined text-2xl">call_end</span>
                </div>
                <span className="text-[11px] font-bold text-gray-300">Refuser</span>
              </button>

              {/* Accept */}
              <button
                type="button"
                onClick={handleAcceptCall}
                aria-label="Accepter"
                className="flex flex-col items-center gap-1 group"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 transition-transform group-hover:scale-110 active:scale-95 animate-bounce">
                  <span className="material-symbols-outlined text-2xl">call</span>
                </div>
                <span className="text-[11px] font-bold text-emerald-300">Décrocher</span>
              </button>
            </>
          ) : (
            <>
              {/* Mute Microphone */}
              <button
                type="button"
                onClick={toggleMute}
                aria-label={isMuted ? "Activer le micro" : "Couper le micro"}
                className="flex flex-col items-center gap-1 group"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full transition-transform group-hover:scale-105 active:scale-95 ${
                    isMuted
                      ? "bg-red-500/20 text-red-400 border border-red-500/40"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  <span className="material-symbols-outlined text-xl">
                    {isMuted ? "mic_off" : "mic"}
                  </span>
                </div>
                <span className="text-[10px] font-medium text-gray-400">
                  {isMuted ? "Muet" : "Micro"}
                </span>
              </button>

              {/* End Call */}
              <button
                type="button"
                onClick={handleEndCall}
                aria-label="Raccrocher"
                className="flex flex-col items-center gap-1 group"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-lg shadow-red-600/30 transition-transform group-hover:scale-110 active:scale-95">
                  <span className="material-symbols-outlined text-2xl">call_end</span>
                </div>
                <span className="text-[10px] font-bold text-gray-300">Raccrocher</span>
              </button>

              {/* Speaker Toggle */}
              <button
                type="button"
                onClick={() => setIsSpeakerOn((s) => !s)}
                aria-label="Haut-parleur"
                className="flex flex-col items-center gap-1 group"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full transition-transform group-hover:scale-105 active:scale-95 ${
                    isSpeakerOn
                      ? "bg-teal-500/20 text-teal-300 border border-teal-500/40"
                      : "bg-white/10 text-gray-400"
                  }`}
                >
                  <span className="material-symbols-outlined text-xl">
                    {isSpeakerOn ? "volume_up" : "volume_down"}
                  </span>
                </div>
                <span className="text-[10px] font-medium text-gray-400">Audio</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
