/**
 * Send a push notification via OneSignal.
 * User subscribes from phone/browser, then you can notify "Subscribed Users".
 * Requires env:
 * - ONESIGNAL_APP_ID
 * - ONESIGNAL_REST_API_KEY
 */
export async function sendPushToSubscribers(params: {
  title: string;
  message: string;
  url?: string;
}) {
  const appId = process.env.ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_REST_API_KEY;
  if (!appId || !apiKey) {
    throw new Error("Missing ONESIGNAL_APP_ID or ONESIGNAL_REST_API_KEY");
  }

  const res = await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: {
      Authorization: `Basic ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      app_id: appId,
      included_segments: ["Subscribed Users"],
      headings: { en: params.title },
      contents: { en: params.message },
      url: params.url,
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`OneSignal error (${res.status}): ${txt}`);
  }

  return res.json().catch(() => ({}));
}
