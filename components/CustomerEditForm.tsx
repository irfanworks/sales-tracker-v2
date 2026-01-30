"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus, Trash2 } from "lucide-react";

interface PicRow {
  id?: string;
  nama: string;
  email: string;
  no_hp: string;
  jabatan: string;
}

const emptyPic = (): PicRow => ({ nama: "", email: "", no_hp: "", jabatan: "" });

export function CustomerEditForm({
  customerId,
  initialName,
  initialSector,
  initialPics,
  sectorOptions,
}: {
  customerId: string;
  initialName: string;
  initialSector: string;
  initialPics: PicRow[];
  sectorOptions: readonly string[];
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [sector, setSector] = useState(initialSector);
  const [pics, setPics] = useState<PicRow[]>(
    initialPics.length > 0 ? initialPics : [emptyPic()]
  );
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

    const { error: updateError } = await supabase
      .from("customers")
      .update({ name: name.trim(), sector: sector || null })
      .eq("id", customerId);
    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    const existingIds = pics.filter((p) => p.id).map((p) => p.id as string);
    const { data: existingRows } = await supabase
      .from("customer_pics")
      .select("id")
      .eq("customer_id", customerId);
    const toDelete = (existingRows ?? []).map((r) => r.id).filter((id) => !existingIds.includes(id));
    if (toDelete.length > 0) {
      await supabase.from("customer_pics").delete().in("id", toDelete);
    }

    const picsToUpsert = pics.filter(
      (p) => p.nama.trim() || p.email.trim() || p.no_hp.trim() || p.jabatan.trim()
    );
    for (const pic of picsToUpsert) {
      if (pic.id) {
        await supabase
          .from("customer_pics")
          .update({
            nama: pic.nama.trim() || null,
            email: pic.email.trim() || null,
            no_hp: pic.no_hp.trim() || null,
            jabatan: pic.jabatan.trim() || null,
          })
          .eq("id", pic.id);
      } else {
        await supabase.from("customer_pics").insert({
          customer_id: customerId,
          nama: pic.nama.trim() || null,
          email: pic.email.trim() || null,
          no_hp: pic.no_hp.trim() || null,
          jabatan: pic.jabatan.trim() || null,
        });
      }
    }

    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Customer name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Sector</label>
          <select
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className="input-field"
          >
            <option value="">— Select —</option>
            {sectorOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium text-slate-700">PIC (optional)</label>
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
                placeholder="Nama PIC"
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
                placeholder="No. HP"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={pic.jabatan}
                  onChange={(e) => updatePic(i, "jabatan", e.target.value)}
                  className="input-field"
                  placeholder="Jabatan"
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
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Save changes
      </button>
    </form>
  );
}
