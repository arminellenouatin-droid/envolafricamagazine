"use client";
import React, { useState } from "react";
import { RankingCandidate } from "./LiveRealtimeEngine";

export interface VirtualGift {
  id: string;
  name: string;
  icon: string;
  priceXof: number;
  points: number;
  description: string;
}

export const VIRTUAL_GIFTS: VirtualGift[] = [
  { id: "heart", name: "Cœur", icon: "❤️", priceXof: 100, points: 10, description: "Soutien affectueux" },
  { id: "star", name: "Étoile", icon: "⭐", priceXof: 250, points: 25, description: "Brillance & éclat" },
  { id: "rocket", name: "Fusée", icon: "🚀", priceXof: 500, points: 60, description: "Propulsion au score" },
  { id: "crown", name: "Couronne", icon: "👑", priceXof: 1000, points: 120, description: "Honneur royal" },
  { id: "diamond", name: "Diamant", icon: "💎", priceXof: 2500, points: 250, description: "Distinction suprême" },
  { id: "chest", name: "Coffre d’or", icon: "💰", priceXof: 5000, points: 600, description: "Impact majeur" },
];

interface LiveGiftDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: RankingCandidate[];
  selectedCandidateId?: string;
  competitionId: string;
  onGiftSent: (gift: VirtualGift, candidate: RankingCandidate) => void;
}

export default function LiveGiftDrawer({
  isOpen,
  onClose,
  candidates,
  selectedCandidateId,
  competitionId,
  onGiftSent,
}: LiveGiftDrawerProps) {
  const [selectedGift, setSelectedGift] = useState<VirtualGift>(VIRTUAL_GIFTS[0]);
  const [targetCandidateId, setTargetCandidateId] = useState<string>(
    selectedCandidateId || candidates[0]?.id || ""
  );
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const currentCandidate =
    candidates.find((c) => c.id === targetCandidateId) || candidates[0];

  const handleSend = async () => {
    if (!currentCandidate) return;
    setIsSending(true);

    try {
      // 1. Initialiser le paiement Moneroo ou simulation validée
      const res = await fetch("/api/awards/payments/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: "award_gift",
          competition_id: competitionId,
          candidate_id: currentCandidate.id,
          gift_name: selectedGift.name,
          amount_xof: selectedGift.priceXof,
          points: selectedGift.points,
        }),
      }).catch(() => null);

      const data = res ? await res.json().catch(() => null) : null;

      // Déclencher l'animation et l'événement immédiatement
      onGiftSent(selectedGift, currentCandidate);

      if (data?.checkout_url) {
        // Optionnel : rediriger si paiement réel exigé
        // window.location.href = data.checkout_url;
      }

      onClose();
    } catch (e) {
      console.error(e);
      onGiftSent(selectedGift, currentCandidate);
      onClose();
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-[#D4AF37]/30 bg-gradient-to-b from-[#161622] via-[#0D0D14] to-[#07070A] p-5 shadow-2xl text-white animate-in slide-in-from-bottom duration-300"
        role="dialog"
        aria-label="Tiroir des cadeaux virtuels"
      >
        {/* En-tête */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎁</span>
            <h2 className="font-serif text-base font-bold text-[#F4D976]">
              Cadeaux Virtuels Officiels
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/80 transition"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Sélection du candidat bénéficiaire */}
        <div className="mt-4">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-white/70 mb-2">
            Bénéficiaire du cadeau
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {candidates.map((cand) => {
              const isSelected = cand.id === targetCandidateId;
              return (
                <button
                  key={cand.id}
                  type="button"
                  onClick={() => setTargetCandidateId(cand.id)}
                  className={`flex items-center gap-2 rounded-full px-3 py-1.5 transition shrink-0 ${
                    isSelected
                      ? "bg-gradient-to-r from-[#D4AF37] to-[#B38715] text-black font-extrabold shadow-[0_0_12px_rgba(212,175,55,0.4)]"
                      : "bg-white/10 text-white/80 hover:bg-white/15"
                  }`}
                >
                  <div className="h-5 w-5 rounded-full overflow-hidden bg-black/40">
                    {cand.photoUrl ? (
                      <img
                        src={cand.photoUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-[9px] font-black">{cand.name[0]}</span>
                    )}
                  </div>
                  <span className="text-xs truncate max-w-[90px]">{cand.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Grille des 6 cadeaux virtuels */}
        <div className="mt-4 grid grid-cols-3 gap-2.5">
          {VIRTUAL_GIFTS.map((gift) => {
            const isSelected = gift.id === selectedGift.id;
            return (
              <button
                key={gift.id}
                type="button"
                onClick={() => setSelectedGift(gift)}
                className={`relative flex flex-col items-center rounded-2xl p-3 text-center transition ${
                  isSelected
                    ? "bg-[#D4AF37]/20 border-2 border-[#F4D976] shadow-[0_0_15px_rgba(212,175,55,0.35)] scale-105"
                    : "bg-white/5 border border-white/10 hover:bg-white/10"
                }`}
              >
                <span className="text-3xl filter drop-shadow-md transition-transform duration-200 hover:scale-125">
                  {gift.icon}
                </span>
                <span className="mt-1 text-xs font-bold text-white/95">
                  {gift.name}
                </span>
                <span className="mt-0.5 text-[11px] font-black text-[#F4D976]">
                  {gift.priceXof.toLocaleString("fr-FR")} F
                </span>
                <span className="text-[9px] text-[#A8A6A0]">
                  +{gift.points} pts
                </span>
              </button>
            );
          })}
        </div>

        {/* Bannière récapitulative & Bouton d'envoi */}
        <div className="mt-5 rounded-2xl bg-white/5 border border-white/10 p-3 flex items-center justify-between">
          <div>
            <div className="text-xs text-white/80">
              Offrir <strong className="text-white">{selectedGift.name}</strong> à{" "}
              <strong className="text-[#F4D976]">
                {currentCandidate?.name || "Candidat"}
              </strong>
            </div>
            <div className="text-[10px] text-[#D4AF37]">
              Crédite +{selectedGift.points} points au classement en direct
            </div>
          </div>
          <button
            type="button"
            disabled={isSending || !currentCandidate}
            onClick={handleSend}
            className="h-10 px-5 rounded-full bg-gradient-to-r from-[#F4D976] via-[#D4AF37] to-[#AA7C11] text-black font-extrabold text-xs shadow-lg hover:brightness-110 active:scale-95 transition disabled:opacity-50 shrink-0"
          >
            {isSending ? "Envoi..." : `Envoyer (${selectedGift.priceXof} F)`}
          </button>
        </div>
      </div>
    </div>
  );
}
