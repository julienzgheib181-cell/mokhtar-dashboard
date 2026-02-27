"use client";

import { useEffect, useMemo, useState } from "react";
import TopNav from "@/components/TopNav";
import { Card } from "@/components/Card";
import { getSupabase } from "@/lib/supabase";
import type { Transaction, TxCategory } from "@/lib/types";
import { fmtUSD } from "@/lib/money";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";

type Row = { category: TxCategory; sales: number; expenses: number; net: number };

function cashDelta(tx: Transaction) {
  const n = tx.amount;
  if (tx.type === "expense" || tx.type === "pay_debt") return -Math.abs(n);
  if (tx.type === "sale" || tx.type === "receive_debt") return Math.abs(n);
  return n;
}

export default function ReportsPage() {
  const supabase = useMemo(() => getSupabase(), []);
  const now = new Date();
  const [from, setFrom] = useState(() => format(startOfMonth(now), "yyyy-MM-dd"));
  const [to, setTo] = useState(() => format(endOfMonth(now), "yyyy-MM-dd"));
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .gte("tx_date", from)
      .lte("tx_date", to)
      .order("tx_date", { ascending: false });

    if (!error && data) setTxs(data as Transaction[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const byCat = useMemo(() => {
    const map = new Map<TxCategory, Row>();
    for (const t of txs) {
      const row = map.get(t.category) ?? { category: t.category, sales: 0, expenses: 0, net: 0 };
      if (t.type === "sale") row.sales += Math.abs(t.amount);
      if (t.type === "expense") row.expenses += Math.abs(t.amount);
      row.net += cashDelta(t);
      map.set(t.category, row);
    }
    return Array.from(map.values()).sort((a, b) => b.net - a.net);
  }, [txs]);

  const totalSales = txs.filter(t => t.type === "sale").reduce((a, t) => a + Math.abs(t.amount), 0);
  const totalExpenses = txs.filter(t => t.type === "expense").reduce((a, t) => a + Math.abs(t.amount), 0);
  const net = txs.reduce((a, t) => a + cashDelta(t), 0);

  return (
    <>
      <TopNav />
      <main className="mx-auto max-w-5xl px-4 py-6 grid gap-4">
        <Card title="Date Range">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div>
              <div className="text-xs text-zinc-600 mb-1">From</div>
              <Input type="date" value={from} onChange={e => setFrom(e.target.value)} />
            </div>
            <div>
              <div className="text-xs text-zinc-600 mb-1">To</div>
              <Input type="date" value={to} onChange={e => setTo(e.target.value)} />
            </div>
            <Button type="button" onClick={load}>Refresh</Button>
          </div>
          <div className="text-sm mt-3">
            Sales: <b>{fmtUSD(totalSales)}</b> • Expenses: <b>{fmtUSD(totalExpenses)}</b> • Net: <b>{fmtUSD(net)}</b>
          </div>
        </Card>

        <Card title="By Category">
          {loading ? <div className="text-sm text-zinc-600">Loading...</div> : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-zinc-600">
                    <th className="py-2 pr-4">Category</th>
                    <th className="py-2 pr-4">Sales</th>
                    <th className="py-2 pr-4">Expenses</th>
                    <th className="py-2 pr-4">Net</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {byCat.map(r => (
                    <tr key={r.category}>
                      <td className="py-2 pr-4">{r.category}</td>
                      <td className="py-2 pr-4">{fmtUSD(r.sales)}</td>
                      <td className="py-2 pr-4">{fmtUSD(r.expenses)}</td>
                      <td className="py-2 pr-4"><b>{fmtUSD(r.net)}</b></td>
                    </tr>
                  ))}
                  {byCat.length === 0 ? <tr><td className="py-2 text-zinc-600" colSpan={4}>No data.</td></tr> : null}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>
    </>
  );
}
