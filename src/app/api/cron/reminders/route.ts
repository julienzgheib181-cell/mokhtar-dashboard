import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { buildReminderMessage, type DebtType } from "@/lib/whatsapp";
import { sendWhatsAppText } from "@/lib/whatsappApi";
import { sendPushToSubscribers } from "@/lib/push";

function assertCronAuth(req: Request) {
  // If running via Vercel Cron, Vercel adds a header we can trust.
  // (Keeps setup simple for MVP.)
  const vercelCron = req.headers.get("x-vercel-cron");
  if (vercelCron) return;

  const secret = process.env.CRON_SECRET;
  if (!secret) return; // allow if no secret set

  const url = new URL(req.url);
  const got = req.headers.get("x-cron-secret") || url.searchParams.get("secret") || "";
  if (got !== secret) throw new Error("Unauthorized");
}

function isoDate(d = new Date()) {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export async function GET(req: Request) {
  try {
    assertCronAuth(req);

    const today = isoDate(new Date());

    // 1) Mark overdue (due_date < today and still pending)
    await supabaseAdmin
      .from("debts")
      .update({ status: "OVERDUE" })
      .eq("status", "PENDING")
      .lt("due_date", today);

    // 2) Fetch due today + overdue (not paid) that we haven't reminded today
    const startOfTodayUtc = new Date();
    startOfTodayUtc.setUTCHours(0, 0, 0, 0);
    const startIso = startOfTodayUtc.toISOString();

    const { data, error } = await supabaseAdmin
      .from("debts")
      .select(
        "id,customer_id,type,currency,amount,due_date,status,notes,reminder_last_sent_at,reminder_count,customers(name,phone)"
      )
      .in("status", ["PENDING", "OVERDUE"])
      .lte("due_date", today)
      .or(`reminder_last_sent_at.is.null,reminder_last_sent_at.lt.${startIso}`)
      .order("due_date", { ascending: true })
      .limit(200);

    if (error) throw error;

    const debts = (data ?? []) as any[];
    let sent = 0;
    const failures: { id: string; err: string }[] = [];

    for (const d of debts) {
      const cust = d.customers;
      if (!cust?.phone) continue;

      const msg = buildReminderMessage({
        name: cust.name || "Customer",
        phone: cust.phone,
        amount: Number(d.amount || 0),
        currency: d.currency,
        dueDate: d.due_date,
        type: (d.type || "OTHER") as DebtType,
      });

      try {
        // WhatsApp
        await sendWhatsAppText({ toPhone: cust.phone, body: msg.text });

        // Push notification (to subscribed devices)
        await sendPushToSubscribers({
          title: "Mokhtar Dashboard — Reminder sent",
          message: `WhatsApp reminder sent to ${cust.name} (${d.currency} ${d.amount})`,
          url: process.env.APP_PUBLIC_URL || undefined,
        });

        // Update reminder tracking
        await supabaseAdmin
          .from("debts")
          .update({
            reminder_last_sent_at: new Date().toISOString(),
            reminder_count: Number(d.reminder_count || 0) + 1,
          })
          .eq("id", d.id);

        sent += 1;
      } catch (e: any) {
        failures.push({ id: d.id, err: String(e?.message || e) });
      }
    }

    return NextResponse.json({ ok: true, today, found: debts.length, sent, failures });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: String(e?.message || e) },
      { status: 401 }
    );
  }
}
