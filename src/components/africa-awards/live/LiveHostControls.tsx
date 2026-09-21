"use client";
import React, { useState } from "react";
import { RankingCandidate } from "./LiveRealtimeEngine";

interface LiveHostControlsProps {
  isLive: boolean;
  onToggleLive: () => void;
  waitingCandidates: RankingCandidate[];
  onInviteCandidate: (candidate: RankingCandidate) => void;
  onInviteViewer: (username: string) => void;
  onSendAnnouncement: (text: string) => void;
  showOverlayStats: boolean;
  onToggleOverlayStats: () => void;
}

export default function LiveHostControls({
  isLive,
  onToggleLive,
  waitingCandidates,
  onInviteCandidate,
  onInviteViewer,
  onSendAnnouncement,
  showOverlayStats,
  onToggleOverlayStats,
}: LiveHostControlsProps) {
  const [showCandidateDrawer, setShowCandidateDrawer] = useState(false);
  const [showViewerModal, setShowViewerModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [viewerQuery, setViewerQuery] = useState("");
  const [announcementText, setAnnouncementText] = useState("");

  const handleBroadcastAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementText.trim()) return;
    onSendAnnouncement(announcementText.trim());
    setAnnouncementText("");
    setShowAnnouncementModal(false);
  };

  const handleInviteViewerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewerQuery.trim()) return;
    onInviteViewer(viewerQuery.trim());
    setViewerQuery("");
    setShowViewerModal(false);
  };

  return (
    <div className="w-full">
      {/* Barre de contrôle horizontale façon régie pro */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/15 bg-black/60 p-3 sm:p-4 backdrop-blur-xl shadow-2xl">
        {/* 1. GROS BOUTON DÉMARRER / ARRÊTER LE DIRECT */}
        <button
          type="button"
          onClick={onToggleLive}
          className={`flex items-center gap-2.5 rounded-full px-5 py-3 font-black text-xs uppercase tracking-wider shadow-lg transition active:scale-95 ${
            isLive
              ? "bg-red-600 hover:bg-red-700 text-white shadow-[0_0_20px_rgba(220,38,38,0.5)]"
              : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]"
          }`}
        >
          <span className="relative flex h-3 w-3">
            <span
              className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isLive ? "bg-white animate-ping" : "bg-emerald-300"
              }`}
            ></span>
            <span
              className={`relative inline-flex h-3 w-3 rounded-full ${
                isLive ? "bg-white" : "bg-emerald-200"
              }`}
            ></span>
          </span>
          <span>{isLive ? "Arrêter le direct" : "Démarrer le direct"}</span>
        </button>

        {/* GROUPE DE BOUTONS RONDS DE CONTRÔLE */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Inviter un candidat */}
          <div className="relative">
            <button
              type="button"
              disabled={!isLive}
              onClick={() => setShowCandidateDrawer(true)}
              title="Inviter un candidat sur scène"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-[#F4D976] transition active:scale-95 disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[20px]">person_add</span>
            </button>
            {waitingCandidates.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#D4AF37] text-[9px] font-black text-black shadow">
                {waitingCandidates.length}
              </span>
            )}
          </div>

          {/* Inviter un spectateur */}
          <button
            type="button"
            disabled={!isLive}
            onClick={() => setShowViewerModal(true)}
            title="Inviter un spectateur à intervenir"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white/90 transition active:scale-95 disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-[20px]">group_add</span>
          </button>

          {/* Bouton Annonce Mégaphone */}
          <button
            type="button"
            disabled={!isLive}
            onClick={() => setShowAnnouncementModal(true)}
            title="Lancer une annonce overlay chez tous les spectateurs"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-r from-amber-500/30 to-red-500/30 hover:from-amber-500/50 hover:to-red-500/50 border border-amber-500/40 text-amber-300 transition active:scale-95 disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-[20px]">campaign</span>
          </button>

          {/* Bouton Afficher / Masquer infos */}
          <button
            type="button"
            onClick={onToggleOverlayStats}
            title={showOverlayStats ? "Masquer éléments overlay" : "Afficher éléments overlay"}
            className={`flex h-11 w-11 items-center justify-center rounded-full border transition active:scale-95 ${
              showOverlayStats
                ? "bg-[#D4AF37]/25 border-[#D4AF37] text-[#F4D976]"
                : "bg-white/10 border-white/20 text-white/60"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">
              {showOverlayStats ? "visibility" : "visibility_off"}
            </span>
          </button>
        </div>
      </div>

      {/* MODAL / TIROIR 1 : Inviter un candidat en coulisses */}
      {showCandidateDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-[#D4AF37]/40 bg-[#121218] p-5 shadow-2xl text-white animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-bold text-sm text-[#F4D976] flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">group</span>
                Candidats en attente de monter sur scène
              </h3>
              <button
                type="button"
                onClick={() => setShowCandidateDrawer(false)}
                className="rounded-full p-1 text-white/60 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 max-h-60 overflow-y-auto space-y-2">
              {waitingCandidates.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 p-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full overflow-hidden bg-black/50 border border-white/20">
                      {c.photoUrl ? (
                        <img src={c.photoUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-xs font-bold text-[#F4D976]">
                          {c.name[0]}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{c.name}</p>
                      <p className="text-[10px] text-[#A8A6A0]">{c.votes} votes</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onInviteCandidate(c);
                      setShowCandidateDrawer(false);
                    }}
                    className="h-8 rounded-full bg-[#D4AF37] hover:bg-[#F4D976] text-black font-extrabold px-3 text-xs shadow"
                  >
                    Faire monter
                  </button>
                </div>
              ))}
              {waitingCandidates.length === 0 && (
                <p className="text-center text-xs text-[#A8A6A0] py-6">
                  Tous les candidats acceptés sont déjà sur scène ou aucun candidat en attente.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2 : Inviter un spectateur */}
      {showViewerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <form
            onSubmit={handleInviteViewerSubmit}
            className="w-full max-w-sm rounded-3xl border border-white/20 bg-[#121218] p-5 shadow-2xl text-white animate-in zoom-in-95"
          >
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">person_search</span>
              Inviter un spectateur à intervenir
            </h3>
            <p className="mt-1 text-xs text-[#A8A6A0]">
              Entrez le pseudo ou l’email du spectateur connecté.
            </p>
            <input
              type="text"
              autoFocus
              value={viewerQuery}
              onChange={(e) => setViewerQuery(e.target.value)}
              placeholder="ex: Amina92"
              className="mt-3 h-10 w-full rounded-full border border-white/20 bg-black/60 px-4 text-xs text-white placeholder-white/40 focus:border-[#D4AF37] focus:outline-none"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowViewerModal(false)}
                className="h-8 rounded-full px-4 text-xs text-white/70 hover:bg-white/10"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="h-8 rounded-full bg-[#D4AF37] px-4 text-xs font-bold text-black"
              >
                Envoyer invitation
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3 : Annonce Mégaphone */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <form
            onSubmit={handleBroadcastAnnouncement}
            className="w-full max-w-md rounded-3xl border border-amber-500/50 bg-[#14121A] p-5 shadow-2xl text-white animate-in zoom-in-95"
          >
            <div className="flex items-center gap-2 text-amber-400">
              <span className="material-symbols-outlined text-xl">campaign</span>
              <h3 className="font-bold text-sm">Diffuser une annonce prioritaire</h3>
            </div>
            <p className="mt-1 text-xs text-[#A8A6A0]">
              Ce message apparaîtra instantanément en bandeau doré au centre de l’écran de tous les spectateurs.
            </p>
            <textarea
              rows={3}
              autoFocus
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              placeholder="ex: Les votes ferment dans 3 minutes ! Votez pour votre champion."
              className="mt-3 w-full rounded-2xl border border-white/20 bg-black/60 p-3 text-xs text-white placeholder-white/40 focus:border-amber-400 focus:outline-none"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAnnouncementModal(false)}
                className="h-9 rounded-full px-4 text-xs text-white/70 hover:bg-white/10"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="h-9 rounded-full bg-gradient-to-r from-amber-500 to-red-500 px-5 text-xs font-extrabold text-white shadow-lg hover:brightness-110"
              >
                Diffuser maintenant
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
