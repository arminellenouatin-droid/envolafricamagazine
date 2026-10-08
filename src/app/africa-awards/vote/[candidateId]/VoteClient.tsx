"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MIN_PAYMENT_AMOUNT_XOF } from "@/lib/payment-policy";
import { useLocale } from "@/components/LocaleProvider";

export default function VoteClient({ candidateId }: { candidateId: string }) {
  const [candidate, setCandidate] = useState<any>(null);
  const [competition, setCompetition] = useState<any>(null);
  const [votes, setVotes] = useState(1);
  const [loading, setLoading] = useState(false);
  const [wallet, setWallet] = useState<any>(null);
  const [voteSuccess, setVoteSuccess] = useState<string | null>(null);
  const [voteError, setVoteError] = useState<string | null>(null);
  const router = useRouter();
  const { formatPrice } = useLocale();

  useEffect(() => {
    fetch(`/api/awards/candidates`)
      .then((r) => r.json())
      .then((d) => {
        const cand = (d.candidates || []).find((c: any) => c.id === candidateId);
        setCandidate(cand);
        if (cand) {
          fetch(`/api/awards/competitions`)
            .then((r) => r.json())
            .then((dc) => {
              const comp = (dc.competitions || []).find(
                (c: any) => c.id === cand.competition_id
              );
              setCompetition(comp);
            });
        }
      });

    // Récupérer le solde du portefeuille si connecté
    fetch("/api/wallet")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.wallet) setWallet(d.wallet);
      })
      .catch(() => undefined);
  }, [candidateId]);

  const votePriceXOF = Math.max(
    MIN_PAYMENT_AMOUNT_XOF,
    Number(competition?.vote_price_cents) || MIN_PAYMENT_AMOUNT_XOF
  );

  const total = votes * votePriceXOF;

  // Vote avec redirection Moneroo
  const handleMonerooVote = async () => {
    setLoading(true);
    setVoteError(null);
    try {
      const amount = total;
      const res = await fetch("/api/payment/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donAmount: amount,
          currency: "XOF",
          metadata: {
            product: "award_vote",
            candidate_id: candidateId,
            competition_id: candidate?.competition_id,
            points: votes,
          },
          email: "voter@envolafrica.com",
          firstName: "Voter",
          lastName: "Awards",
        }),
      });
      const data = await res.json();
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        throw new Error(data.error || "Impossible d'initialiser le paiement Moneroo");
      }
    } catch (err: any) {
      setVoteError(err.message || "Erreur de paiement Moneroo");
    } finally {
      setLoading(false);
    }
  };

  // Vote instantané depuis le Portefeuille Envol Africa
  const handleWalletVote = async () => {
    setLoading(true);
    setVoteError(null);
    setVoteSuccess(null);
    try {
      const res = await fetch("/api/awards/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidate_id: candidateId,
          competition_id: candidate?.competition_id,
          points: votes,
          use_wallet: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Échec du vote via portefeuille");
      }
      setVoteSuccess(data.message || `Félicitations ! Votre vote de ${votes} points a été validé immédiatement.`);
      if (data.new_balance !== undefined && wallet) {
        setWallet({ ...wallet, availableBalance: data.new_balance });
      }
      if (candidate) {
        setCandidate({ ...candidate, votes: (candidate.votes || 0) + votes });
      }
    } catch (err: any) {
      setVoteError(err.message || "Erreur lors du vote via portefeuille");
    } finally {
      setLoading(false);
    }
  };

  if (!candidate)
    return (
      <div className="bg-[#0B0B0F] text-white min-h-screen p-10 flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
        Chargement du candidat...
      </div>
    );

  const canPayWithWallet = wallet && wallet.availableBalance >= total;

  return (
    <div className="bg-[#0B0B0F] text-[#F5F3EE] min-h-screen pb-20">
      <div className="max-w-[720px] mx-auto px-5 md:px-[64px] py-10">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-[#A8A6A0]">
          <Link href="/africa-awards" className="hover:text-[#D4AF37]">
            Awards
          </Link>
          <span>›</span>
          <span className="text-white">Voter</span>
        </div>
        <h1 className="text-[28px] font-black mt-4" style={{ fontFamily: "Fraunces" }}>
          Voter pour {candidate.display_name}
        </h1>
        <p className="text-[#A8A6A0] text-[13px] mt-2">
          Vote sécurisé, traçable et instantané. Choisissez votre mode de paiement : solde de votre Portefeuille Envol Africa ou Mobile Money via Moneroo.
        </p>

        {voteSuccess && (
          <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-4 text-emerald-200">
            <div className="flex items-center gap-3">
              <span className="text-xl">🎉</span>
              <div>
                <p className="font-bold text-sm">Vote Enregistré !</p>
                <p className="text-xs text-emerald-300/80">{voteSuccess}</p>
              </div>
            </div>
          </div>
        )}

        {voteError && (
          <div className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-950/40 p-4 text-rose-200">
            <div className="flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="font-bold text-sm">Erreur</p>
                <p className="text-xs text-rose-300/80">{voteError}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 bg-[#16161D] border border-white/10 rounded-[16px] p-6">
          <div className="flex gap-4">
            <img src={candidate.photo_url} alt="" className="w-20 h-20 rounded-xl object-cover" />
            <div>
              <div className="font-bold text-[16px]">{candidate.display_name}</div>
              <div className="text-[12px] text-[#A8A6A0] mt-1">
                {candidate.country} • {candidate.votes} votes • {candidate.bio?.slice(0, 80)}
              </div>
              <div className="text-[11px] text-[#D4AF37] mt-1">
                Vote certifié · Audit trail infalsifiable
              </div>
            </div>
          </div>

          <div className="mt-6">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">
              Nombre de votes
            </label>
            <div className="mt-2 flex items-center gap-4">
              <button
                onClick={() => setVotes(Math.max(1, votes - 1))}
                className="w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center font-bold text-lg hover:bg-white/20 transition"
              >
                -
              </button>
              <span className="text-[32px] font-black w-16 text-center">{votes}</span>
              <button
                onClick={() => setVotes(votes + 1)}
                className="w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center font-bold text-lg hover:bg-white/20 transition"
              >
                +
              </button>
              <span className="text-[12px] text-[#A8A6A0]">
                = {votes} points • {formatPrice(total)}
              </span>
            </div>
          </div>

          {/* Récapitulatif montant */}
          <div className="mt-6 border-t border-white/10 pt-6">
            <h4 className="font-bold text-[14px]">Récapitulatif</h4>
            <div className="mt-3 space-y-2 text-[13px]">
              <div className="flex justify-between">
                <span className="text-[#A8A6A0]">Candidat</span>
                <span className="font-bold">{candidate.display_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A8A6A0]">Points attribués</span>
                <span>{votes} pts</span>
              </div>
              <div className="flex justify-between font-bold border-t border-white/10 pt-2 mt-2">
                <span>Montant total</span>
                <span className="text-[#D4AF37] text-base">{formatPrice(total)}</span>
              </div>
            </div>
          </div>

          {/* Options de Paiement */}
          <div className="mt-8 space-y-3">
            {/* Option 1 : Portefeuille Envol Africa */}
            {wallet ? (
              <button
                onClick={handleWalletVote}
                disabled={loading || !canPayWithWallet}
                className={`w-full py-3.5 px-4 rounded-full font-black text-sm flex items-center justify-between transition shadow-sm ${
                  canPayWithWallet
                    ? "bg-amber-500 text-[#0A1931] hover:bg-amber-400"
                    : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                }`}
              >
                <span>💳 Voter avec mon Portefeuille</span>
                <span className="text-xs font-mono">
                  {canPayWithWallet
                    ? `Solde : ${wallet.availableBalance.toLocaleString("fr-FR")} XOF`
                    : `Solde insuffisant (${wallet.availableBalance.toLocaleString("fr-FR")} XOF)`}
                </span>
              </button>
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-zinc-400 flex justify-between items-center">
                <span>Connectez-vous pour utiliser votre Portefeuille Envol Africa</span>
                <Link href="/auth/login" className="text-amber-400 font-bold underline">Connexion</Link>
              </div>
            )}

            {/* Option 2 : Moneroo Mobile Money / Carte */}
            <button
              onClick={handleMonerooVote}
              disabled={loading}
              className="w-full h-12 rounded-full border border-[#D4AF37]/50 text-[#D4AF37] font-bold text-[14px] hover:bg-[#D4AF37]/10 transition disabled:opacity-50"
            >
              {loading ? "Traitement..." : `Payer ${formatPrice(total)} via Moneroo (Mobile Money / Carte) →`}
            </button>
          </div>

          <p className="text-[11px] text-[#A8A6A0] mt-4 text-center">
            Transactions sécurisées et tracées · Débit immédiat du ledger financier
          </p>
        </div>
      </div>
    </div>
  );
}
