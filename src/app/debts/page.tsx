"use client";

import { useEffect, useMemo, useState } from "react";
import TopNav from "@/components/TopNav";
import { Card } from "@/components/Card";
import { getSupabase } from "@/lib/supabase";
import type { Debt } from "@/lib/types";
import { fmtUSD } from "@/lib/money";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";

export default function DebtsPage() {
  const supabase = useMemo(() => getSupabase(), []);
  const [rows, setRows] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);

  const [direction, setDirection] = useState<Debt["direction"]>("owed_to_me");
  const [person, setPerson] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("debts")
      .select("*")
      .order("status", { ascending: true })
      .order("updated_at", { ascending: false })
      .limit(300);
    if (!error && data) setRows(data as Debt[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const owedToMe = rows.filter(r => r.direction === "owed_to_me" && r.status === "open").reduce((a, r) => a + r.amount, 0);
  const owedByMe = rows.filter(r => r.direction === "owed_by_me" && r.status === "open").reduce((a, r) => a + r.amount, 0);

  async function add() {
    setMsg("");
    const n = Number(amount);
    if (!person.trim() || !Number.isFinite(n) || n <= 0) {
      setMsg("Enter person and positive amount.");
      return;
    }
    const { error } = await supabase.from("debts").insert({
      direction,
      person: person.trim(),
      amount: n,
      note: note.trim() ? note.trim() : null,
      status: "open"
    });
    if (error) setMsg(error.message);
    else {
      setPerson(""); setAmount(""); setNote("");
      setMsg("Saved ✅");
      load();
    }
  }

  async function markPaid(id: string) {
    const { error } = await supabase.from("debts").update({ status: "paid", updated_at: new Date().toISOString() }).eq("id", id);
    if (!error) load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this debt?")) return;
    const { error } = await supabase.from("debts").delete().eq("id", id);
    if (!error) load();
  }

  return (
    <>
      <TopNav />
      <main className="mx-auto max-w-5xl px-4 py-6 grid gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card title="Open debts (owed to me)">
            <div className="text-2xl font-semibold">{fmtUSD(owedToMe)}</div>
          </Card>
          <Card title="Open debts (I owe)">
            <div className="text-2xl font-semibold">{fmtUSD(owedByMe)}</div>
          </Card>
        </div>

        <Card title="Add Debt">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div>
              <div className="text-xs text-zinc-600 mb-1">Direction</div>
              <Select value={direction} onChange={e => setDirection(e.target.value as Debt["direction"])}>
                <option value="owed_to_me">Customer owes me</option>
                <option value="owed_by_me">I owe supplier</option>
              </Select>
            </div>
            <div>
              <div className="text-xs text-zinc-600 mb-1">Person</div>
              <Input value={person} onChange={e => setPerson(e.target.value)} />
            </div>
            <div>
              <div className="text-xs text-zinc-600 mb-1">Amount (USD)</div>
              <Input inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} />
            </div>
            <Button type="button" onClick={add}>Save</Button>
            <div className="sm:col-span-4">
              <div className="text-xs text-zinc-600 mb-1">Note (optional)</div>
              <Input value={note} onChange={e => setNote(e.target.value)} />
              {msg ? <div className="text-sm text-zinc-700 mt-2">{msg}</div> : null}
            </div>
          </div>
        </Card>

        <Card title="List">
          {loading ? <div className="text-sm text-zinc-600">Loading...</div> : (
            <div className="divide-y">
              {rows.map(r => (
                <div key={r.id} className="py-2 flex items-center justify-between gap-3">
                  <div className="text-sm">
                    <b>{r.person}</b> • {r.direction === "owed_to_me" ? "owes me" : "I owe"} • {r.status}
                    {r.note ? <div className="text-xs text-zinc-500">{r.note}</div> : null}
                  </div>
                  <div className="text-right">
                    <div className="text-sm">{fmtUSD(r.amount)}</div>
                    <div className="flex gap-2 justify-end">
                      {r.status === "open" ? <button className="text-xs text-green-700 hover:underline" onClick={() => markPaid(r.id)}>Mark paid</button> : null}
                      <button className="text-xs text-red-600 hover:underline" onClick={() => remove(r.id)}>Delete</button>
                    </div>
                  </div>
                </div>
              ))}
              {rows.length === 0 ? <div className="py-2 text-sm text-zinc-600">No debts.</div> : null}
            </div>
          )}
        </Card>
      </main>
    </>
  );
}
