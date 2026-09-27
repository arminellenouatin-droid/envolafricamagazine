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
  const [callType, setCallType] = useState<"audio" | "video">(call.callType || "audio");
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(call.callType === "video");
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);

  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const ringtoneCtxRef = useRef<AudioContext | null>(null);
  const ringtoneIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const channelRef = useRef<any>(null);
  const offerRef = useRef<RTCSessionDescriptionInit | null>(call.offer || null);
  const answerRef = useRef<RTCSessionDescriptionInit | null>(call.answer || null);
  const callerStartedRef = useRef(false);
  const recipientRingtoneStartedRef = useRef(false);
  const addedCandidateKeysRef = useRef<Set<string>>(new Set());

  // Web Audio Ringtone (Beep agréable)
  const startRingtone = useCallback(() => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx || ringtoneCtxRef.current) return;

      const ctx = new AudioCtx();
      ringtoneCtxRef.current = ctx;

      const playBeep = () => {
        if (!ringtoneCtxRef.current) return;
        if (ctx.state === "suspended") ctx.resume();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        // 440 Hz pour appel sortant, 520 Hz pour appel entrant
        osc.frequency.setValueAtTime(isCaller ? 440 : 520, ctx.currentTime);
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
  }, [isCaller]);

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

  // Nettoyage complet
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

  // Ajouter un candidat ICE de manière sécurisée et dédoublonnée
  const safelyAddIceCandidate = useCallback(async (pc: RTCPeerConnection, candidate: RTCIceCandidateInit) => {
    if (!candidate || !candidate.candidate) return;
    const key = `${candidate.candidate}_${candidate.sdpMid}_${candidate.sdpMLineIndex}`;
    if (addedCandidateKeysRef.current.has(key)) return;
    addedCandidateKeysRef.current.add(key);

    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      // Ignorer si remote description pas encore fixée, le fallback de polling le réessaiera
    }
  }, []);

  // Initialisation WebRTC
  const initWebRTC = useCallback(
    async (isVideoMode = callType === "video") => {
      if (pcRef.current && localStreamRef.current) return pcRef.current;

      try {
        const constraints: MediaStreamConstraints = {
          audio: true,
          video: isVideoMode
            ? { facingMode, width: { ideal: 640 }, height: { ideal: 480 } }
            : false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        localStreamRef.current = stream;

        // Prévisualisation locale de sa caméra en incrustation
        if (localVideoRef.current && isVideoMode) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.muted = true;
          localVideoRef.current.play().catch(() => {});
        }

        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            { urls: "stun:stun2.l.google.com:19302" },
            { urls: "stun:stun.cloudflare.com:3478" },
          ],
        });
        pcRef.current = pc;

        // Ajouter les pistes locales
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        // Flux distant reçu
        pc.ontrack = (event) => {
          const remoteStream = event.streams[0];
          if (!remoteStream) return;

          // Débloquer l'audio
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = remoteStream;
            remoteAudioRef.current.volume = isSpeakerOn ? 1.0 : 0.25;
            remoteAudioRef.current.muted = false;
            remoteAudioRef.current.play().catch(() => {});
          }

          // Débloquer la vidéo si appel vidéo
          if (remoteVideoRef.current && remoteStream.getVideoTracks().length > 0) {
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current.play().catch(() => {});
            setCallType("video");
          }
        };

        // ICE Candidate local généré
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            const candidateData = event.candidate.toJSON();

            // 1. Broadcast temps réel
            if (channelRef.current) {
              channelRef.current.send({
                type: "broadcast",
                event: "webrtc_ice",
                payload: { candidate: candidateData, senderId: currentUserId },
              });
            }

            // 2. Persistance serveur
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
        console.error("[WebRTC] Erreur accès micro/caméra :", err);
        setErrorMessage("Veuillez autoriser l'accès au microphone (et caméra) pour poursuivre l'appel.");
        return null;
      }
    },
    [call.id, callType, currentUserId, facingMode, isSpeakerOn]
  );

  // Appelant : créer et envoyer l'offre initiale
  const startCallingAsCaller = useCallback(async () => {
    if (callerStartedRef.current) return;
    callerStartedRef.current = true;

    startRingtone();
    const pc = await initWebRTC(callType === "video");
    if (!pc) return;

    try {
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: callType === "video",
      });
      await pc.setLocalDescription(offer);
      offerRef.current = { type: offer.type, sdp: offer.sdp };

      // 1. Broadcast offre via Supabase
      if (channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "webrtc_offer",
          payload: { offer: { type: offer.type, sdp: offer.sdp }, callType },
        });
      }

      // 2. Sauvegarde API
      await fetch("/api/messages/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "signal",
          callId: call.id,
          offer: { type: offer.type, sdp: offer.sdp },
          callType,
        }),
      });
    } catch (e) {
      console.error("[WebRTC] Erreur création offre :", e);
    }
  }, [call.id, callType, initWebRTC, startRingtone]);

  // Destinataire : Décrocher l'appel
  const handleAcceptCall = async () => {
    stopRingtone();
    setCallStatus("connected");

    // Débloquer l'audio de façon synchrone sur clic
    if (remoteAudioRef.current) {
      remoteAudioRef.current.play().catch(() => {});
    }

    const pc = await initWebRTC(callType === "video");
    if (!pc) return;

    // Récupérer l'offre si pas encore en mémoire
    let currentOffer = offerRef.current;
    if (!currentOffer) {
      if (channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "request_offer",
          payload: {},
        });
      }

      for (let attempt = 0; attempt < 8; attempt++) {
        try {
          const res = await fetch(`/api/messages/call?callId=${encodeURIComponent(call.id)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.call?.offer) {
              currentOffer = data.call.offer;
              offerRef.current = currentOffer;
              if (data.call.callType) setCallType(data.call.callType);
              // Ajouter les candidats de l'appelant déjà présents sur le serveur
              if (Array.isArray(data.call.callerCandidates)) {
                for (const cand of data.call.callerCandidates) {
                  safelyAddIceCandidate(pc, cand);
                }
              }
              break;
            }
          }
        } catch {}
        await new Promise((r) => setTimeout(r, 300));
      }
    }

    try {
      if (currentOffer) {
        if (!pc.currentRemoteDescription) {
          await pc.setRemoteDescription(new RTCSessionDescription(currentOffer));
        }

        // Ajouter les candidats déjà reçus
        const res = await fetch(`/api/messages/call?callId=${encodeURIComponent(call.id)}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.call?.callerCandidates)) {
            for (const cand of data.call.callerCandidates) {
              safelyAddIceCandidate(pc, cand);
            }
          }
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        answerRef.current = { type: answer.type, sdp: answer.sdp };

        // 1. Broadcast réponse
        if (channelRef.current) {
          channelRef.current.send({
            type: "broadcast",
            event: "webrtc_answer",
            payload: { answer: { type: answer.type, sdp: answer.sdp } },
          });
        }

        // 2. Persistance serveur
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
        // Envoi signal d'acceptation
        await fetch("/api/messages/call", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "accept", callId: call.id }),
        });
      }
    } catch (e) {
      console.error("[WebRTC] Erreur acceptation appel :", e);
    }
  };

  // Raccrocher ou Refuser
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

  // Basculer Micro (Muet)
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted;
        setIsMuted(!isMuted);
      }
    }
  };

  // Basculer Caméra
  const toggleVideo = async () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled;
        setIsVideoEnabled(!isVideoEnabled);
      } else {
        // Ajouter une piste vidéo si elle n'existait pas encore
        try {
          const videoStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode },
          });
          const newTrack = videoStream.getVideoTracks()[0];
          if (newTrack && pcRef.current) {
            pcRef.current.addTrack(newTrack, localStreamRef.current);
            localStreamRef.current.addTrack(newTrack);
            setIsVideoEnabled(true);
            setCallType("video");
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = localStreamRef.current;
              localVideoRef.current.play().catch(() => {});
            }
            // Signaliser passage vidéo
            fetch("/api/messages/call", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "upgrade_video", callId: call.id }),
            }).catch(() => {});
          }
        } catch {}
      }
    }
  };

  // Retourner la caméra (sur mobile)
  const flipCamera = async () => {
    const nextMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(nextMode);
    if (localStreamRef.current && pcRef.current) {
      try {
        const oldTrack = localStreamRef.current.getVideoTracks()[0];
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: nextMode },
        });
        const newTrack = newStream.getVideoTracks()[0];
        if (oldTrack && newTrack) {
          const sender = pcRef.current.getSenders().find((s) => s.track === oldTrack);
          if (sender) sender.replaceTrack(newTrack);
          localStreamRef.current.removeTrack(oldTrack);
          oldTrack.stop();
          localStreamRef.current.addTrack(newTrack);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
            localVideoRef.current.play().catch(() => {});
          }
        }
      } catch {}
    }
  };

  // Canal Supabase Realtime pour signalisation instantanée
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const ch = supabase.channel(`wab_call_${call.id}`, {
      config: { broadcast: { self: false } },
    });

    ch.on("broadcast", { event: "webrtc_offer" }, async ({ payload }: { payload: any }) => {
      if (payload?.offer) {
        offerRef.current = payload.offer;
        if (payload.callType) setCallType(payload.callType);

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
            console.warn("[WebRTC] Réponse offre auto :", e);
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
            console.warn("[WebRTC] Enregistrement réponse :", e);
          }
        }
      }
    });

    ch.on("broadcast", { event: "webrtc_ice" }, async ({ payload }: { payload: any }) => {
      if (payload?.candidate && pcRef.current) {
        safelyAddIceCandidate(pcRef.current, payload.candidate);
      }
    });

    ch.on("broadcast", { event: "request_offer" }, () => {
      if (isCaller && pcRef.current?.localDescription) {
        ch.send({
          type: "broadcast",
          event: "webrtc_offer",
          payload: { offer: pcRef.current.localDescription, callType },
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
  }, [call.id, callType, cleanupMedia, isCaller, isRecipient, onClose, onCallUpdate, safelyAddIceCandidate, stopRingtone]);

  // Déclenchement sonnerie / appel initial
  useEffect(() => {
    if (isCaller && callStatus === "ringing") {
      startCallingAsCaller();
    } else if (isRecipient && callStatus === "ringing" && !recipientRingtoneStartedRef.current) {
      recipientRingtoneStartedRef.current = true;
      startRingtone();
    }
  }, [isCaller, isRecipient, callStatus, startCallingAsCaller, startRingtone]);

  // Polling de synchronisation (toutes les 1.2s) avec réconciliation des candidats ICE
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

        if (latestCall.callType && latestCall.callType !== callType) {
          setCallType(latestCall.callType);
        }

        if (latestCall.status === "connected" && callStatus === "ringing") {
          stopRingtone();
          setCallStatus("connected");
        }

        if (latestCall.offer && !offerRef.current) {
          offerRef.current = latestCall.offer;
        }

        // Réconciliation de l'offre et de la réponse
        if (isCaller && latestCall.status === "connected" && latestCall.answer && pcRef.current) {
          stopRingtone();
          if (!pcRef.current.currentRemoteDescription) {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(latestCall.answer));
          }
        }

        // Réconciliation bidirectionnelle des candidats ICE
        if (pcRef.current && pcRef.current.remoteDescription) {
          const candidatesToSync = isCaller ? latestCall.recipientCandidates : latestCall.callerCandidates;
          if (Array.isArray(candidatesToSync)) {
            for (const cand of candidatesToSync) {
              safelyAddIceCandidate(pcRef.current, cand);
            }
          }
        }
      } catch {}
    };

    pollTimerRef.current = setInterval(poll, 1200);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [call.id, callStatus, callType, cleanupMedia, isCaller, onClose, onCallUpdate, safelyAddIceCandidate, stopRingtone]);

  // Chronomètre de durée quand connecté
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

  // Volume haut-parleur
  useEffect(() => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.volume = isSpeakerOn ? 1.0 : 0.25;
    }
  }, [isSpeakerOn]);

  const otherPersonName = isCaller ? call.recipientName || "Contact" : call.callerName || "Contact";
  const otherPersonAvatar = isCaller ? call.recipientAvatar : call.callerAvatar;

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins < 10 ? "0" : ""}${mins}:${s < 10 ? "0" : ""}${s}`;
  };

  const isVideo = callType === "video";

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200"
    >
      {/* Élément audio pour le flux distant */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-gradient-to-b from-[#0c233c] via-[#08182b] to-[#040d18] border border-white/15 p-5 sm:p-6 text-center text-white shadow-2xl flex flex-col justify-between min-h-[480px]">
        {/* Top Header Badge */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-teal-300 backdrop-blur border border-white/10">
            <span className={`h-2 w-2 rounded-full ${callStatus === "connected" ? "bg-emerald-400" : "bg-teal-400"} animate-pulse`} />
            <span>{isVideo ? "Appel vidéo WAB" : "Appel audio WAB"} sécurisé</span>
          </div>

          {callStatus === "connected" && (
            <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-500/30">
              {formatTimer(duration)}
            </span>
          )}
        </div>

        {/* Zone centrale : Vidéo ou Avatar */}
        <div className="my-auto py-4 relative flex items-center justify-center">
          {isVideo && callStatus === "connected" ? (
            <div className="relative w-full h-[280px] rounded-2xl overflow-hidden bg-black border border-white/20 shadow-inner">
              {/* Vidéo du contact distant */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Vignette de sa propre caméra */}
              <div className="absolute top-2 right-2 w-24 h-32 rounded-xl overflow-hidden bg-black/60 border border-white/30 shadow-lg">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              </div>

              {/* Bouton retourner caméra sur mobile */}
              <button
                type="button"
                onClick={flipCamera}
                className="absolute bottom-2 left-2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur border border-white/20 text-xs flex items-center gap-1"
                title="Retourner la caméra"
              >
                <span className="material-symbols-outlined text-sm">flip_camera_ios</span>
              </button>
            </div>
          ) : (
            <div className="relative flex flex-col items-center">
              {/* Avatar pulsant */}
              <div className="relative mx-auto my-3 h-28 w-28 sm:h-32 sm:w-32">
                {callStatus === "connected" && (
                  <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                )}
                {callStatus === "ringing" && (
                  <div className="absolute inset-0 rounded-full bg-teal-400/25 animate-ping" />
                )}
                <div className="relative h-full w-full overflow-hidden rounded-full border-4 border-teal-500/60 shadow-xl bg-[#082843] flex items-center justify-center">
                  {otherPersonAvatar ? (
                    <img src={otherPersonAvatar} alt={otherPersonName} className="h-full w-full object-cover" />
                  ) : (
                    <span className="font-display text-4xl sm:text-5xl font-extrabold text-teal-200">
                      {otherPersonName.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>

              {/* Nom & Statut */}
              <h3 className="font-display text-xl sm:text-2xl font-black text-white mt-2">
                {otherPersonName}
              </h3>
              <p className="mt-1 text-xs font-semibold text-gray-300">
                {callStatus === "connected" ? (
                  <span className="text-emerald-400">En communication sécurisée</span>
                ) : callStatus === "ringing" ? (
                  isCaller ? (
                    <span className="text-teal-300 animate-pulse">Sonnerie en cours…</span>
                  ) : (
                    <span className="text-emerald-400 font-bold animate-pulse">
                      {isVideo ? "Appel vidéo entrant…" : "Appel audio entrant…"}
                    </span>
                  )
                ) : (
                  <span className="text-gray-400">Établissement de la connexion…</span>
                )}
              </p>
            </div>
          )}
        </div>

        {errorMessage && (
          <p className="my-2 rounded-xl bg-red-900/60 p-2 text-xs font-semibold text-red-200">
            {errorMessage}
          </p>
        )}

        {/* Contrôles de l'appel */}
        <div className="pt-2">
          {callStatus === "ringing" && isRecipient ? (
            /* BOUTONS DÉCROCHER / REFUSER */
            <div className="flex items-center justify-around max-w-xs mx-auto">
              {/* Refuser */}
              <button
                type="button"
                onClick={handleEndCall}
                aria-label="Refuser l'appel"
                className="flex flex-col items-center gap-1.5 group cursor-pointer"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition-transform group-hover:scale-110 active:scale-95">
                  <span className="material-symbols-outlined text-2xl">call_end</span>
                </div>
                <span className="text-xs font-bold text-gray-300">Refuser</span>
              </button>

              {/* Décrocher */}
              <button
                type="button"
                onClick={handleAcceptCall}
                aria-label="Décrocher l'appel"
                className="flex flex-col items-center gap-1.5 group cursor-pointer"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xl shadow-emerald-500/40 transition-transform group-hover:scale-110 active:scale-95 animate-bounce">
                  <span className="material-symbols-outlined text-3xl">
                    {isVideo ? "videocam" : "call"}
                  </span>
                </div>
                <span className="text-xs font-black text-emerald-300">Décrocher</span>
              </button>
            </div>
          ) : (
            /* CONTRÔLES EN COURS D'APPEL */
            <div className="flex items-center justify-center gap-4 sm:gap-6 flex-wrap">
              {/* Micro / Muet */}
              <button
                type="button"
                onClick={toggleMute}
                aria-label={isMuted ? "Réactiver le micro" : "Couper le micro"}
                className="flex flex-col items-center gap-1 group"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full transition-transform group-hover:scale-105 active:scale-95 ${
                    isMuted
                      ? "bg-red-500/20 text-red-400 border border-red-500/50"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  <span className="material-symbols-outlined text-xl">
                    {isMuted ? "mic_off" : "mic"}
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-gray-300">
                  {isMuted ? "Muet" : "Micro"}
                </span>
              </button>

              {/* Vidéo Toggle */}
              <button
                type="button"
                onClick={toggleVideo}
                aria-label={isVideoEnabled ? "Couper la caméra" : "Activer la caméra"}
                className="flex flex-col items-center gap-1 group"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full transition-transform group-hover:scale-105 active:scale-95 ${
                    isVideoEnabled
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  <span className="material-symbols-outlined text-xl">
                    {isVideoEnabled ? "videocam" : "videocam_off"}
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-gray-300">
                  {isVideoEnabled ? "Caméra ON" : "Caméra OFF"}
                </span>
              </button>

              {/* Raccrocher */}
              <button
                type="button"
                onClick={handleEndCall}
                aria-label="Raccrocher l'appel"
                className="flex flex-col items-center gap-1 group cursor-pointer"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-xl shadow-red-600/40 transition-transform group-hover:scale-110 active:scale-95">
                  <span className="material-symbols-outlined text-2xl">call_end</span>
                </div>
                <span className="text-[10px] font-bold text-gray-200">Raccrocher</span>
              </button>

              {/* Haut-parleur */}
              <button
                type="button"
                onClick={() => setIsSpeakerOn((s) => !s)}
                aria-label="Haut-parleur"
                className="flex flex-col items-center gap-1 group"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full transition-transform group-hover:scale-105 active:scale-95 ${
                    isSpeakerOn
                      ? "bg-teal-500/20 text-teal-300 border border-teal-500/50"
                      : "bg-white/10 text-gray-400"
                  }`}
                >
                  <span className="material-symbols-outlined text-xl">
                    {isSpeakerOn ? "volume_up" : "volume_down"}
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-gray-300">Audio</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
