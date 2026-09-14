"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Plus, Trash2 } from "lucide-react";
import type { CustomerSector, CustomerPIC } from "@/types/database";

const SECTORS: CustomerSector[] = [
  "Data Center",
  "Oil and Gas",
  "Commercial",
  "Industrial",
  "Mining",
];

const emptyPIC = (): CustomerPIC => ({
  nama_pic: "",
  email: "",
  no_hp: "",
  jabatan: "",
});

interface CustomerFormProps {
  defaultValues?: {
    id: string;
    name: string;
    sector: CustomerSector;
  };
  initialPics?: CustomerPIC[];
}

export function CustomerForm({ defaultValues, initialPics = [] }: CustomerFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState(defaultValues?.name ?? "");
  const [sector, setSector] = useState<CustomerSector>(
    defaultValues?.sector ?? "Commercial"
  );
  const [pics, setPics] = useState<CustomerPIC[]>(
    initialPics.length > 0
      ? initialPics.map((p) => ({
          id: p.id,
          customer_id: p.customer_id,
          nama_pic: p.nama_pic ?? "",
          email: p.email ?? "",
          no_hp: p.no_hp ?? "",
          jabatan: p.jabatan ?? "",
        }))
      : [emptyPIC()]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addPIC() {
    setPics((prev) => [...prev, emptyPIC()]);
  }

  function removePIC(index: number) {
    setPics((prev) => prev.filter((_, i) => i !== index));
  }

  function updatePIC(index: number, field: keyof CustomerPIC, value: string) {
    setPics((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (defaultValues?.id) {
        const { error: updateError } = await supabase
          .from("customers")
          .update({ name, sector })
          .eq("id", defaultValues.id);
        if (updateError) throw updateError;

        const existingIds = pics.filter((p) => p.id).map((p) => p.id as string);
        const { data: existing } = await supabase
          .from("customer_pics")
          .select("id")
          .eq("customer_id", defaultValues.id);
        const toDelete = (existing ?? []).filter((e) => !existingIds.includes(e.id));
        for (const row of toDelete) {
          await supabase.from("customer_pics").delete().eq("id", row.id);
        }
        for (const pic of pics) {
          const row = {
            customer_id: defaultValues.id,
            nama_pic: pic.nama_pic.trim() || null,
            email: pic.email.trim() || null,
            no_hp: pic.no_hp.trim() || null,
            jabatan: pic.jabatan.trim() || null,
          };
          if (pic.id) {
            await supabase.from("customer_pics").update(row).eq("id", pic.id);
          } else if (pic.nama_pic || pic.email || pic.no_hp || pic.jabatan) {
            await supabase.from("customer_pics").insert(row);
          }
        }
      } else {
        const { data: newCustomer, error: insertError } = await supabase
          .from("customers")
          .insert({ name, sector })
          .select("id")
          .single();
        if (insertError) throw insertError;
        const customerId = newCustomer.id;
        for (const pic of pics) {
          if (pic.nama_pic || pic.email || pic.no_hp || pic.jabatan) {
            await supabase.from("customer_pics").insert({
              customer_id: customerId,
              nama_pic: pic.nama_pic.trim() || null,
              email: pic.email.trim() || null,
              no_hp: pic.no_hp.trim() || null,
              jabatan: pic.jabatan.trim() || null,
            });
          }
        }
      }
      router.push("/customers");
      router.refresh();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Gagal menyimpan customer."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-3">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Nama Customer
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Nama customer"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Sector <span className="text-red-500">*</span>
        </label>
        <select
          value={sector}
          onChange={(e) => setSector(e.target.value as CustomerSector)}
          required
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          {SECTORS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-slate-700">
            PIC (optional, bisa lebih dari satu)
          </label>
          <button
            type="button"
            onClick={addPIC}
            className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            <Plus className="h-4 w-4" />
            Tambah PIC
          </button>
        </div>
        <div className="space-y-4 border border-slate-200 rounded-lg p-4 bg-slate-50/50">
          {pics.map((pic, index) => (
            <div
              key={pic.id ?? index}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-white rounded-lg border border-slate-100"
            >
              <input
                type="text"
                value={pic.nama_pic}
                onChange={(e) => updatePIC(index, "nama_pic", e.target.value)}
                placeholder="Nama PIC"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="email"
                value={pic.email}
                onChange={(e) => updatePIC(index, "email", e.target.value)}
                placeholder="Email"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="text"
                value={pic.no_hp}
                onChange={(e) => updatePIC(index, "no_hp", e.target.value)}
                placeholder="No. HP"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={pic.jabatan}
                  onChange={(e) => updatePIC(index, "jabatan", e.target.value)}
                  placeholder="Jabatan"
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="button"
                  onClick={() => removePIC(index)}
                  disabled={pics.length <= 1}
                  className="p-2 text-slate-500 hover:text-red-600 disabled:opacity-50"
                  aria-label="Hapus PIC"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-primary-700 text-white py-2.5 px-5 font-medium hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {defaultValues?.id ? "Simpan Perubahan" : "Simpan Customer"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-slate-300 text-slate-700 py-2.5 px-5 font-medium hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          Batal
        </button>
      </div>
    </form>
  );
}
