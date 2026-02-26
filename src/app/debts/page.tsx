"use client";

import { useEffect, useMemo, useState } from "react";
import { TopNav } from "@/components/TopNav";
import { Button, Card, Input, Select, Textarea } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { buildReminderMessage, type DebtType } from "@/lib/whatsapp";
import { fmtMoney, todayISO, type Currency } from "@/lib/utils";

type Customer = { id: string; name: string; phone: string; };
type Debt = {
  id: string;
  customer_id: string;
  type: DebtType;
  currency: Currency;
  amount: number;
  due_date: string;
  status: "PENDING" | "PAID" | "OVERDUE";
  notes: string | null;
  created_at: string;
};

export default function DebtsPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "PAID" | "OVERDUE" | "DUE_TODAY">("ALL");

  // form
  const [customerId, setCustomerId] = useState("");
  const [type, setType] = useState<DebtType>("MOBILE");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [amount, setAmount] = useState<string>("0");
  const [dueDate, setDueDate] = useState<string>(todayISO());
  const [notes, setNotes] = useState("");

  const custMap = useMemo(() => new Map(customers.map(c => [c.id, c])), [customers]);

  async function load() {
    setLoading(true);
    const c = await supabase.from("customers").select("id,name,phone").order("created_at", { ascending: false }).limit(2000);
    const d = await supabase.from("debts").select("*").order("due_date", { ascending: true }).limit(2000);
    setLoading(false);
    if (!c.error) setCustomers((c.data ?? []) as any);
    if (!d.error) setDebts((d.data ?? []) as any);
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (filter === "ALL") return debts;
    if (filter === "DUE_TODAY") return debts.filter(x => x.due_date === todayISO() && x.status !== "PAID");
    return debts.filter(x => x.status === filter);
  }, [debts, filter]);

  async function addDebt() {
    if (!customerId) return alert("Choose customer");
    const amt = Number(amount);
    if (!amt || amt <= 0) return alert("Amount must be > 0");
    const ins = await supabase.from("debts").insert({
      customer_id: customerId,
      type,
      currency,
      amount: amt,
      due_date: dueDate,
      status: "PENDING",
      notes: notes.trim() || null,
    });
    if (ins.error) return alert(ins.error.message);
    setAmount("0"); setNotes(""); setDueDate(todayISO());
    await load();
  }

  async function setStatus(id: string, status: "PENDING" | "PAID" | "OVERDUE") {
    const up = await supabase.from("debts").update({ status }).eq("id", id);
    if (up.error) return alert(up.error.message);
    await load();
  }

  function waLinkForDebt(d: Debt) {
    const c = custMap.get(d.customer_id);
    if (!c) return null;
    const { waLink } = buildReminderMessage({
      name: c.name,
      phone: c.phone,
      amount: Number(d.amount),
      currency: d.currency,
      dueDate: d.due_date,
      type: d.type,
    });
    return waLink;
  }

  return (
    <main>
      <TopNav />
      <div className="mx-auto max-w-5xl px-5 py-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-2xl font-semibold">Debts</div>
            <div className="text-white/60">Track debts + send WhatsApp reminders</div>
          </div>
          <div className="w-56">
            <Select value={filter} onChange={e => setFilter(e.target.value as any)}>
              <option value="ALL">All</option>
              <option value="DUE_TODAY">Due today</option>
              <option value="PENDING">Pending</option>
              <option value="OVERDUE">Overdue</option>
              <option value="PAID">Paid</option>
            </Select>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
          <Card title="Add debt">
            <div className="space-y-3">
              <Select value={customerId} onChange={e => setCustomerId(e.target.value)}>
                <option value="">Choose customer…</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>
                ))}
              </Select>

              <div className="grid grid-cols-2 gap-2">
                <Select value={type} onChange={e => setType(e.target.value as any)}>
                  <option value="MOBILE">Mobile/Device</option>
                  <option value="REPAIR">Repair</option>
                  <option value="TRANSFER">Transfer/Service</option>
                  <option value="SUBSCRIPTION">Subscription</option>
                  <option value="OTHER">Other</option>
                </Select>
                <Select value={currency} onChange={e => setCurrency(e.target.value as any)}>
                  <option value="USD">USD</option>
                  <option value="LBP">LBP</option>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Input type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} />
                <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
              </div>

              <Textarea placeholder="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} rows={3} />

              <div className="flex justify-end">
                <Button onClick={addDebt}>Add</Button>
              </div>
            </div>
          </Card>

          <Card title={`Debts (${filtered.length})`}>
            {loading && <div className="text-sm text-white/60">Loading…</div>}
            {!loading && filtered.length === 0 && <div className="text-sm text-white/60">No debts found.</div>}
            <div className="space-y-2">
              {filtered.map(d => {
                const c = custMap.get(d.customer_id);
                const wa = waLinkForDebt(d);
                return (
                  <div key={d.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold">{c?.name ?? "Unknown customer"}</div>
                        <div className="text-sm text-white/70">
                          {fmtMoney(Number(d.amount), d.currency)} • {d.type} • Due {d.due_date}
                        </div>
                        <div className="text-sm">
                          <span className={
                            d.status === "PAID" ? "text-emerald-400" :
                            d.status === "OVERDUE" ? "text-red-400" :
                            "text-yellow-300"
                          }>
                            {d.status}
                          </span>
                        </div>
                        {d.notes && <div className="mt-1 text-sm text-white/60">{d.notes}</div>}
                      </div>
                      <div className="flex flex-col gap-2">
                        {wa && (
                          <a href={wa} target="_blank" rel="noreferrer">
                            <Button variant="ghost" className="w-full">WhatsApp</Button>
                          </a>
                        )}
                        <Button variant="ghost" onClick={() => setStatus(d.id, "PENDING")}>Pending</Button>
                        <Button variant="ghost" onClick={() => setStatus(d.id, "OVERDUE")}>Overdue</Button>
                        <Button variant="primary" onClick={() => setStatus(d.id, "PAID")}>Paid</Button>
                      </div>
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
