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
    <div className="space-y-6 text-[#2b2525]">
      {/* En-tête officiel Magazine & Kiosque */}
      <div className="rounded-[24px] bg-gradient-to-br from-[#2b2525] via-[#3d1d23] to-[#2b2525] p-6 md:p-8 text-white shadow-md border border-[#522930]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#9e001f]/50 border border-[#ffdad8]/30 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-[#ffdad8]">
            ✦ Document Officiel Public
          </span>
          <span className="text-xs text-white/70 font-mono">Dernière mise à jour : 2026</span>
        </div>
        <h2 className="mt-4 font-serif text-2xl md:text-3xl font-black text-white">
          Politique de Gratification des Ambassadeurs
        </h2>
        <p className="mt-2 text-sm text-white/80 max-w-2xl leading-relaxed">
          Envol Africa Magazine s&apos;engage à ce que chaque Ambassadeur comprenne exactement comment ses
          gains sont calculés. En toute transparence, voici l&apos;intégralité des règles du Programme
          Ambassadeurs : fonctionnement, paliers de gains et modalités de retrait.
        </p>

        {/* 4 Piliers clés */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-xl bg-white/10 backdrop-blur-sm p-3.5 border border-white/15">
            <div className="text-[11px] font-bold text-[#ffdad8] uppercase tracking-wide">Gratification Brute</div>
            <div className="text-2xl font-serif font-black mt-1 text-white">15%</div>
            <div className="text-[10px] text-white/75 mt-0.5">Sur chaque vente magazine/abo</div>
          </div>
          <div className="rounded-xl bg-white/10 backdrop-blur-sm p-3.5 border border-white/15">
            <div className="text-[11px] font-bold text-[#ffdad8] uppercase tracking-wide">Part Réseau N1-N5</div>
            <div className="text-2xl font-serif font-black mt-1 text-white">70%</div>
            <div className="text-[10px] text-white/75 mt-0.5">Distribué aux 5 générations</div>
          </div>
          <div className="rounded-xl bg-white/10 backdrop-blur-sm p-3.5 border border-white/15">
            <div className="text-[11px] font-bold text-[#f0b27e] uppercase tracking-wide">Fonds Annuels</div>
            <div className="text-2xl font-serif font-black mt-1 text-white">30%</div>
            <div className="text-[10px] text-white/75 mt-0.5">10% prime + 20% cérémonie</div>
          </div>
          <div className="rounded-xl bg-white/10 backdrop-blur-sm p-3.5 border border-white/15">
            <div className="text-[11px] font-bold text-[#ffdad8] uppercase tracking-wide">Retrait Minimum</div>
            <div className="text-2xl font-serif font-black mt-1 text-white">10 000 F</div>
            <div className="text-[10px] text-white/75 mt-0.5">Mobile Money (MTN, Moov...)</div>
          </div>
        </div>
      </div>

      {/* Sections détaillées de la politique */}
      <div className="space-y-4">
        {/* Section 1 */}
        <div className="rounded-2xl border border-[#e5bdbb]/80 bg-white p-5 md:p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#9e001f] text-xs font-black text-white shrink-0">
              1
            </span>
            <h3 className="font-serif text-lg font-black text-[#2b2525]">
              Qu&apos;est-ce que le Programme Ambassadeurs ?
            </h3>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-[#746665]">
            Le Programme Ambassadeurs récompense les personnes qui font connaître et vendent le Magazine
            Envol Africa — abonnements et numéros — en leur reversant une partie des revenus générés,
            ainsi qu&apos;à leur réseau de filleuls.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[#746665]">
            Ce n&apos;est pas un simple parrainage ponctuel : c&apos;est un{" "}
            <strong className="text-[#9e001f]">réseau de partenaires</strong>, organisé sur plusieurs
            générations, où l&apos;effort de chacun profite à celui qui l&apos;a accompagné dans son parcours.
          </p>
        </div>

        {/* Section 2 */}
        <div className="rounded-2xl border border-[#e5bdbb]/80 bg-white p-5 md:p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#9e001f] text-xs font-black text-white shrink-0">
              2
            </span>
            <h3 className="font-serif text-lg font-black text-[#2b2525]">
              Comment devenir Ambassadeur
            </h3>
          </div>
          <ul className="mt-3 space-y-2 text-sm text-[#746665] list-disc list-inside">
            <li>
              L&apos;inscription au programme se fait{" "}
              <strong className="text-[#2b2525]">exclusivement par invitation d&apos;un Ambassadeur déjà actif</strong>{" "}
              (via son lien ou code personnel de parrainage au format <code className="font-mono bg-[#f4ecea] px-1.5 py-0.5 rounded text-xs text-[#9e001f] font-bold">EAM-XXXXX</code>).
            </li>
            <li>
              Le programme démarre avec des <strong>Ambassadeurs Fondateurs</strong> (Niveau 0), désignés
              par Envol Africa Magazine pour structurer les premiers réseaux.
            </li>
            <li>
              <strong>Il n&apos;y a aucun frais d&apos;inscription</strong> et aucun bonus n&apos;est offert au seul
              recrutement : la gratification repose exclusivement sur des <strong>ventes réelles</strong>.
            </li>
          </ul>
        </div>

        {/* Section 3 */}
        <div className="rounded-2xl border border-[#e5bdbb]/80 bg-white p-5 md:p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#9e001f] text-xs font-black text-white shrink-0">
              3
            </span>
            <h3 className="font-serif text-lg font-black text-[#2b2525]">
              Structure du Réseau (Matrice 5×5 sur 5 Générations)
            </h3>
          </div>
          <p className="mt-3 text-sm text-[#746665] leading-relaxed">
            Chaque Ambassadeur peut parrainer jusqu&apos;à <strong>5 filleuls directs</strong>. Ce réseau se
            développe ainsi de manière structurée et géométrique sur <strong>5 générations</strong> :
          </p>

          <div className="mt-4 overflow-x-auto rounded-xl border border-[#e5bdbb]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f4ecea] text-[#2b2525] border-b border-[#e5bdbb]">
                <tr>
                  <th className="p-3 font-bold uppercase tracking-wider">Génération</th>
                  <th className="p-3 font-bold uppercase tracking-wider">Capacité Max</th>
                  <th className="p-3 font-bold uppercase tracking-wider">Description</th>
                  <th className="p-3 font-bold text-right uppercase tracking-wider">Part Réseau</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5bdbb]/50">
                <tr className="hover:bg-[#fcf9f8] transition">
                  <td className="p-3 font-bold text-[#9e001f]">Génération 1</td>
                  <td className="p-3 font-mono font-bold text-[#2b2525]">5</td>
                  <td className="p-3 text-[#746665]">Vos 5 filleuls directs</td>
                  <td className="p-3 text-right font-black text-[#9e001f] font-mono text-sm">40%</td>
                </tr>
                <tr className="hover:bg-[#fcf9f8] transition">
                  <td className="p-3 font-bold text-[#9e001f]">Génération 2</td>
                  <td className="p-3 font-mono font-bold text-[#2b2525]">25</td>
                  <td className="p-3 text-[#746665]">Les filleuls de vos filleuls</td>
                  <td className="p-3 text-right font-black text-[#9e001f] font-mono text-sm">25%</td>
                </tr>
                <tr className="hover:bg-[#fcf9f8] transition">
                  <td className="p-3 font-bold text-[#9e001f]">Génération 3</td>
                  <td className="p-3 font-mono font-bold text-[#2b2525]">125</td>
                  <td className="p-3 text-[#746665]">Sous-réseau de génération 3</td>
                  <td className="p-3 text-right font-black text-[#9e001f] font-mono text-sm">15%</td>
                </tr>
                <tr className="hover:bg-[#fcf9f8] transition">
                  <td className="p-3 font-bold text-[#9e001f]">Génération 4</td>
                  <td className="p-3 font-mono font-bold text-[#2b2525]">625</td>
                  <td className="p-3 text-[#746665]">Sous-réseau de génération 4</td>
                  <td className="p-3 text-right font-black text-[#9e001f] font-mono text-sm">12%</td>
                </tr>
                <tr className="hover:bg-[#fcf9f8] transition">
                  <td className="p-3 font-bold text-[#9e001f]">Génération 5</td>
                  <td className="p-3 font-mono font-bold text-[#2b2525]">3 125</td>
                  <td className="p-3 text-[#746665]">Dernière génération du réseau</td>
                  <td className="p-3 text-right font-black text-[#9e001f] font-mono text-sm">8%</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-2.5 text-xs text-[#746665] italic">
            Chaque vente réalisée par un membre de votre réseau — à n&apos;importe quelle génération jusqu&apos;à la
            5ᵉ — vous fait gagner une part de gratification, en plus de sa propre récompense.
          </p>
        </div>

        {/* Section 4 */}
        <div className="rounded-2xl border border-[#e5bdbb]/80 bg-white p-5 md:p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#9e001f] text-xs font-black text-white shrink-0">
              4
            </span>
            <h3 className="font-serif text-lg font-black text-[#2b2525]">
              Calcul et Répartition des Gratifications (15% Brute)
            </h3>
          </div>
          <p className="mt-3 text-sm text-[#746665] leading-relaxed">
            Sur chaque vente de magazine ou d&apos;abonnement, Envol Africa reverse{" "}
            <strong className="text-[#2b2525]">15% du montant</strong> en gratifications, réparties automatiquement comme suit :
          </p>

          <div className="mt-4 grid md:grid-cols-3 gap-3">
            <div className="rounded-xl border border-[#e5bdbb] bg-[#fff0ef] p-4">
              <div className="text-xs font-bold text-[#9e001f] uppercase tracking-wide">Part Réseau Ambassadeurs</div>
              <div className="text-2xl font-serif font-black text-[#9e001f] mt-1">70%</div>
              <div className="text-xs text-[#9e001f]/80 mt-1">
                Distribué entre les 5 générations (40%, 25%, 15%, 12%, 8%)
              </div>
            </div>
            <div className="rounded-xl border border-[#f0b27e]/60 bg-[#fff8f3] p-4">
              <div className="text-xs font-bold text-[#944400] uppercase tracking-wide">Fonds Primes Réseau</div>
              <div className="text-2xl font-serif font-black text-[#944400] mt-1">10%</div>
              <div className="text-xs text-[#944400]/80 mt-1">
                Fonds annuel pour les réseaux atteignant au moins la 3ᵉ génération
              </div>
            </div>
            <div className="rounded-xl border border-[#e5bdbb] bg-[#f4ecea] p-4">
              <div className="text-xs font-bold text-[#2b2525] uppercase tracking-wide">Fonds Cérémonie Annuelle</div>
              <div className="text-2xl font-serif font-black text-[#2b2525] mt-1">20%</div>
              <div className="text-xs text-[#746665] mt-1">
                Grand prix récompensant les meilleurs volumes annuels
              </div>
            </div>
          </div>

          {/* Exemple concret */}
          <div className="mt-5 rounded-xl bg-[#fcf9f8] border border-[#e5bdbb] p-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#9e001f]">
              💡 Exemple Concret Chiffré : Vente d&apos;un Abonnement à 10 000 XOF
            </h4>
            <div className="mt-2 text-xs text-[#2b2525] space-y-1.5">
              <p>
                • <strong>Gratification globale générée (15%)</strong> : <strong className="text-[#9e001f]">1 500 XOF</strong>
              </p>
              <p>
                • <strong>Part réseau (70%)</strong> : <strong className="text-[#9e001f]">1 050 XOF</strong> répartis :
              </p>
              <div className="pl-4 font-mono text-[11px] text-[#746665] space-y-0.5">
                <div>- Génération 1 (Parrain direct) : 40% × 1 050 F = <strong className="text-[#2b2525]">420 XOF</strong></div>
                <div>- Génération 2 : 25% × 1 050 F = <strong className="text-[#2b2525]">262,5 XOF</strong></div>
                <div>- Génération 3 : 15% × 1 050 F = <strong className="text-[#2b2525]">157,5 XOF</strong></div>
                <div>- Génération 4 : 12% × 1 050 F = <strong className="text-[#2b2525]">126 XOF</strong></div>
                <div>- Génération 5 : 8% × 1 050 F = <strong className="text-[#2b2525]">84 XOF</strong></div>
              </div>
              <p className="pt-1">
                • <strong>Fonds de primes réseau (10%)</strong> : <strong className="text-[#944400]">150 XOF</strong>
              </p>
              <p>
                • <strong>Fonds de cérémonie annuelle (20%)</strong> : <strong className="text-[#2b2525]">300 XOF</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Section 5 */}
        <div className="rounded-2xl border border-[#e5bdbb]/80 bg-white p-5 md:p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#9e001f] text-xs font-black text-white shrink-0">
              5
            </span>
            <h3 className="font-serif text-lg font-black text-[#2b2525]">
              Condition d&apos;Éligibilité Mensuelle aux Gains Réseau
            </h3>
          </div>
          <p className="mt-3 text-sm text-[#746665] leading-relaxed">
            Pour être éligible aux gratifications générées par votre réseau chaque mois, vous devez{" "}
            <strong className="text-[#2b2525]">avoir personnellement réalisé au moins 1 vente de magazine et 1 abonnement</strong> ce
            même mois.
          </p>
          <div className="mt-3 rounded-xl bg-[#fff0ef] border border-[#e5bdbb] p-3.5 text-xs text-[#9e001f] leading-relaxed">
            <strong>Pourquoi cette règle ?</strong> Elle garantit que le programme récompense des
            Ambassadeurs actifs et engagés, et non de simples recruteurs passifs. C&apos;est ce qui fait la
            solidité, la conformité légale et la légitimité éthique de notre programme éditorial.
          </div>
        </div>

        {/* Section 6 */}
        <div className="rounded-2xl border border-[#e5bdbb]/80 bg-white p-5 md:p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#9e001f] text-xs font-black text-white shrink-0">
              6
            </span>
            <h3 className="font-serif text-lg font-black text-[#2b2525]">
              Modalités de Retrait des Gains
            </h3>
          </div>
          <div className="mt-4 grid sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-[#fcf9f8] border border-[#e5bdbb]">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#746665]">Devise</div>
              <div className="text-base font-black text-[#2b2525] mt-0.5">Franc CFA (XOF)</div>
            </div>
            <div className="p-3.5 rounded-xl bg-[#fff0ef] border border-[#e5bdbb]">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#9e001f]">Seuil de Retrait</div>
              <div className="text-base font-serif font-black text-[#9e001f] mt-0.5">10 000 XOF</div>
            </div>
            <div className="p-3.5 rounded-xl bg-[#fcf9f8] border border-[#e5bdbb]">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#746665]">Moyens de Retrait</div>
              <div className="text-base font-black text-[#2b2525] mt-0.5">Mobile Money (MTN, Moov, Orange, Wave)</div>
            </div>
          </div>
          <p className="mt-3 text-xs text-[#746665] leading-relaxed">
            Vos gains s&apos;accumulent en temps réel sur votre tableau de bord Ambassadeur. Dès que votre
            solde atteint 10 000 XOF, vous pouvez initier une demande de retrait en renseignant votre
            numéro Mobile Money. Les paiements sont validés rapidement par notre service financier.
          </p>
        </div>

        {/* Section 7 */}
        <div className="rounded-2xl border border-[#e5bdbb]/80 bg-white p-5 md:p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#9e001f] text-xs font-black text-white shrink-0">
              7
            </span>
            <h3 className="font-serif text-lg font-black text-[#2b2525]">
              Notre Engagement envers Vous
            </h3>
          </div>
          <div className="mt-3 grid sm:grid-cols-2 gap-3 text-xs text-[#746665]">
            <div className="p-3.5 rounded-xl bg-[#fcf9f8] border border-[#e5bdbb]">
              <strong className="text-[#9e001f] block mb-1">✓ Aucun frais caché</strong>
              Rejoindre le programme Ambassadeurs est entièrement gratuit.
            </div>
            <div className="p-3.5 rounded-xl bg-[#fcf9f8] border border-[#e5bdbb]">
              <strong className="text-[#9e001f] block mb-1">✓ Ventes réelles uniquement</strong>
              Chaque XOF distribué provient d&apos;une vente effective de magazine ou d&apos;abonnement.
            </div>
            <div className="p-3.5 rounded-xl bg-[#fcf9f8] border border-[#e5bdbb]">
              <strong className="text-[#9e001f] block mb-1">✓ Transparence totale</strong>
              Les pourcentages sont fixes, publics et audités en continu sur votre tableau de bord.
            </div>
            <div className="p-3.5 rounded-xl bg-[#fcf9f8] border border-[#e5bdbb]">
              <strong className="text-[#9e001f] block mb-1">✓ Suivi en temps réel</strong>
              Visualisez toute votre descendance et vos commissions seconde après seconde.
            </div>
          </div>
        </div>
      </div>

      {/* Case d'acceptation si en mode signature / onboarding */}
      {onAcceptedChange !== undefined && (
        <div className="rounded-2xl border-2 border-[#9e001f] bg-[#fff0ef] p-5 mt-6 shadow-sm">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(accepted)}
              onChange={(e) => onAcceptedChange(e.target.checked)}
              className="mt-1 h-5 w-5 rounded border-[#e5bdbb] text-[#9e001f] focus:ring-[#9e001f] accent-[#9e001f]"
            />
            <span className="text-sm font-bold text-[#2b2525] leading-relaxed">
              J&apos;atteste avoir lu, compris et j&apos;accepte l&apos;intégralité de la{" "}
              <span className="text-[#9e001f] underline font-black">Politique de Gratification des Ambassadeurs</span>{" "}
              d&apos;Envol Africa Magazine ainsi que ses conditions d&apos;éligibilité et de retrait.
            </span>
          </label>
        </div>
      )}
    </div>
  );
}
