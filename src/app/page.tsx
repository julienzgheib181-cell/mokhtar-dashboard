"use client";

import { useEffect, useMemo, useState } from "react";
import TopNav from "@/components/TopNav";
import { Card } from "@/components/Card";
import TxForm from "@/components/TxForm";
import { getSupabase } from "@/lib/supabase";
import type { Transaction } from "@/lib/types";
import { fmtUSD } from "@/lib/money";
import { todayISO } from "@/lib/date";
import { startOfMonth, endOfMonth, format } from "date-fns";

function cashDelta(tx: Transaction) {
  const n = tx.amount;
  if (tx.type === "expense" || tx.type === "pay_debt") return -Math.abs(n);
  if (tx.type === "sale" || tx.type === "receive_debt") return Math.abs(n);
  return n;
}

export default function DashboardPage() {
  const supabase = useMemo(() => getSupabase(), []);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const today = todayISO();

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("tx_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(200);
    if (!error && data) setTxs(data as Transaction[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const cash = txs.reduce((a, t) => a + cashDelta(t), 0);

  const todayTxs = txs.filter(t => t.tx_date === today);
  const todaySales = todayTxs.filter(t => t.type === "sale").reduce((a, t) => a + Math.abs(t.amount), 0);
  const todayExpenses = todayTxs.filter(t => t.type === "expense").reduce((a, t) => a + Math.abs(t.amount), 0);

  const now = new Date();
  const mStart = format(startOfMonth(now), "yyyy-MM-dd");
  const mEnd = format(endOfMonth(now), "yyyy-MM-dd");
  const monthTxs = txs.filter(t => t.tx_date >= mStart && t.tx_date <= mEnd);
  const monthSales = monthTxs.filter(t => t.type === "sale").reduce((a, t) => a + Math.abs(t.amount), 0);
  const monthExpenses = monthTxs.filter(t => t.type === "expense").reduce((a, t) => a + Math.abs(t.amount), 0);
  const monthNet = monthTxs.reduce((a, t) => a + cashDelta(t), 0);

  return (
    <>
      <TopNav />
      <main className="mx-auto max-w-5xl px-4 py-6 grid gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card title="Cash (USD)">
            <div className="text-2xl font-semibold">{fmtUSD(cash)}</div>
            <div className="text-xs text-zinc-500">Calculated from all transactions</div>
          </Card>
          <Card title="Today">
            <div className="text-sm">Sales: <b>{fmtUSD(todaySales)}</b></div>
            <div className="text-sm">Expenses: <b>{fmtUSD(todayExpenses)}</b></div>
            <div className="text-xs text-zinc-500 mt-2">{today}</div>
          </Card>
          <Card title="This Month">
            <div className="text-sm">Sales: <b>{fmtUSD(monthSales)}</b></div>
            <div className="text-sm">Expenses: <b>{fmtUSD(monthExpenses)}</b></div>
            <div className="text-sm">Net: <b>{fmtUSD(monthNet)}</b></div>
            <div className="text-xs text-zinc-500 mt-2">{mStart} → {mEnd}</div>
          </Card>
        </div>

        <Card title="Add Transaction">
          <TxForm onSaved={load} />
        </Card>

        <Card title="Latest (Last 10)">
          {loading ? (
            <div className="text-sm text-zinc-600">Loading...</div>
          ) : (
            <div className="divide-y">
              {txs.slice(0, 10).map(t => (
                <div key={t.id} className="py-2 flex items-center justify-between gap-3">
                  <div className="text-sm">
                    <b className="uppercase">{t.type}</b> • {t.category} {t.person ? <>• <span className="text-zinc-700">{t.person}</span></> : null}
                    {t.note ? <div className="text-xs text-zinc-500">{t.note}</div> : null}
                  </div>
                  <div className="text-sm text-right">
                    <div>{fmtUSD(t.amount)}</div>
                    <div className="text-xs text-zinc-500">{t.tx_date}</div>
                  </div>
                </div>
              ))}
              {txs.length === 0 ? <div className="py-2 text-sm text-zinc-600">No data yet.</div> : null}
            </div>
          )}
        </Card>
      </main>
    </>
  );
}
