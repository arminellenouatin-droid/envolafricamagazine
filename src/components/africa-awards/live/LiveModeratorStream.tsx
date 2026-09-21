"use client";
import React, { useState } from "react";
import { LiveMessageItem, checkIsFlagged } from "./LiveRealtimeEngine";

export interface SanctionedUser {
  userId: string;
  userName: string;
  type: "muted" | "banned" | "warned";
  timestamp: string;
  reason?: string;
}

interface LiveModeratorStreamProps {
  messages: LiveMessageItem[];
  sanctionedUsers: SanctionedUser[];
  onDeleteMessage: (messageId: string) => void;
  onHideMessage: (messageId: string) => void;
  onWarnUser: (userId: string, userName: string) => void;
  onMuteUser: (userId: string, userName: string) => void;
  onBanUser: (userId: string, userName: string) => void;
  onUnsanctionUser: (userId: string) => void;
  onAlertHost: (reason: string) => void;
}

export default function LiveModeratorStream({
  messages,
  sanctionedUsers,
  onDeleteMessage,
  onHideMessage,
  onWarnUser,
  onMuteUser,
  onBanUser,
  onUnsanctionUser,
  onAlertHost,
}: LiveModeratorStreamProps) {
  const [filterType, setFilterType] = useState<"all" | "flagged" | "sanctioned">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<LiveMessageItem | null>(null);
  const [showSanctionsDrawer, setShowSanctionsDrawer] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertReason, setAlertReason] = useState("");

  const filteredMessages = messages.filter((msg) => {
    const isFlagged = msg.isFlagged || checkIsFlagged(msg.text);
    if (filterType === "flagged" && !isFlagged) return false;
    if (filterType === "sanctioned" && !sanctionedUsers.some((u) => u.userId === msg.userId))
      return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        msg.text.toLowerCase().includes(q) ||
        msg.user.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleSendAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertReason.trim()) return;
    onAlertHost(alertReason.trim());
    setAlertReason("");
    setShowAlertModal(false);
  };

  return (
    <div className="relative flex flex-col h-full text-white">
      {/* Barre de filtre et recherche */}
      <div className="p-3 bg-[#121218] border-b border-white/10 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFilterType("all")}
            className={`rounded-full px-3 py-1 text-xs font-bold transition ${
              filterType === "all"
                ? "bg-[#D4AF37] text-black"
                : "bg-white/10 text-white/80 hover:bg-white/15"
            }`}
          >
            Tous ({messages.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("flagged")}
            className={`rounded-full px-3 py-1 text-xs font-bold transition flex items-center gap-1 ${
              filterType === "flagged"
                ? "bg-amber-500 text-black"
                : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
            }`}
          >
            <span>⚠️ Signalés</span>
          </button>
          <button
            type="button"
            onClick={() => setShowSanctionsDrawer(!showSanctionsDrawer)}
            className="rounded-full px-3 py-1 text-xs font-bold bg-red-950/60 border border-red-500/30 text-red-300 flex items-center gap-1"
          >
            <span>Sanctions ({sanctionedUsers.length})</span>
            <span className="material-symbols-outlined text-[14px]">
              {showSanctionsDrawer ? "expand_less" : "expand_more"}
            </span>
          </button>
        </div>

        {/* Barre de recherche */}
        <div className="relative flex-1 sm:max-w-xs">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] text-white/40">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrer par mot ou pseudo..."
            className="h-8 w-full rounded-full border border-white/15 bg-black/50 pl-8 pr-3 text-xs text-white placeholder-white/40 focus:border-[#D4AF37] focus:outline-none"
          />
        </div>
      </div>

      {/* Section rétractable : Utilisateurs sanctionnés */}
      {showSanctionsDrawer && (
        <div className="p-3 bg-red-950/30 border-b border-red-500/20 max-h-48 overflow-y-auto animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between pb-1 text-[11px] font-black uppercase text-red-400">
            <span>Utilisateurs sanctionnés récemment</span>
            <span>Actions</span>
          </div>
          <div className="space-y-1.5 mt-2">
            {sanctionedUsers.map((u) => (
              <div
                key={u.userId}
                className="flex items-center justify-between rounded-lg bg-black/60 border border-white/10 p-2 text-xs"
              >
                <div>
                  <span className="font-bold text-white mr-2">{u.userName}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[9px] font-black uppercase ${
                      u.type === "banned"
                        ? "bg-red-600 text-white"
                        : u.type === "muted"
                        ? "bg-orange-600 text-white"
                        : "bg-yellow-600 text-black"
                    }`}
                  >
                    {u.type === "banned" ? "Banni" : u.type === "muted" ? "Muté" : "Averti"}
                  </span>
                  <span className="ml-2 text-[10px] text-[#A8A6A0]">{u.timestamp}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onUnsanctionUser(u.userId)}
                  className="rounded bg-white/10 hover:bg-white/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400"
                >
                  Lever sanction
                </button>
              </div>
            ))}
            {sanctionedUsers.length === 0 && (
              <p className="text-center text-xs text-[#A8A6A0] py-2">
                Aucun utilisateur sanctionné pour le moment.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Flux de commentaires de modération */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 pb-24">
        {filteredMessages.map((msg) => {
          const isFlagged = msg.isFlagged || checkIsFlagged(msg.text);

          return (
            <div
              key={msg.id}
              onClick={() => setSelectedMessage(msg)}
              className={`relative rounded-2xl p-3 border transition cursor-pointer ${
                isFlagged
                  ? "bg-amber-950/25 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                  : msg.isModerated
                  ? "bg-white/5 border-red-500/30 opacity-60 line-through"
                  : "bg-black/50 border-white/10 hover:border-white/25"
              }`}
            >
              {/* En-tête du message : Avatar, Pseudo, Heure, Badges */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-white/15 flex items-center justify-center text-[10px] font-black text-[#F4D976]">
                    {msg.user[0]?.toUpperCase()}
                  </div>
                  <span className="text-xs font-bold text-[#F4D976]">{msg.user}</span>
                  {isFlagged && (
                    <span className="rounded bg-red-600/90 px-1.5 py-0.5 text-[8px] font-black uppercase text-white animate-pulse">
                      Alerte automatique
                    </span>
                  )}
                  {msg.isGift && (
                    <span className="rounded bg-[#D4AF37]/20 border border-[#D4AF37]/40 px-1.5 py-0.5 text-[9px] font-bold text-[#F4D976]">
                      {msg.giftIcon} {msg.giftName}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-[#A8A6A0]">{msg.time}</span>
              </div>

              {/* Contenu du texte */}
              <p
                className={`mt-1.5 text-xs sm:text-sm leading-snug ${
                  isFlagged ? "text-amber-100 font-semibold" : "text-white/95"
                }`}
              >
                {msg.text}
              </p>

              {/* Barre d'actions rapides (visibles au survol ou sélection) */}
              <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-end gap-1.5">
                {/* 1. Supprimer */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteMessage(msg.id);
                  }}
                  title="Supprimer définitivement ce commentaire"
                  className="flex h-7 px-2.5 items-center gap-1 rounded-full bg-red-950/60 border border-red-500/30 text-red-300 hover:bg-red-900 text-[10px] font-bold"
                >
                  <span className="material-symbols-outlined text-[13px]">delete</span>
                  <span>Supprimer</span>
                </button>

                {/* 2. Masquer */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onHideMessage(msg.id);
                  }}
                  title="Masquer pour tous les spectateurs"
                  className="flex h-7 px-2.5 items-center gap-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold"
                >
                  <span className="material-symbols-outlined text-[13px]">visibility_off</span>
                  <span>Masquer</span>
                </button>

                {/* 3. Avertir */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onWarnUser(msg.userId || msg.user, msg.user);
                  }}
                  title="Avertir cet utilisateur"
                  className="flex h-7 px-2.5 items-center gap-1 rounded-full bg-yellow-600/20 border border-yellow-500/30 text-yellow-300 hover:bg-yellow-600/30 text-[10px] font-bold"
                >
                  <span className="material-symbols-outlined text-[13px]">warning</span>
                  <span>Avertir</span>
                </button>

                {/* 4. Muter */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMuteUser(msg.userId || msg.user, msg.user);
                  }}
                  title="Mettre en sourdine (interdiction de chat)"
                  className="flex h-7 px-2.5 items-center gap-1 rounded-full bg-orange-600/20 border border-orange-500/30 text-orange-300 hover:bg-orange-600/30 text-[10px] font-bold"
                >
                  <span className="material-symbols-outlined text-[13px]">mic_off</span>
                  <span>Muter</span>
                </button>

                {/* 5. Bannir */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onBanUser(msg.userId || msg.user, msg.user);
                  }}
                  title="Bannir définitivement du live"
                  className="flex h-7 px-2.5 items-center gap-1 rounded-full bg-red-600 hover:bg-red-500 text-white text-[10px] font-black"
                >
                  <span className="material-symbols-outlined text-[13px]">block</span>
                  <span>Bannir</span>
                </button>
              </div>
            </div>
          );
        })}

        {filteredMessages.length === 0 && (
          <div className="py-16 text-center text-[#A8A6A0] text-xs">
            Aucun commentaire correspondant aux filtres.
          </div>
        )}
      </div>

      {/* BOUTON D'ACTION FLOTTANT : ALERTER L'ANIMATEUR (MÉGAPHONE AVEC !) */}
      <div className="absolute bottom-4 right-4 z-30 pointer-events-auto">
        <button
          type="button"
          onClick={() => setShowAlertModal(true)}
          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 px-5 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-[0_0_25px_rgba(220,38,38,0.7)] transition active:scale-95 hover:brightness-110"
        >
          <span className="material-symbols-outlined text-lg animate-bounce">
            notification_important
          </span>
          <span>Alerter l’animateur</span>
        </button>
      </div>

      {/* MODAL : ALERTE PRIORITAIRE ANIMATEUR */}
      {showAlertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <form
            onSubmit={handleSendAlert}
            className="w-full max-w-md rounded-3xl border-2 border-red-500 bg-[#161014] p-5 shadow-2xl text-white animate-in zoom-in-95"
          >
            <div className="flex items-center gap-2 text-red-400">
              <span className="material-symbols-outlined text-2xl">campaign</span>
              <h3 className="font-bold text-sm uppercase tracking-wider">
                Alerte directe vers la régie animateur
              </h3>
            </div>
            <p className="mt-2 text-xs text-[#A8A6A0]">
              Cette alerte va interrompre la régie de l’animateur avec un signal visuel d’urgence pour exiger son intervention immédiate.
            </p>
            <textarea
              rows={3}
              required
              autoFocus
              value={alertReason}
              onChange={(e) => setAlertReason(e.target.value)}
              placeholder="ex: Propos injurieux répétés dans le chat par un spectateur. Intervention demandée sur le direct."
              className="mt-3 w-full rounded-2xl border border-red-500/40 bg-black/70 p-3 text-xs text-white placeholder-white/40 focus:border-red-400 focus:outline-none"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAlertModal(false)}
                className="h-9 rounded-full px-4 text-xs text-white/70 hover:bg-white/10"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="h-9 rounded-full bg-red-600 hover:bg-red-500 px-5 text-xs font-black text-white shadow-lg"
              >
                Envoyer l’alerte d’urgence
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
