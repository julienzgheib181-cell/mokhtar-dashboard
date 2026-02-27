"use client";

import { useEffect, useMemo, useState } from "react";
import TopNav from "@/components/TopNav";
import { Card } from "@/components/Card";
import { getSupabase } from "@/lib/supabase";
import type { Transaction, TxType, TxCategory } from "@/lib/types";
import { fmtUSD } from "@/lib/money";
import { todayISO } from "@/lib/date";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { Button } from "@/components/Button";

const typeOptions = [
  { value: "", label: "All types" },
  { value: "sale", label: "Sale" },
  { value: "expense", label: "Expense" },
  { value: "pay_debt", label: "Pay debt" },
  { value: "receive_debt", label: "Receive debt" },
  { value: "adjust", label: "Adjust" }
];

const catOptions = [
  { value: "", label: "All categories" },
  { value: "phones", label: "Phones" },
  { value: "transfer", label: "Transfer" },
  { value: "repair", label: "Repair" },
  { value: "service", label: "Service" },
  { value: "accessories", label: "Accessories" },
  { value: "subscription", label: "Subscription" },
  { value: "other", label: "Other" }
];

export default function TransactionsPage() {
  const supabase = useMemo(() => getSupabase(), []);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [from, setFrom] = useState(() => todayISO());
  const [to, setTo] = useState(() => todayISO());
  const [type, setType] = useState<string>("");
  const [category, setCategory] = useState<string>("");

  async function load() {
    setLoading(true);
    let q = supabase.from("transactions").select("*");

    if (from) q = q.gte("tx_date", from);
    if (to) q = q.lte("tx_date", to);
    if (type) q = q.eq("type", type as TxType);
    if (category) q = q.eq("category", category as TxCategory);

    const { data, error } = await q.order("tx_date", { ascending: false }).order("created_at", { ascending: false }).limit(500);
    if (!error && data) setTxs(data as Transaction[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const total = txs.reduce((a, t) => a + t.amount, 0);

  async function remove(id: string) {
    if (!confirm("Delete this transaction?")) return;
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (!error) load();
  }

  return (
    <>
      <TopNav />
      <main className="mx-auto max-w-5xl px-4 py-6 grid gap-4">
        <Card title="Filters">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
            <div>
              <div className="text-xs text-zinc-600 mb-1">From</div>
              <Input type="date" value={from} onChange={e => setFrom(e.target.value)} />
            </div>
            <div>
              <div className="text-xs text-zinc-600 mb-1">To</div>
              <Input type="date" value={to} onChange={e => setTo(e.target.value)} />
            </div>
            <div>
              <div className="text-xs text-zinc-600 mb-1">Type</div>
              <Select value={type} onChange={e => setType(e.target.value)}>
                {typeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </div>
            <div>
              <div className="text-xs text-zinc-600 mb-1">Category</div>
              <Select value={category} onChange={e => setCategory(e.target.value)}>
                {catOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </div>
            <Button onClick={load} type="button">Apply</Button>
          </div>
          <div className="text-xs text-zinc-500 mt-2">Total (simple sum): {fmtUSD(total)}</div>
        </Card>

        <Card title="Transactions">
          {loading ? (
            <div className="text-sm text-zinc-600">Loading...</div>
          ) : (
            <div className="divide-y">
              {txs.map(t => (
                <div key={t.id} className="py-2 flex items-center justify-between gap-3">
                  <div className="text-sm">
                    <b className="uppercase">{t.type}</b> • {t.category}
                    {t.person ? <> • <span className="text-zinc-700">{t.person}</span></> : null}
                    {t.note ? <div className="text-xs text-zinc-500">{t.note}</div> : null}
                    <div className="text-xs text-zinc-500">{t.tx_date}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">{fmtUSD(t.amount)}</div>
                    <button className="text-xs text-red-600 hover:underline" onClick={() => remove(t.id)}>Delete</button>
                  </div>
                </div>
              ))}
              {txs.length === 0 ? <div className="py-2 text-sm text-zinc-600">No results.</div> : null}
            </div>
          )}
        </Card>
      </main>
    </>
  );
}
