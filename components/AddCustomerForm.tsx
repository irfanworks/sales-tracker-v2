"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2, Plus, UserPlus, Trash2 } from "lucide-react";
import { SECTOR_OPTIONS } from "@/lib/types/database";

interface PicRow {
  nama: string;
  email: string;
  no_hp: string;
  jabatan: string;
}

const emptyPic = (): PicRow => ({ nama: "", email: "", no_hp: "", jabatan: "" });

export function AddCustomerForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [sector, setSector] = useState<string>("");
  const [pics, setPics] = useState<PicRow[]>([emptyPic()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addPic() {
    setPics((prev) => [...prev, emptyPic()]);
  }

  function removePic(i: number) {
    setPics((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updatePic(i: number, field: keyof PicRow, value: string) {
    setPics((prev) => prev.map((p, idx) => (idx === i ? { ...p, [field]: value } : p)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { data: customer, error: insertError } = await supabase
      .from("customers")
      .insert({
        name: name.trim(),
        sector: sector || null,
      })
      .select("id")
      .single();
    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }
    const picsToInsert = pics.filter(
      (p) => p.nama.trim() || p.email.trim() || p.no_hp.trim() || p.jabatan.trim()
    );
    if (picsToInsert.length > 0 && customer?.id) {
      await supabase.from("customer_pics").insert(
        picsToInsert.map((p) => ({
          customer_id: customer.id,
          nama: p.nama.trim() || null,
          email: p.email.trim() || null,
          no_hp: p.no_hp.trim() || null,
          jabatan: p.jabatan.trim() || null,
        }))
      );
    }
    setName("");
    setSector("");
    setPics([emptyPic()]);
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="customer-name" className="mb-1 block text-sm font-medium text-slate-700">
            Customer name *
          </label>
          <input
            id="customer-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
            placeholder="e.g. Acme Corp"
            required
          />
        </div>
        <div>
          <label htmlFor="customer-sector" className="mb-1 block text-sm font-medium text-slate-700">
            Sector
          </label>
          <select
            id="customer-sector"
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className="input-field"
          >
            <option value="">— Select —</option>
            {SECTOR_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium text-slate-700">PIC (optional, bisa lebih dari 1)</label>
          <button
            type="button"
            onClick={addPic}
            className="inline-flex items-center gap-1 rounded px-2 py-1 text-sm text-cyan-700 hover:bg-cyan-50"
          >
            <UserPlus className="h-4 w-4" />
            Add PIC
          </button>
        </div>
        <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50/50 p-4">
          {pics.map((pic, i) => (
            <div key={i} className="grid gap-3 rounded border border-slate-100 bg-white p-3 sm:grid-cols-2 lg:grid-cols-4">
              <input
                type="text"
                value={pic.nama}
                onChange={(e) => updatePic(i, "nama", e.target.value)}
                className="input-field"
                placeholder="PIC Name"
              />
              <input
                type="email"
                value={pic.email}
                onChange={(e) => updatePic(i, "email", e.target.value)}
                className="input-field"
                placeholder="Email"
              />
              <input
                type="text"
                value={pic.no_hp}
                onChange={(e) => updatePic(i, "no_hp", e.target.value)}
                className="input-field"
                placeholder="Phone Number"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={pic.jabatan}
                  onChange={(e) => updatePic(i, "jabatan", e.target.value)}
                  className="input-field"
                  placeholder="Position"
                />
                <button
                  type="button"
                  onClick={() => removePic(i)}
                  disabled={pics.length <= 1}
                  className="shrink-0 rounded p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                  title="Remove PIC"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" className="btn-primary gap-2" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Add customer
      </button>
    </form>
  );
}
