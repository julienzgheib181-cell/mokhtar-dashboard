"use client";

import { useMemo, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import type { TxCategory, TxType } from "@/lib/types";
import { todayISO } from "@/lib/date";
import { Button } from "./Button";
import { Input } from "./Input";
import { Select } from "./Select";

const typeOptions: { value: TxType; label: string }[] = [
  { value: "sale", label: "Sale (+ cash)" },
  { value: "expense", label: "Expense (- cash)" },
  { value: "pay_debt", label: "Pay debt (- cash)" },
  { value: "receive_debt", label: "Receive debt (+ cash)" },
  { value: "adjust", label: "Adjust cash (+/-)" }
];

const catOptions: { value: TxCategory; label: string }[] = [
  { value: "phones", label: "Phones" },
  { value: "transfer", label: "Transfer" },
  { value: "repair", label: "Repair" },
  { value: "service", label: "Service" },
  { value: "accessories", label: "Accessories" },
  { value: "subscription", label: "Subscription" },
  { value: "other", label: "Other" }
];

export default function TxForm({ onSaved }: { onSaved?: () => void }) {
  const supabase = useMemo(() => getSupabase(), []);
  const [tx_date, setDate] = useState(todayISO());
  const [type, setType] = useState<TxType>("sale");
  const [category, setCategory] = useState<TxCategory>("phones");
  const [amount, setAmount] = useState<string>("");
  const [person, setPerson] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");

  async function notifyAll(title: string, message: string) {
    await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, message })
    }).catch(() => {});
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const n = Number(amount);
    if (!Number.isFinite(n) || n === 0) {
      setMsg("Please enter a valid amount (not zero).");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("transactions").insert({
        tx_date,
        type,
        category,
        amount: n,
        person: person.trim() ? person.trim() : null,
        note: note.trim() ? note.trim() : null
      });
      if (error) throw error;

      const sign = type === "expense" || type === "pay_debt" ? "-" : "+";
      await notifyAll("New transaction", `${type} ${sign}$${Math.abs(n)} • ${category}${person ? " • " + person : ""}`);

      setAmount(""); setPerson(""); setNote("");
      setMsg("Saved ✅");
      onSaved?.();
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Error saving transaction");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-zinc-600 mb-1">Date</div>
          <Input type="date" value={tx_date} onChange={e => setDate(e.target.value)} />
        </div>
        <div>
          <div className="text-xs text-zinc-600 mb-1">Type</div>
          <Select value={type} onChange={e => setType(e.target.value as TxType)}>
            {typeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </div>
        <div>
          <div className="text-xs text-zinc-600 mb-1">Category</div>
          <Select value={category} onChange={e => setCategory(e.target.value as TxCategory)}>
            {catOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </div>
        <div>
          <div className="text-xs text-zinc-600 mb-1">Amount (USD)</div>
          <Input inputMode="decimal" placeholder="e.g. 25" value={amount} onChange={e => setAmount(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <div className="text-xs text-zinc-600 mb-1">Person (optional)</div>
          <Input placeholder="Customer / Supplier name" value={person} onChange={e => setPerson(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <div className="text-xs text-zinc-600 mb-1">Note (optional)</div>
          <Input placeholder="Any note..." value={note} onChange={e => setNote(e.target.value)} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
        {msg ? <div className="text-sm text-zinc-700">{msg}</div> : null}
      </div>

      <div className="text-xs text-zinc-500">
        Rule: Sale/Receive = add to cash. Expense/Pay debt = subtract cash. Adjust can be + or -.
      </div>
    </form>
  );
}
