# Mokhtar Dashboard.. (V2) 🖤💎

A lightweight web app (Next.js + Supabase) for:
- Customers..
- Debts (USD/LBP) + WhatsApp reminders (Arabic + English)
- Sales + totals (and optional auto-create Debt from a Sale)

V2 adds:
- Automatic WhatsApp reminders via Meta WhatsApp Cloud API
- Automatic push notifications to your phone via OneSignal
- Hourly cron (Vercel) to run reminders

## 1) Install
```bash
npm install
```

## 2) Configure env
Create `.env.local` and set:
```env
NEXT_PUBLIC_SUPABASE_URL=YOUR_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY

# Server-only (never expose)
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY

# Protect cron endpoint
CRON_SECRET=ANY_RANDOM_SECRET

# WhatsApp Cloud API (Meta)
WHATSAPP_TOKEN=...
WHATSAPP_PHONE_NUMBER_ID=...

# OneSignal push
NEXT_PUBLIC_ONESIGNAL_APP_ID=...
ONESIGNAL_APP_ID=...
ONESIGNAL_REST_API_KEY=...

# Deployed app URL (optional)
APP_PUBLIC_URL=https://your-app.vercel.app
```

## 3) Create tables (Supabase SQL Editor)
Paste the SQL from `supabase/schema.sql`.

If you already created V1 tables before, re-run `supabase/schema.sql` to add:
- `debts.reminder_last_sent_at`
- `debts.reminder_count`

## 4) Run
```bash
npm run dev
```
Open: http://localhost:3000

## WhatsApp
V2 supports automatic sending using **Meta WhatsApp Cloud API**.

You must configure a WhatsApp Business app, then set:
- `WHATSAPP_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`

## Security (recommended)
Enable RLS + policies in Supabase before production.
This V1 is meant as a fast internal MVP.

## Deploy (Vercel)
1) Push this folder to GitHub.
2) Import project in Vercel.
3) Add env vars in Vercel Project Settings.
4) Deploy.

Cron is configured in `vercel.json` (runs hourly) and calls:
`/api/cron/reminders` with header `x-cron-secret: CRON_SECRET`.

If you prefer daily reminders only, change the cron schedule in `vercel.json`.

— Mokhtar Cell | 03 158 798
