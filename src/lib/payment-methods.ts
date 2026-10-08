export interface PaymentMethodDisplay {
  code: string;
  label: string;
  icon: string;
  tone: string;
  logo?: string;
}

const BENIN_XOF_METHODS: PaymentMethodDisplay[] = [
  { code: "card_xof", label: "Carte bancaire", icon: "credit_card", tone: "text-[#1b1c1c]" },
  { code: "mtn_bj", label: "MTN MoMo", icon: "smartphone", tone: "text-[#7b6200]" },
  { code: "moov_bj", label: "Moov Money", icon: "smartphone", tone: "text-[#087443]" },
  { code: "celtiis_bj", label: "Celtiis Cash", icon: "smartphone", tone: "text-[#087e8b]" },
];

const CI_XOF_METHODS: PaymentMethodDisplay[] = [
  { code: "card_xof", label: "Carte bancaire", icon: "credit_card", tone: "text-[#1b1c1c]" },
  { code: "mtn_ci", label: "MTN MoMo CI", icon: "smartphone", tone: "text-[#7b6200]" },
  { code: "orange_ci", label: "Orange Money CI", icon: "smartphone", tone: "text-[#f26522]" },
  { code: "moov_ci", label: "Moov Money CI", icon: "smartphone", tone: "text-[#087443]" },
  { code: "wave_ci", label: "Wave CI", icon: "smartphone", tone: "text-[#1dc3e2]" },
];

const SN_XOF_METHODS: PaymentMethodDisplay[] = [
  { code: "card_xof", label: "Carte bancaire", icon: "credit_card", tone: "text-[#1b1c1c]" },
  { code: "orange_sn", label: "Orange Money Sénégal", icon: "smartphone", tone: "text-[#f26522]" },
  { code: "wave_sn", label: "Wave Sénégal", icon: "smartphone", tone: "text-[#1dc3e2]" },
  { code: "free_sn", label: "Free Money Sénégal", icon: "smartphone", tone: "text-[#e20613]" },
];

export function getAvailablePaymentMethods(countryCode: string, currency: string): PaymentMethodDisplay[] {
  const c = countryCode.toUpperCase();
  const cur = currency.toUpperCase();
  if (cur === "XOF") {
    if (c === "BJ") return BENIN_XOF_METHODS;
    if (c === "CI") return CI_XOF_METHODS;
    if (c === "SN") return SN_XOF_METHODS;
    return BENIN_XOF_METHODS; // Fallback régional UEMOA
  }
  return [{ code: "card", label: "Carte bancaire internationale", icon: "credit_card", tone: "text-[#1b1c1c]" }];
}

export function getMonerooMethodCodes(countryCode: string, currency: string): string[] {
  return getAvailablePaymentMethods(countryCode, currency).map((method) => method.code);
}

