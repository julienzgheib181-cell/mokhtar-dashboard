import { NextResponse } from "next/server";
type Body = { to: string; message: string };

export async function POST(req: Request) {
  const body = (await req.json()) as Body;
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    return NextResponse.json({ ok: true, skipped: true, reason: "WhatsApp not configured" });
  }

  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: body.to,
      type: "text",
      text: { body: body.message }
    })
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json({ ok: res.ok, data }, { status: res.ok ? 200 : 500 });
}
