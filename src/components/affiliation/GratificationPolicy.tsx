"use client";

import React, { useState } from "react";

interface GratificationPolicyProps {
  compact?: boolean;
  accepted?: boolean;
  onAcceptedChange?: (accepted: boolean) => void;
}

export default function GratificationPolicy({
  compact = false,
  accepted,
  onAcceptedChange,
}: GratificationPolicyProps) {
  const [openSection, setOpenSection] = useState<number | null>(null);

  const toggleSection = (id: number) => {
    setOpenSection(openSection === id ? null : id);
  };

  return (
    <div className="space-y-6 text-[#0A1931]">
      {/* En-tête officiel */}
      <div className="rounded-[24px] bg-gradient-to-br from-[#0A1931] via-[#12284C] to-[#0A1931] p-6 md:p-8 text-white shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-[#D4AF37]">
            ✦ Document Officiel Public
          </span>
          <span className="text-xs text-white/60 font-mono">Dernière mise à jour : 2026</span>
        </div>
        <h2 className="mt-4 font-serif text-2xl md:text-3xl font-black text-white">
          Politique de Gratification des Ambassadeurs
        </h2>
        <p className="mt-2 text-sm text-zinc-300 max-w-2xl leading-relaxed">
          Envol Africa Magazine s'engage à ce que chaque Ambassadeur comprenne exactement comment ses
          gains sont calculés. En toute transparence, voici l'intégralité des règles du Programme
          Ambassadeurs : fonctionnement, paliers de gains et modalités de retrait.
        </p>

        {/* 4 Piliers clés */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-xl bg-white/10 backdrop-blur-sm p-3.5 border border-white/10">
            <div className="text-[11px] font-bold text-[#D4AF37] uppercase">Gratification Brute</div>
            <div className="text-2xl font-black mt-1">15%</div>
            <div className="text-[10px] text-zinc-300 mt-0.5">Sur chaque vente magazine/abo</div>
          </div>
          <div className="rounded-xl bg-white/10 backdrop-blur-sm p-3.5 border border-white/10">
            <div className="text-[11px] font-bold text-[#D4AF37] uppercase">Part Réseau N1-N5</div>
            <div className="text-2xl font-black mt-1">70%</div>
            <div className="text-[10px] text-zinc-300 mt-0.5">Distribué aux 5 générations</div>
          </div>
          <div className="rounded-xl bg-white/10 backdrop-blur-sm p-3.5 border border-white/10">
            <div className="text-[11px] font-bold text-[#D4AF37] uppercase">Fonds Annuels</div>
            <div className="text-2xl font-black mt-1">30%</div>
            <div className="text-[10px] text-zinc-300 mt-0.5">10% prime + 20% cérémonie</div>
          </div>
          <div className="rounded-xl bg-white/10 backdrop-blur-sm p-3.5 border border-white/10">
            <div className="text-[11px] font-bold text-[#D4AF37] uppercase">Retrait Minimum</div>
            <div className="text-2xl font-black mt-1">10 000 F</div>
            <div className="text-[10px] text-zinc-300 mt-0.5">Mobile Money (MTN, Moov...)</div>
          </div>
        </div>
      </div>

      {/* Sections détaillées de la politique */}
      <div className="space-y-4">
        {/* Section 1 */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0A1931] text-xs font-bold text-white">
              1
            </span>
            <h3 className="font-serif text-lg font-black text-[#0A1931]">
              Qu'est-ce que le Programme Ambassadeurs ?
            </h3>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-zinc-600">
            Le Programme Ambassadeurs récompense les personnes qui font connaître et vendent le Magazine
            Envol Africa — abonnements et numéros — en leur reversant une partie des revenus générés,
            ainsi qu'à leur réseau de filleuls.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">
            Ce n'est pas un simple parrainage ponctuel : c'est un{" "}
            <strong className="text-[#0A1931]">réseau de partenaires</strong>, organisé sur plusieurs
            générations, où l'effort de chacun profite à celui qui l'a accompagné dans son parcours.
          </p>
        </div>

        {/* Section 2 */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0A1931] text-xs font-bold text-white">
              2
            </span>
            <h3 className="font-serif text-lg font-black text-[#0A1931]">
              Comment devenir Ambassadeur
            </h3>
          </div>
          <ul className="mt-3 space-y-2 text-sm text-zinc-600 list-disc list-inside">
            <li>
              L'inscription au programme se fait{" "}
              <strong className="text-[#0A1931]">exclusivement par invitation d'un Ambassadeur déjà actif</strong>{" "}
              (via son lien ou code personnel de parrainage au format <code className="font-mono bg-zinc-100 px-1.5 py-0.5 rounded text-xs text-[#0A1931]">EAM-XXXXX</code>).
            </li>
            <li>
              Le programme démarre avec des <strong>Ambassadeurs Fondateurs</strong> (Niveau 0), désignés
              par Envol Africa Magazine pour structurer les premiers réseaux.
            </li>
            <li>
              <strong>Il n'y a aucun frais d'inscription</strong> et aucun bonus n'est offert au seul
              recrutement : la gratification repose exclusivement sur des <strong>ventes réelles</strong>.
            </li>
          </ul>
        </div>

        {/* Section 3 */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0A1931] text-xs font-bold text-white">
              3
            </span>
            <h3 className="font-serif text-lg font-black text-[#0A1931]">
              Structure du Réseau (Matrice 5×5 sur 5 Générations)
            </h3>
          </div>
          <p className="mt-3 text-sm text-zinc-600 leading-relaxed">
            Chaque Ambassadeur peut parrainer jusqu'à <strong>5 filleuls directs</strong>. Ce réseau se
            développe ainsi de manière structurée et géométrique sur <strong>5 générations</strong> :
          </p>

          <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0A1931] text-white">
                <tr>
                  <th className="p-3 font-bold">Génération</th>
                  <th className="p-3 font-bold">Capacité Max</th>
                  <th className="p-3 font-bold">Description</th>
                  <th className="p-3 font-bold text-right">Part Réseau</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                <tr className="hover:bg-zinc-50">
                  <td className="p-3 font-bold text-blue-900">Génération 1</td>
                  <td className="p-3 font-mono font-bold">5</td>
                  <td className="p-3 text-zinc-600">Vos 5 filleuls directs</td>
                  <td className="p-3 text-right font-black text-emerald-700">40%</td>
                </tr>
                <tr className="hover:bg-zinc-50">
                  <td className="p-3 font-bold text-blue-900">Génération 2</td>
                  <td className="p-3 font-mono font-bold">25</td>
                  <td className="p-3 text-zinc-600">Les filleuls de vos filleuls</td>
                  <td className="p-3 text-right font-black text-emerald-700">25%</td>
                </tr>
                <tr className="hover:bg-zinc-50">
                  <td className="p-3 font-bold text-blue-900">Génération 3</td>
                  <td className="p-3 font-mono font-bold">125</td>
                  <td className="p-3 text-zinc-600">Sous-réseau de génération 3</td>
                  <td className="p-3 text-right font-black text-emerald-700">15%</td>
                </tr>
                <tr className="hover:bg-zinc-50">
                  <td className="p-3 font-bold text-blue-900">Génération 4</td>
                  <td className="p-3 font-mono font-bold">625</td>
                  <td className="p-3 text-zinc-600">Sous-réseau de génération 4</td>
                  <td className="p-3 text-right font-black text-emerald-700">12%</td>
                </tr>
                <tr className="hover:bg-zinc-50">
                  <td className="p-3 font-bold text-blue-900">Génération 5</td>
                  <td className="p-3 font-mono font-bold">3 125</td>
                  <td className="p-3 text-zinc-600">Dernière génération du réseau</td>
                  <td className="p-3 text-right font-black text-emerald-700">8%</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-zinc-500 italic">
            Chaque vente réalisée par un membre de votre réseau — à n'importe quelle génération jusqu'à la
            5ᵉ — vous fait gagner une part de gratification, en plus de sa propre récompense.
          </p>
        </div>

        {/* Section 4 & 5 */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0A1931] text-xs font-bold text-white">
              4
            </span>
            <h3 className="font-serif text-lg font-black text-[#0A1931]">
              Calcul et Répartition des Gratifications (15% Brute)
            </h3>
          </div>
          <p className="mt-3 text-sm text-zinc-600 leading-relaxed">
            Sur chaque vente de magazine ou d'abonnement, Envol Africa reverse{" "}
            <strong>15% du montant</strong> en gratifications, réparties automatiquement comme suit :
          </p>

          <div className="mt-4 grid md:grid-cols-3 gap-3">
            <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4">
              <div className="text-xs font-bold text-blue-900 uppercase">Part Réseau Ambassadeurs</div>
              <div className="text-2xl font-black text-blue-900 mt-1">70%</div>
              <div className="text-xs text-blue-700 mt-1">
                Distribué entre les 5 générations (40%, 25%, 15%, 12%, 8%)
              </div>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
              <div className="text-xs font-bold text-amber-900 uppercase">Fonds Primes Réseau</div>
              <div className="text-2xl font-black text-amber-900 mt-1">10%</div>
              <div className="text-xs text-amber-700 mt-1">
                Fonds annuel pour les réseaux atteignant au moins la 3ᵉ génération
              </div>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
              <div className="text-xs font-bold text-amber-900 uppercase">Fonds Cérémonie Annuelle</div>
              <div className="text-2xl font-black text-amber-900 mt-1">20%</div>
              <div className="text-xs text-amber-700 mt-1">
                Grand prix récompensant les meilleurs volumes annuels
              </div>
            </div>
          </div>

          {/* Exemple concret */}
          <div className="mt-5 rounded-xl bg-zinc-50 border p-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#0A1931]">
              💡 Exemple Concret Chiffré : Vente d'un Abonnement à 10 000 XOF
            </h4>
            <div className="mt-2 text-xs text-zinc-600 space-y-1">
              <p>
                • <strong>Gratification globale générée (15%)</strong> : <strong>1 500 XOF</strong>
              </p>
              <p>
                • <strong>Part réseau (70%)</strong> : <strong>1 050 XOF</strong> répartis :
              </p>
              <div className="pl-4 font-mono text-[11px] text-zinc-700 space-y-0.5">
                <div>- Génération 1 (Parrain direct) : 40% × 1 050 F = <strong>420 XOF</strong></div>
                <div>- Génération 2 : 25% × 1 050 F = <strong>262,5 XOF</strong></div>
                <div>- Génération 3 : 15% × 1 050 F = <strong>157,5 XOF</strong></div>
                <div>- Génération 4 : 12% × 1 050 F = <strong>126 XOF</strong></div>
                <div>- Génération 5 : 8% × 1 050 F = <strong>84 XOF</strong></div>
              </div>
              <p className="pt-1">
                • <strong>Fonds de primes réseau (10%)</strong> : <strong>150 XOF</strong>
              </p>
              <p>
                • <strong>Fonds de cérémonie annuelle (20%)</strong> : <strong>300 XOF</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Section 5 */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0A1931] text-xs font-bold text-white">
              5
            </span>
            <h3 className="font-serif text-lg font-black text-[#0A1931]">
              Condition d'Éligibilité Mensuelle aux Gains Réseau
            </h3>
          </div>
          <p className="mt-3 text-sm text-zinc-600 leading-relaxed">
            Pour être éligible aux gratifications générées par votre réseau chaque mois, vous devez{" "}
            <strong>avoir personnellement réalisé au moins 1 vente de magazine et 1 abonnement</strong> ce
            même mois.
          </p>
          <div className="mt-3 rounded-xl bg-emerald-50 border border-emerald-100 p-3.5 text-xs text-emerald-800">
            <strong>Pourquoi cette règle ?</strong> Elle garantit que le programme récompense des
            Ambassadeurs actifs et engagés, et non de simples recruteurs passifs. C'est ce qui fait la
            solidité, la conformité légale et la légitimité éthique de notre programme.
          </div>
        </div>

        {/* Section 6 */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0A1931] text-xs font-bold text-white">
              6
            </span>
            <h3 className="font-serif text-lg font-black text-[#0A1931]">
              Modalités de Retrait des Gains
            </h3>
          </div>
          <div className="mt-4 grid sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-zinc-50 border">
              <div className="text-[11px] font-bold uppercase text-zinc-500">Devise</div>
              <div className="text-base font-black text-[#0A1931] mt-0.5">Franc CFA (XOF)</div>
            </div>
            <div className="p-3.5 rounded-xl bg-zinc-50 border">
              <div className="text-[11px] font-bold uppercase text-zinc-500">Seuil de Retrait</div>
              <div className="text-base font-black text-emerald-700 mt-0.5">10 000 XOF</div>
            </div>
            <div className="p-3.5 rounded-xl bg-zinc-50 border">
              <div className="text-[11px] font-bold uppercase text-zinc-500">Moyens de Retrait</div>
              <div className="text-base font-black text-[#0A1931] mt-0.5">Mobile Money (MTN, Moov, Orange, Wave)</div>
            </div>
          </div>
          <p className="mt-3 text-xs text-zinc-500">
            Vos gains s'accumulent en temps réel sur votre tableau de bord Ambassadeur. Dès que votre
            solde atteint 10 000 XOF, vous pouvez initier une demande de retrait en renseignant votre
            numéro Mobile Money. Les paiements sont validés rapidement par notre service financier.
          </p>
        </div>

        {/* Section 7 */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0A1931] text-xs font-bold text-white">
              7
            </span>
            <h3 className="font-serif text-lg font-black text-[#0A1931]">
              Notre Engagement envers Vous
            </h3>
          </div>
          <div className="mt-3 grid sm:grid-cols-2 gap-3 text-xs text-zinc-600">
            <div className="p-3 rounded-xl bg-zinc-50 border">
              <strong className="text-[#0A1931] block mb-1">✓ Aucun frais caché</strong>
              Rejoindre le programme Ambassadeurs est entièrement gratuit.
            </div>
            <div className="p-3 rounded-xl bg-zinc-50 border">
              <strong className="text-[#0A1931] block mb-1">✓ Ventes réelles uniquement</strong>
              Chaque XOF distribué provient d'une vente effective de magazine ou d'abonnement.
            </div>
            <div className="p-3 rounded-xl bg-zinc-50 border">
              <strong className="text-[#0A1931] block mb-1">✓ Transparence totale</strong>
              Les pourcentages sont fixes, publics et audités en continu sur votre tableau de bord.
            </div>
            <div className="p-3 rounded-xl bg-zinc-50 border">
              <strong className="text-[#0A1931] block mb-1">✓ Suivi en temps réel</strong>
              Visualisez toute votre descendance et vos commissions seconde après seconde.
            </div>
          </div>
        </div>
      </div>

      {/* Case d'acceptation si en mode signature / onboarding */}
      {onAcceptedChange !== undefined && (
        <div className="rounded-2xl border-2 border-[#D4AF37] bg-amber-50/50 p-5 mt-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(accepted)}
              onChange={(e) => onAcceptedChange(e.target.checked)}
              className="mt-1 h-5 w-5 rounded border-zinc-300 text-[#0A1931] focus:ring-[#D4AF37]"
            />
            <span className="text-sm font-bold text-[#0A1931] leading-relaxed">
              J'atteste avoir lu, compris et j'accepte l'intégralité de la{" "}
              <span className="text-[#0A1931] underline">Politique de Gratification des Ambassadeurs</span>{" "}
              d'Envol Africa Magazine ainsi que ses conditions d'éligibilité et de retrait.
            </span>
          </label>
        </div>
      )}
    </div>
  );
}
