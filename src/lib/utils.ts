export type Currency = "USD" | "LBP";

export function fmtMoney(amount: number, currency: Currency) {
  if (currency === "USD") return `$${amount.toFixed(2)}`;
  return `${Math.round(amount).toLocaleString()} LBP`;
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function isToday(isoDateTime: string) {
  const d = new Date(isoDateTime);
  const t = new Date();
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
}

export function normalizePhoneForWa(phone: string) {
  // Converts Lebanese local numbers like 03xxxxxx / 70xxxxxx to international 961XXXXXXXX
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("961")) return digits;
  if (digits.length === 8 && digits.startsWith("0")) {
    return "961" + digits.slice(1);
  }
  if (digits.length === 8 && !digits.startsWith("0")) {
    // assume missing leading 0 (rare)
    return "961" + digits;
  }
  // fallback
  return digits;
}
