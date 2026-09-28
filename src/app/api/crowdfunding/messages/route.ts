import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import {
  getMessages,
  sendMessage,
  getSpaceDetails,
  getParticipants,
  checkAccess,
  syncSpacesAndContributions,
} from "@/lib/crowdfunding-messages-db";
import { createGlobalNotification } from "@/lib/ecosystem-inbox";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUserFromCookie();
    if (!user) {
      return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    let spaceId = searchParams.get("spaceId");
    const projetId = searchParams.get("projetId");
    const filter = (searchParams.get("filter") as "all" | "updates") || "all";
    const search = searchParams.get("search") || undefined;

    // Si seulement projetId est fourni, trouver ou créer l'espace associé
    if (!spaceId && projetId) {
      const store = await syncSpacesAndContributions();
      const existing = store.spaces.find((s) => s.projetId === projetId);
      if (existing) {
        spaceId = existing.id;
      } else {
        spaceId = `space-${projetId}`;
      }
    }

    if (!spaceId) {
      return NextResponse.json({ error: "spaceId ou projetId requis." }, { status: 400 });
    }

    const isAdmin = user.role === "admin";
    const participant = await checkAccess(spaceId, user.id, isAdmin);

    if (!participant) {
      return NextResponse.json(
        {
          error: "Accès refusé : cet espace de discussion est strictement réservé au porteur du projet et à ses investisseurs confirmés.",
          isRestricted: true,
        },
        { status: 403 }
      );
    }

    const details = await getSpaceDetails(spaceId, user.id, isAdmin);
    const messages = await getMessages(spaceId, user.id, filter, search, isAdmin);
    const participants = await getParticipants(spaceId, user.id);

    return NextResponse.json({
      success: true,
      space: details?.space,
      project: details?.project,
      participant,
      settings: details?.settings,
      messages,
      participants,
    });
  } catch (error) {
    console.error("Error in crowdfunding messages GET:", error);
    return NextResponse.json({ error: "Erreur serveur lors de la récupération des messages." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserFromCookie();
    if (!user) {
      return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
    }

    const body = await req.json();
    let { spaceId, projetId, content, isUpdate, updateTitle, mentions, attachments } = body;

    // Résoudre spaceId à partir de projetId si nécessaire
    if (!spaceId && projetId) {
      const store = await syncSpacesAndContributions();
      const existing = store.spaces.find((s) => s.projetId === projetId);
      spaceId = existing ? existing.id : `space-${projetId}`;
    }

    if (!spaceId) {
      return NextResponse.json({ error: "spaceId requis." }, { status: 400 });
    }

    const isAdmin = user.role === "admin";
    const participant = await checkAccess(spaceId, user.id, isAdmin);

    if (!participant) {
      return NextResponse.json(
        { error: "Accès refusé : seul le porteur ou un investisseur confirmé peut publier dans cet espace." },
        { status: 403 }
      );
    }

    const senderName = `${user.prenom || ""} ${user.nom || ""}`.trim() || user.email || "Utilisateur";

    const newMsg = await sendMessage({
      spaceId,
      senderId: user.id,
      senderName,
      senderRole: participant.role,
      senderAvatar: user.avatar,
      content: content || "",
      isUpdate: Boolean(isUpdate),
      updateTitle: updateTitle || undefined,
      mentions: Array.isArray(mentions) ? mentions : [],
      attachments: Array.isArray(attachments) ? attachments : [],
    });

    if (!newMsg) {
      return NextResponse.json({ error: "Impossible d'envoyer le message." }, { status: 500 });
    }

    // Récupérer les autres participants pour les notifier
    try {
      const allParticipants = await getParticipants(spaceId, user.id);
      const otherParticipants = allParticipants.filter((p) => p.userId !== user.id && p.status === "actif");

      for (const p of otherParticipants) {
        await createGlobalNotification({
          userId: p.userId,
          platform: "crowdfunding",
          type: "message",
          title: isUpdate ? `📢 Mise à jour de campagne` : `Nouveau message investisseurs`,
          body: isUpdate
            ? `${updateTitle || "Mise à jour officielle"} : ${content?.slice(0, 100) || "Nouveau rapport publié"}`
            : `${senderName} : ${content?.slice(0, 90) || "Pièce jointe envoyée"}`,
          link: `/financement/messages?spaceId=${encodeURIComponent(spaceId)}`,
          entityType: "crowdfunding_message",
          entityId: newMsg.id,
        }).catch(() => {});
      }
    } catch {}

    return NextResponse.json({ success: true, message: newMsg }, { status: 201 });
  } catch (error) {
    console.error("Error in crowdfunding messages POST:", error);
    return NextResponse.json({ error: "Erreur serveur lors de l'envoi du message." }, { status: 500 });
  }
}
