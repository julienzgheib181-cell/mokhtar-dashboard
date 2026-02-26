"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Dashboard" },
  { href: "/customers", label: "Customers" },
  { href: "/debts", label: "Debts" },
  { href: "/sales", label: "Sales" },
];

export function TopNav() {
  const pathname = usePathname();

  const enableNotifications = async () => {
    // OneSignal v16 (loaded in RootLayout when NEXT_PUBLIC_ONESIGNAL_APP_ID is set)
    const w = window as any;
    if (!w.OneSignalDeferred) {
      alert("Notifications are not configured yet.");
      return;
    }
    w.OneSignalDeferred.push(async function (OneSignal: any) {
      try {
        await OneSignal.Notifications.requestPermission();
        alert("Notifications enabled ✅");
      } catch {
        alert("Notification permission blocked. Please allow notifications in browser settings.");
      }
    });
  };

  return (
    <div className="sticky top-0 z-20 border-b border-white/10 bg-black/50 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-3">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-2xl border border-white/10 bg-white/5" />
          <div>
            <div className="text-sm font-semibold">Mokhtar Dashboard</div>
            <div className="text-xs text-white/60">Mokhtar Cell • V2</div>
          </div>
        </div>

        <nav className="flex items-center gap-1">
          {tabs.map(t => {
            const active = pathname === t.href;
            return (
              <Link
                key={t.href}
                href={t.href}
                className={[
                  "rounded-xl px-3 py-2 text-sm transition",
                  active ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
                ].join(" ")}
              >
                {t.label}
              </Link>
            );
          })}

          <button
            onClick={enableNotifications}
            className="ml-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
            title="Enable push notifications"
          >
            Notifications
          </button>
        </nav>
      </div>
    </div>
  );
}
