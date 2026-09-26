import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { createGlobalNotification } from "@/lib/ecosystem-inbox";

export const runtime = "nodejs";

export interface ActiveAudioCall {
  id: string;
  callerId: string;
  callerName: string;
  callerAvatar?: string;
  recipientId: string;
  recipientName?: string;
  recipientAvatar?: string;
  conversationId: string;
  status: "ringing" | "connected" | "rejected" | "ended" | "missed";
  offer?: RTCSessionDescriptionInit | null;
  answer?: RTCSessionDescriptionInit | null;
  callerCandidates: RTCIceCandidateInit[];
  recipientCandidates: RTCIceCandidateInit[];
  createdAt: number;
  connectedAt?: number;
  endedAt?: number;
}

import fs from "fs";
import path from "path";

// Fichier de stockage partagé pour la signalisation des appels
const CALLS_FILE = path.join(
  process.platform === "win32"
    ? path.join(process.cwd(), "src", "data", "wab-calls.json")
    : "/tmp",
  "wab-calls.json"
);

function loadActiveCalls(): Map<string, ActiveAudioCall> {
  const map = new Map<string, ActiveAudioCall>();
  try {
    if (fs.existsSync(CALLS_FILE)) {
      const data = JSON.parse(fs.readFileSync(CALLS_FILE, "utf-8")) as ActiveAudioCall[];
      if (Array.isArray(data)) {
        const now = Date.now();
        for (const item of data) {
          if (now - item.createdAt < 15 * 60 * 1000) {
            map.set(item.id, item);
          }
        }
      }
    }
  } catch {}
  return map;
}

function persistActiveCalls(map: Map<string, ActiveAudioCall>) {
  try {
    fs.mkdirSync(path.dirname(CALLS_FILE), { recursive: true });
    const list = Array.from(map.values());
    fs.writeFileSync(CALLS_FILE, JSON.stringify(list, null, 2), "utf-8");
  } catch {}
}

declare global {
  // eslint-disable-next-line no-var
  var __wabActiveCalls: Map<string, ActiveAudioCall> | undefined;
}

if (!global.__wabActiveCalls) {
  global.__wabActiveCalls = loadActiveCalls();
}

const activeCalls = global.__wabActiveCalls;

