import { normalizePhoneForWa } from "./utils";

/**
 * Send a WhatsApp text message using Meta WhatsApp Cloud API.
 * Requires env:
 * - WHATSAPP_TOKEN
 * - WHATSAPP_PHONE_NUMBER_ID
 */
export async function sendWhatsAppText(params: {
  toPhone: string;
  body: string;
}) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    throw new Error("Missing WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID");
  }

  const to = normalizePhoneForWa(params.toPhone);
  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: params.body },
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`WhatsApp API error (${res.status}): ${txt}`);
  }

  return res.json().catch(() => ({}));
}
