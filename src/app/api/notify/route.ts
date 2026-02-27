import { NextResponse } from "next/server";
type Body = { title: string; message: string };

export async function POST(req: Request) {
  const body = (await req.json()) as Body;
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  const restKey = process.env.ONESIGNAL_REST_API_KEY;

  if (!appId || !restKey) {
    return NextResponse.json({ ok: true, skipped: true, reason: "OneSignal not configured" });
  }

  const res = await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Basic ${restKey}` },
    body: JSON.stringify({
      app_id: appId,
      included_segments: ["Subscribed Users"],
      headings: { en: body.title },
      contents: { en: body.message }
    })
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json({ ok: res.ok, data }, { status: res.ok ? 200 : 500 });
}
