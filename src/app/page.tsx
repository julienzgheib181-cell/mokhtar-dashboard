"use client";

import { useEffect, useMemo, useState } from "react";
import { TopNav } from "@/components/TopNav";
import { Card, StatLine } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { isToday, todayISO, fmtMoney, type Currency } from "@/lib/utils";

type Sale = {
  currency: Currency;
  total_amount: number;
  paid_amount: number;
  payment_type: "CASH" | "DEBT";
  created_at: string;
};

type Debt = {
  status: "PENDING" | "PAID" | "OVERDUE";
  due_date: string;
  currency: Currency;
  amount: number;
};

export default function Home() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);

  useEffect(() => {
    (async () => {
      const s = await supabase
        .from("sales")
        .select("currency,total_amount,paid_amount,payment_type,created_at")
        .order("created_at", { ascending: false })
        .limit(500);

      const d = await supabase
        .from("debts")
        .select("status,due_date,currency,amount")
        .order("due_date", { ascending: true })
        .limit(500);

      if (!s.error) setSales((s.data ?? []) as any);
      if (!d.error) setDebts((d.data ?? []) as any);
    })();
  }, []);

  const metrics = useMemo(() => {
    const sumByCurrency = (arr: { currency: Currency; value: number }[]) =>
      arr.reduce((acc, x) => {
        acc[x.currency] += Number(x.value || 0);
        return acc;
      }, { USD: 0, LBP: 0 });

    const todaySales = sales.filter(x => isToday(x.created_at));
    const cashToday = todaySales.filter(x => x.payment_type === "CASH");
    const debtToday = todaySales.filter(x => x.payment_type === "DEBT");

    const cashTotals = sumByCurrency(cashToday.map(x => ({ currency: x.currency, value: x.paid_amount })));
    const debtCreatedTotals = sumByCurrency(debtToday.map(x => ({ currency: x.currency, value: x.total_amount - x.paid_amount })));

    const pending = debts.filter(x => x.status === "PENDING");
    const overdue = debts.filter(x => x.status === "OVERDUE");
    const dueToday = debts.filter(x => x.due_date === todayISO() && x.status !== "PAID");

    const pendingTotals = sumByCurrency(pending.map(x => ({ currency: x.currency, value: x.amount })));
    const overdueTotals = sumByCurrency(overdue.map(x => ({ currency: x.currency, value: x.amount })));
    const dueTodayTotals = sumByCurrency(dueToday.map(x => ({ currency: x.currency, value: x.amount })));

    return { cashTotals, debtCreatedTotals, pendingTotals, overdueTotals, dueTodayTotals };
  }, [sales, debts]);

  return (
    <main>
      <TopNav />
      <div className="mx-auto max-w-5xl px-5 py-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-2xl font-semibold">Mokhtar Dashboard</div>
            <div className="text-white/60">Sales + Debts overview (USD / LBP)</div>
          </div>
          <div className="text-sm text-white/60">Black luxury UI 🖤</div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          <Card title="Cash Today">
            <div className="space-y-2">
              <StatLine label="USD" value={fmtMoney(metrics.cashTotals.USD, "USD")} />
              <StatLine label="LBP" value={fmtMoney(metrics.cashTotals.LBP, "LBP")} />
            </div>
          </Card>

          <Card title="Debts Created Today (from Sales)">
            <div className="space-y-2">
              <StatLine label="USD" value={fmtMoney(metrics.debtCreatedTotals.USD, "USD")} />
              <StatLine label="LBP" value={fmtMoney(metrics.debtCreatedTotals.LBP, "LBP")} />
            </div>
          </Card>

          <Card title="Due Today">
            <div className="space-y-2">
              <StatLine label="USD" value={fmtMoney(metrics.dueTodayTotals.USD, "USD")} />
              <StatLine label="LBP" value={fmtMoney(metrics.dueTodayTotals.LBP, "LBP")} />
            </div>
          </Card>

          <Card title="Pending Debts">
            <div className="space-y-2">
              <StatLine label="USD" value={fmtMoney(metrics.pendingTotals.USD, "USD")} />
              <StatLine label="LBP" value={fmtMoney(metrics.pendingTotals.LBP, "LBP")} />
            </div>
          </Card>

          <Card title="Overdue Debts">
            <div className="space-y-2">
              <StatLine label="USD" value={fmtMoney(metrics.overdueTotals.USD, "USD")} />
              <StatLine label="LBP" value={fmtMoney(metrics.overdueTotals.LBP, "LBP")} />
            </div>
          </Card>

          <Card title="Next (easy upgrades)">
            <div className="text-sm text-white/70 space-y-1">
              <div>• Add WhatsApp auto sending via API (Meta/Twilio)</div>
              <div>• Add push notifications</div>
              <div>• Add export PDF/Excel</div>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
