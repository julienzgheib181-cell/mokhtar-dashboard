import { normalizePhoneForWa, fmtMoney, type Currency } from "./utils";

export type DebtType = "MOBILE" | "REPAIR" | "TRANSFER" | "SUBSCRIPTION" | "OTHER";

const typeLabel = (t: DebtType) => {
  switch (t) {
    case "MOBILE": return { en: "mobile/device", ar: "موبايل/جهاز" };
    case "REPAIR": return { en: "repair service", ar: "تصليح/صيانة" };
    case "TRANSFER": return { en: "transfer/service", ar: "تحويل/خدمات" };
    case "SUBSCRIPTION": return { en: "subscription", ar: "اشتراك" };
    default: return { en: "service", ar: "خدمة" };
  }
};

export function buildReminderMessage(params: {
  name: string;
  phone: string;
  amount: number;
  currency: Currency;
  dueDate: string; // YYYY-MM-DD
  type: DebtType;
  convertedText?: string; // optional conversion string
}) {
  const t = typeLabel(params.type);
  const money = fmtMoney(params.amount, params.currency);
  const conv = params.convertedText ? ` (${params.convertedText})` : "";

  const text =
`Mokhtar Cell | مختار سيل
Hi ${params.name} 👋
Your ${t.en} payment is: ${money}${conv}
Due date: ${params.dueDate}

مرحبا ${params.name} 👋
دفعتك مقابل ${t.ar} هي: ${money}${conv}
تاريخ الاستحقاق: ${params.dueDate}

Please confirm once paid 🙏
— Mokhtar Cell | 03 158 798`;

  const waPhone = normalizePhoneForWa(params.phone);
  const waLink = `https://wa.me/${waPhone}?text=${encodeURIComponent(text)}`;
  return { text, waLink };
}
