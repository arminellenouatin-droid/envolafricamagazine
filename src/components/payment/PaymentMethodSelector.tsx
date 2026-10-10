"use client";

import React, { useEffect, useState } from "react";
import { getCountryInfo, getCountryFlag, getCountryFlagImgUrl } from "@/lib/country-data";
import { isMonerooSupportedCountry, PaymentGateway } from "@/lib/payment-config";

export interface PaymentMethodSelectorProps {
  selectedGateway: PaymentGateway;
  onSelectGateway: (gateway: PaymentGateway) => void;
  detectedCountryCode?: string;
  disabled?: boolean;
  className?: string;
}

export default function PaymentMethodSelector({
  selectedGateway,
  onSelectGateway,
  detectedCountryCode: initialCountryCode,
  disabled = false,
  className = "",
}: PaymentMethodSelectorProps) {
  const [countryCode, setCountryCode] = useState<string>(initialCountryCode || "BJ");
  const [loadingGeo, setLoadingGeo] = useState<boolean>(!initialCountryCode);

  useEffect(() => {
    if (initialCountryCode) {
      setCountryCode(initialCountryCode.toUpperCase());
      return;
    }

    let isMounted = true;
    fetch("/api/geo")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted) return;
        if (data?.countryCode) {
          setCountryCode(String(data.countryCode).toUpperCase());
        }
      })
      .catch(() => {
        // Fallback déterministe
      })
      .finally(() => {
        if (isMounted) setLoadingGeo(false);
      });

    return () => {
      isMounted = false;
    };
  }, [initialCountryCode]);

  const countryInfo = getCountryInfo(countryCode);
  const flagEmoji = getCountryFlag(countryCode);
  const flagImgUrl = getCountryFlagImgUrl(countryCode);
  const isMonerooEligible = isMonerooSupportedCountry(countryCode);

  // Synchronisation stricte de la sélection :
  // Si le pays n'est pas éligible à Moneroo, Chariow est obligatoirement sélectionné et verrouillé
  useEffect(() => {
    if (!isMonerooEligible && selectedGateway !== "chariow") {
      onSelectGateway("chariow");
    }
  }, [isMonerooEligible, selectedGateway, onSelectGateway]);

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-[13px] font-bold text-[#1b1c1c] dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
          <span>Mode de règlement</span>
          <span className="text-[11px] font-normal text-[#5c403f] dark:text-slate-400 lowercase">
            ({countryInfo.name} détecté)
          </span>
        </label>
        {!isMonerooEligible && (
          <span className="text-[10px] bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-900/60">
            Paiement Monde
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* OPTION 1 : PAYS DÉTECTÉ / MONEROO */}
        <button
          type="button"
          disabled={disabled || !isMonerooEligible}
          onClick={() => {
            if (isMonerooEligible) onSelectGateway("moneroo");
          }}
          className={`relative flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${
            isMonerooEligible
              ? selectedGateway === "moneroo"
                ? "border-[#9e001f] bg-[#fff8f8] dark:bg-[#9e001f]/10 shadow-sm ring-1 ring-[#9e001f]"
                : "border-[#e5bdbb] dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-[#9e001f]/60 hover:bg-[#fcf9f8] dark:hover:bg-slate-800/60"
              : "border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 opacity-70 cursor-not-allowed"
          }`}
        >
          {/* Radio indicator */}
          <div className="mt-0.5 flex-shrink-0">
            <div
              className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                selectedGateway === "moneroo" && isMonerooEligible
                  ? "border-[#9e001f] bg-[#9e001f]"
                  : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
              }`}
            >
              {selectedGateway === "moneroo" && isMonerooEligible && (
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              )}
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {flagImgUrl ? (
                <img
                  src={flagImgUrl}
                  alt={countryInfo.name}
                  className="w-4 h-3 object-cover rounded-xs shadow-2xs flex-shrink-0"
                  onError={(e) => {
                    // Fallback sur l'emoji si l'image CDN est indisponible
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <span className="text-sm leading-none">{flagEmoji}</span>
              )}
              <span className="font-bold text-[14px] text-[#1b1c1c] dark:text-slate-100 truncate">
                {countryInfo.name}
              </span>
            </div>

            <p className="mt-1 text-[11px] text-[#5c403f] dark:text-slate-400 leading-snug">
              {isMonerooEligible ? (
                <span>Paiement local (Mobile Money & Cartes)</span>
              ) : (
                <span className="text-amber-800 dark:text-amber-300 font-medium">
                  Paiement Monde
                </span>
              )}
            </p>
          </div>
        </button>

        {/* OPTION 2 : MONDE / CHARIOW */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onSelectGateway("chariow")}
          className={`relative flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${
            selectedGateway === "chariow"
              ? "border-[#9e001f] bg-[#fff8f8] dark:bg-[#9e001f]/10 shadow-sm ring-1 ring-[#9e001f]"
              : "border-[#e5bdbb] dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-[#9e001f]/60 hover:bg-[#fcf9f8] dark:hover:bg-slate-800/60"
          }`}
        >
          {/* Radio indicator */}
          <div className="mt-0.5 flex-shrink-0">
            <div
              className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                selectedGateway === "chariow"
                  ? "border-[#9e001f] bg-[#9e001f]"
                  : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
              }`}
            >
              {selectedGateway === "chariow" && (
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              )}
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-base leading-none">🌐</span>
              <span className="font-bold text-[14px] text-[#1b1c1c] dark:text-slate-100 truncate">
                Monde
              </span>
              {!isMonerooEligible && (
                <span className="ml-auto text-[9px] bg-[#9e001f]/10 text-[#9e001f] dark:text-[#ffb3ba] font-bold px-1.5 py-0.5 rounded uppercase">
                  Recommandé
                </span>
              )}
            </div>

            <p className="mt-1 text-[11px] text-[#5c403f] dark:text-slate-400 leading-snug">
              <span>Paiement international (Chariow • Visa/Mastercard)</span>
            </p>
          </div>
        </button>
      </div>

      <div className="flex items-center justify-between text-[11px] text-[#746665] dark:text-slate-400 pt-0.5">
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-[13px] text-emerald-600 dark:text-emerald-400">
            verified_user
          </span>
          Transactions 100% chiffrées & sécurisées
        </span>
        <span className="font-medium text-[#9e001f] dark:text-rose-400">
          {selectedGateway === "moneroo" ? "Passerelle Moneroo" : "Passerelle Chariow"}
        </span>
      </div>
    </div>
  );
}