// Nettoyer les appels expirés (> 15 minutes) et synchroniser avec le fichier
function cleanExpiredCalls() {
  const diskCalls = loadActiveCalls();
  const now = Date.now();
  for (const [id, call] of diskCalls.entries()) {
    if (!activeCalls.has(id)) {
      activeCalls.set(id, call);
    }
  }
  for (const [id, call] of activeCalls.entries()) {
    if (now - call.createdAt > 15 * 60 * 1000 || (call.status === "ended" && now - (call.endedAt || call.createdAt) > 60 * 1000)) {
      activeCalls.delete(id);
    }
  }
  persistActiveCalls(activeCalls);
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  cleanExpiredCalls();

  const { searchParams } = new URL(request.url);
  const callId = searchParams.get("callId");

  if (callId) {
    const call = activeCalls.get(callId);
    if (!call) return NextResponse.json({ call: null });
    // Vérifier l'autorisation
    if (call.callerId !== user.id && call.recipientId !== user.id) {
      return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    }
    return NextResponse.json({ call });
  }

  // Chercher un appel entrant ou actif pour cet utilisateur
  const userCalls = Array.from(activeCalls.values()).filter(
    (c) =>
      (c.recipientId === user.id || c.callerId === user.id) &&
      (c.status === "ringing" || c.status === "connected")
  );

  const incomingCall = userCalls.find((c) => c.recipientId === user.id && c.status === "ringing") || null;
  const activeCall = userCalls[0] || null;

  return NextResponse.json({ incomingCall, activeCall });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  cleanExpiredCalls();

  const body = await request.json().catch(() => null);
  if (!body || typeof body.action !== "string") {
    return NextResponse.json({ error: "Action requise." }, { status: 400 });
  }

  const { action, callId } = body;

  // 1. INITIATE CALL
  if (action === "initiate") {
    const recipientId = String(body.recipientId || "");
    const conversationId = String(body.conversationId || "");
    if (!recipientId) {
      return NextResponse.json({ error: "Destinataire requis." }, { status: 400 });
    }

    const callerName =
      [user.prenom, user.nom].filter(Boolean).join(" ") ||
      (user as { full_name?: string }).full_name ||
      "Ami WAB";

    const id = crypto.randomUUID();
    const newCall: ActiveAudioCall = {
      id,
      callerId: user.id,
      callerName,
      callerAvatar: (user as { avatar?: string }).avatar || undefined,
      recipientId,
      recipientName: body.recipientName ? String(body.recipientName) : undefined,
      recipientAvatar: body.recipientAvatar ? String(body.recipientAvatar) : undefined,
      conversationId,
      status: "ringing",
      offer: body.offer || null,
      answer: null,
      callerCandidates: [],
      recipientCandidates: [],
      createdAt: Date.now(),
    };

    activeCalls.set(id, newCall);
    persistActiveCalls(activeCalls);

    // Déclencher une notification pour l'utilisateur appelé
    createGlobalNotification({
      userId: recipientId,
      platform: "wab",
      type: "audio_call",
      title: "📞 Appel audio entrant",
      body: `${callerName} vous appelle en direct sur la messagerie WAB.`,
      link: `/messages?conversationId=${encodeURIComponent(conversationId)}&callId=${id}`,
      dedupeKey: `call-${id}`,
    }).catch(() => {});

    return NextResponse.json({ call: newCall });
  }

  // Vérifier la présence de callId pour les autres actions
  if (!callId || typeof callId !== "string") {
    return NextResponse.json({ error: "ID d'appel manquant." }, { status: 400 });
  }

  const existing = activeCalls.get(callId);
  if (!existing) {
    return NextResponse.json({ error: "Appel introuvable ou terminé." }, { status: 404 });
  }

  // Vérifier que l'utilisateur fait partie de l'appel
  if (existing.callerId !== user.id && existing.recipientId !== user.id) {
    return NextResponse.json({ error: "Action non autorisée sur cet appel." }, { status: 403 });
  }

  // 2. ACCEPT CALL
  if (action === "accept") {
    existing.status = "connected";
    existing.connectedAt = Date.now();
    if (body.answer) {
      existing.answer = body.answer;
    }
    activeCalls.set(callId, existing);
    persistActiveCalls(activeCalls);
    return NextResponse.json({ call: existing });
  }

  // 3. REJECT CALL
  if (action === "reject") {
    existing.status = "rejected";
    existing.endedAt = Date.now();
    activeCalls.set(callId, existing);
    persistActiveCalls(activeCalls);
    return NextResponse.json({ call: existing });
  }

  // 4. END CALL
  if (action === "end") {
    existing.status = "ended";
    existing.endedAt = Date.now();
    activeCalls.set(callId, existing);
    persistActiveCalls(activeCalls);
    return NextResponse.json({ call: existing });
  }

  // 5. SIGNAL (Offer, Answer, ICE candidates)
  if (action === "signal") {
    if (body.offer && existing.callerId === user.id) {
      existing.offer = body.offer;
    }
    if (body.answer && existing.recipientId === user.id) {
      existing.answer = body.answer;
      existing.status = "connected";
      existing.connectedAt = existing.connectedAt || Date.now();
    }
    if (body.candidate) {
      if (existing.callerId === user.id) {
        existing.callerCandidates.push(body.candidate);
      } else {
        existing.recipientCandidates.push(body.candidate);
      }
    }
    activeCalls.set(callId, existing);
    persistActiveCalls(activeCalls);
    return NextResponse.json({ call: existing });
  }

  return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
}
