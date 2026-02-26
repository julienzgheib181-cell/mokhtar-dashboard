"use client";

import { useEffect, useMemo, useState } from "react";
import { TopNav } from "@/components/TopNav";
import { Button, Card, Input, Select } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { fmtMoney, isToday, todayISO, type Currency } from "@/lib/utils";
import type { DebtType } from "@/lib/whatsapp";

type Customer = { id: string; name: string; phone: string; };
type Sale = {
  id: string;
  item_name: string;
  currency: Currency;
  total_amount: number;
  paid_amount: number;
  payment_type: "CASH" | "DEBT";
  customer_id: string | null;
  debt_id: string | null;
  created_at: string;
};

export default function SalesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);

  // form
  const [itemName, setItemName] = useState("");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [totalAmount, setTotalAmount] = useState("0");
  const [paidAmount, setPaidAmount] = useState("0");
  const [paymentType, setPaymentType] = useState<"CASH" | "DEBT">("CASH");

  const [customerId, setCustomerId] = useState<string>(""); // required if DEBT
  const [debtType, setDebtType] = useState<DebtType>("MOBILE");
  const [dueDate, setDueDate] = useState<string>(todayISO());

  const custMap = useMemo(() => new Map(customers.map(c => [c.id, c])), [customers]);

  async function load() {
    setLoading(true);
    const c = await supabase.from("customers").select("id,name,phone").order("created_at", { ascending: false }).limit(2000);
    const s = await supabase.from("sales").select("*").order("created_at", { ascending: false }).limit(2000);
    setLoading(false);
    if (!c.error) setCustomers((c.data ?? []) as any);
    if (!s.error) setSales((s.data ?? []) as any);
  }

  useEffect(() => { load(); }, []);

  const totals = useMemo(() => {
    const sum = (arr: Sale[], pick: (x: Sale) => number) =>
      arr.reduce((acc, x) => { acc[x.currency] += pick(x); return acc; }, { USD: 0, LBP: 0 });

    const today = sales.filter(s => isToday(s.created_at));
    const cashToday = today.filter(s => s.payment_type === "CASH");
    const debtToday = today.filter(s => s.payment_type === "DEBT");

    return {
      todayCash: sum(cashToday, x => Number(x.paid_amount)),
      todayDebt: sum(debtToday, x => Math.max(0, Number(x.total_amount) - Number(x.paid_amount))),
      todayTotal: sum(today, x => Number(x.total_amount)),
    };
  }, [sales]);

  async function addSale() {
    if (!itemName.trim()) return alert("Item name required");
    const total = Number(totalAmount);
    const paid = Number(paidAmount);
    if (!total || total <= 0) return alert("Total amount must be > 0");
    if (paid < 0) return alert("Paid amount must be >= 0");
    if (paid > total) return alert("Paid can’t be more than total");

    let cid: string | null = null;
    if (paymentType === "DEBT") {
      if (!customerId) return alert("Choose customer for a debt sale");
      cid = customerId;
    }

    // 1) create sale
    const saleIns = await supabase.from("sales").insert({
      item_name: itemName.trim(),
      currency,
      total_amount: total,
      paid_amount: paid,
      payment_type: paymentType,
      customer_id: cid,
    }).select("*").single();

    if (saleIns.error) return alert(saleIns.error.message);

    const sale = saleIns.data as Sale;

    // 2) if DEBT, create linked debt for the remaining
    if (paymentType === "DEBT") {
      const remaining = Math.max(0, total - paid);
      const debtIns = await supabase.from("debts").insert({
        customer_id: customerId,
        type: debtType,
        currency,
        amount: remaining,
        due_date: dueDate,
        status: "PENDING",
        notes: `Auto from sale: ${itemName.trim()}`,
      }).select("id").single();

      if (debtIns.error) return alert("Sale created but debt failed: " + debtIns.error.message);

      const debtId = (debtIns.data as any).id as string;

      const link = await supabase.from("sales").update({ debt_id: debtId }).eq("id", sale.id);
      if (link.error) return alert("Debt created but linking failed: " + link.error.message);
    }

    // reset
    setItemName("");
    setTotalAmount("0");
    setPaidAmount("0");
    setPaymentType("CASH");
    setCustomerId("");
    setDebtType("MOBILE");
    setDueDate(todayISO());

    await load();
  }

  return (
    <main>
      <TopNav />
      <div className="mx-auto max-w-5xl px-5 py-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-2xl font-semibold">Sales</div>
            <div className="text-white/60">Log sales + totals + optional debt link</div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
          <Card title="Add sale">
            <div className="space-y-3">
              <Input placeholder="Item (e.g. iPhone 11, OSN 1 Month…)" value={itemName} onChange={e => setItemName(e.target.value)} />

              <div className="grid grid-cols-2 gap-2">
                <Select value={currency} onChange={e => setCurrency(e.target.value as any)}>
                  <option value="USD">USD</option>
                  <option value="LBP">LBP</option>
                </Select>
                <Select value={paymentType} onChange={e => setPaymentType(e.target.value as any)}>
                  <option value="CASH">Cash</option>
                  <option value="DEBT">Debt</option>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Input type="number" min="0" step="0.01" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} />
                <Input type="number" min="0" step="0.01" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} />
              </div>

              {paymentType === "DEBT" && (
                <div className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="text-sm text-white/70">Debt settings (auto-create remaining)</div>
                  <Select value={customerId} onChange={e => setCustomerId(e.target.value)}>
                    <option value="">Choose customer…</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>)}
                  </Select>
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={debtType} onChange={e => setDebtType(e.target.value as any)}>
                      <option value="MOBILE">Mobile/Device</option>
                      <option value="REPAIR">Repair</option>
                      <option value="TRANSFER">Transfer/Service</option>
                      <option value="SUBSCRIPTION">Subscription</option>
                      <option value="OTHER">Other</option>
                    </Select>
                    <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                  </div>
                  <div className="text-xs text-white/50">
                    Remaining = total - paid → saved as a Debt automatically.
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={addSale}>Add</Button>
              </div>
            </div>
          </Card>

          <Card title="Totals (today)">
            <div className="space-y-2">
              <div className="text-sm text-white/60">Today total sales</div>
              <div className="flex justify-between"><span>USD</span><span className="font-semibold">{fmtMoney(totals.todayTotal.USD, "USD")}</span></div>
              <div className="flex justify-between"><span>LBP</span><span className="font-semibold">{fmtMoney(totals.todayTotal.LBP, "LBP")}</span></div>

              <div className="mt-3 text-sm text-white/60">Today cash received</div>
              <div className="flex justify-between"><span>USD</span><span className="font-semibold">{fmtMoney(totals.todayCash.USD, "USD")}</span></div>
              <div className="flex justify-between"><span>LBP</span><span className="font-semibold">{fmtMoney(totals.todayCash.LBP, "LBP")}</span></div>

              <div className="mt-3 text-sm text-white/60">Today debts created</div>
              <div className="flex justify-between"><span>USD</span><span className="font-semibold">{fmtMoney(totals.todayDebt.USD, "USD")}</span></div>
              <div className="flex justify-between"><span>LBP</span><span className="font-semibold">{fmtMoney(totals.todayDebt.LBP, "LBP")}</span></div>
            </div>
          </Card>
        </div>

        <div className="mt-5">
          <Card title={`Sales (${sales.length})`}>
            {loading && <div className="text-sm text-white/60">Loading…</div>}
            {!loading && sales.length === 0 && <div className="text-sm text-white/60">No sales yet.</div>}
            <div className="space-y-2">
              {sales.map(s => {
                const c = s.customer_id ? custMap.get(s.customer_id) : null;
                const remaining = Math.max(0, Number(s.total_amount) - Number(s.paid_amount));
                return (
                  <div key={s.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold">{s.item_name}</div>
                        <div className="text-sm text-white/70">
                          Total: {fmtMoney(Number(s.total_amount), s.currency)} • Paid: {fmtMoney(Number(s.paid_amount), s.currency)}
                          {s.payment_type === "DEBT" && <> • Remaining: {fmtMoney(remaining, s.currency)}</>}
                        </div>
                        <div className="text-sm text-white/60">
                          {s.payment_type}{c ? ` • ${c.name}` : ""}{s.debt_id ? " • Linked debt ✅" : ""}
                        </div>
                      </div>
                      <div className="text-xs text-white/50">{new Date(s.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
