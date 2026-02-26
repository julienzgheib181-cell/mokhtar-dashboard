"use client";

import { useEffect, useMemo, useState } from "react";
import { TopNav } from "@/components/TopNav";
import { Button, Card, Input, Select, Textarea } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import type { Currency } from "@/lib/utils";

type Customer = {
  id: string;
  name: string;
  phone: string;
  notes: string | null;
  preferred_currency: Currency;
  created_at: string;
};

export default function CustomersPage() {
  const [rows, setRows] = useState<Customer[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pref, setPref] = useState<Currency>("USD");
  const [notes, setNotes] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(r =>
      r.name.toLowerCase().includes(s) ||
      r.phone.replace(/\s/g, "").includes(s)
    );
  }, [rows, q]);

  async function load() {
    setLoading(true);
    const res = await supabase
      .from("customers")
      .select("id,name,phone,notes,preferred_currency,created_at")
      .order("created_at", { ascending: false })
      .limit(1000);
    setLoading(false);
    if (!res.error) setRows((res.data ?? []) as any);
  }

  useEffect(() => { load(); }, []);

  async function addCustomer() {
    if (!name.trim() || !phone.trim()) return alert("Name + phone required");
    const ins = await supabase.from("customers").insert({
      name: name.trim(),
      phone: phone.trim(),
      preferred_currency: pref,
      notes: notes.trim() || null,
    });
    if (ins.error) return alert(ins.error.message);
    setName(""); setPhone(""); setNotes(""); setPref("USD");
    await load();
  }

  async function delCustomer(id: string) {
    if (!confirm("Delete this customer?")) return;
    const d = await supabase.from("customers").delete().eq("id", id);
    if (d.error) return alert(d.error.message);
    await load();
  }

  return (
    <main>
      <TopNav />
      <div className="mx-auto max-w-5xl px-5 py-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-2xl font-semibold">Customers</div>
            <div className="text-white/60">Add / search customers</div>
          </div>
          <div className="w-64">
            <Input placeholder="Search name or phone…" value={q} onChange={e => setQ(e.target.value)} />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
          <Card title="Add customer">
            <div className="space-y-3">
              <Input placeholder="Customer name" value={name} onChange={e => setName(e.target.value)} />
              <Input placeholder="Phone (e.g. 03 158 798)" value={phone} onChange={e => setPhone(e.target.value)} />
              <div className="grid grid-cols-2 gap-2">
                <Select value={pref} onChange={e => setPref(e.target.value as any)}>
                  <option value="USD">Preferred: USD</option>
                  <option value="LBP">Preferred: LBP</option>
                </Select>
                <Button onClick={addCustomer}>Add</Button>
              </div>
              <Textarea placeholder="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
              <div className="text-xs text-white/50">Tip: phone is used for WhatsApp reminders.</div>
            </div>
          </Card>

          <Card title={`Customers (${filtered.length})`}>
            <div className="space-y-2">
              {loading && <div className="text-sm text-white/60">Loading…</div>}
              {!loading && filtered.length === 0 && <div className="text-sm text-white/60">No customers yet.</div>}
              {filtered.map(c => (
                <div key={c.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{c.name}</div>
                      <div className="text-sm text-white/70">{c.phone} • Pref {c.preferred_currency}</div>
                      {c.notes && <div className="mt-1 text-sm text-white/60">{c.notes}</div>}
                    </div>
                    <Button variant="danger" onClick={() => delCustomer(c.id)}>Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
