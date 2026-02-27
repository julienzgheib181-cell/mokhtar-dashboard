"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Dashboard" },
  { href: "/transactions", label: "Transactions" },
  { href: "/debts", label: "Debts" },
  { href: "/reports", label: "Reports" }
];

export default function TopNav() {
  const path = usePathname();
  return (
    <div className="border-b bg-white">
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
        <div className="font-semibold">Mokhtar Dashboard</div>
        <div className="flex gap-2">
          {tabs.map(t => {
            const active = path === t.href;
            return (
              <Link
                key={t.href}
                href={t.href}
                className={
                  "rounded px-3 py-1 text-sm " +
                  (active ? "bg-zinc-900 text-white" : "hover:bg-zinc-100")
                }
              >
                {t.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
