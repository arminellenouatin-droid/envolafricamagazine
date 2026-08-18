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
];

export function getAvailablePaymentMethods(countryCode: string, currency: string): PaymentMethodDisplay[] {
  if (countryCode.toUpperCase() === "BJ" && currency.toUpperCase() === "XOF") return BENIN_XOF_METHODS;
  return [];
}

export function getMonerooMethodCodes(countryCode: string, currency: string): string[] {
  return getAvailablePaymentMethods(countryCode, currency).map((method) => method.code);
}
