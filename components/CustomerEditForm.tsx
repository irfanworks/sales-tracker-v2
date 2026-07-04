"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus, Trash2, Pencil, CheckCircle2 } from "lucide-react";
import { slugWithId } from "@/lib/slugify";

interface PicRow {
  id?: string;
  nama: string;
  email: string;
  no_hp: string;
  jabatan: string;
}

const emptyPic = (): PicRow => ({ nama: "", email: "", no_hp: "", jabatan: "" });

function hasPicContent(pic: PicRow) {
  return Boolean(pic.nama.trim() || pic.email.trim() || pic.no_hp.trim() || pic.jabatan.trim());
}

export function CustomerEditForm({
  customerId,
  customerSlug,
  initialName,
  initialSector,
  initialPics,
  sectorOptions,
}: {
  customerId: string;
  customerSlug?: string | null;
  initialName: string;
  initialSector: string;
  initialPics: PicRow[];
  sectorOptions: readonly string[];
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [sector, setSector] = useState(initialSector);
  const [savedPics, setSavedPics] = useState<PicRow[]>(initialPics);
  const [draftPics, setDraftPics] = useState<PicRow[]>(
    initialPics.length > 0 ? initialPics : [emptyPic()]
  );
  const [editingPics, setEditingPics] = useState(initialPics.length === 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setName(initialName);
    setSector(initialSector);
    setSavedPics(initialPics);
    setDraftPics(initialPics.length > 0 ? initialPics : [emptyPic()]);
    setEditingPics(initialPics.length === 0);
  }, [initialName, initialSector, initialPics]);

  function addPic() {
    setDraftPics((prev) => [...prev, emptyPic()]);
  }

  function removePic(i: number) {
    setDraftPics((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updatePic(i: number, field: keyof PicRow, value: string) {
    setDraftPics((prev) => prev.map((p, idx) => (idx === i ? { ...p, [field]: value } : p)));
  }

  function startEditingPics() {
    setSuccess(null);
    setDraftPics(savedPics.length > 0 ? savedPics.map((p) => ({ ...p })) : [emptyPic()]);
    setEditingPics(true);
  }

  function cancelEditingPics() {
    setDraftPics(savedPics.length > 0 ? savedPics.map((p) => ({ ...p })) : [emptyPic()]);
    setEditingPics(savedPics.length === 0);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    const supabase = createClient();

    const newSlug = slugWithId(name.trim(), customerId);
    const { error: updateError } = await supabase
      .from("customers")
      .update({ name: name.trim(), sector: sector || null, slug: newSlug })
      .eq("id", customerId);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    const picsToSave = editingPics
      ? draftPics.filter(hasPicContent)
      : savedPics.filter(hasPicContent);

    const existingIds = picsToSave.filter((p) => p.id).map((p) => p.id as string);
    const { data: existingRows } = await supabase
      .from("customer_pics")
      .select("id")
      .eq("customer_id", customerId);
    const toDelete = (existingRows ?? []).map((r) => r.id).filter((id) => !existingIds.includes(id));

    if (toDelete.length > 0) {
      const { error: deleteError } = await supabase.from("customer_pics").delete().in("id", toDelete);
      if (deleteError) {
        setError(deleteError.message);
        setLoading(false);
        return;
      }
    }

    const updatedPics: PicRow[] = [];

    for (const pic of picsToSave) {
      if (pic.id) {
        const { data, error: picError } = await supabase
          .from("customer_pics")
          .update({
            nama: pic.nama.trim() || null,
            email: pic.email.trim() || null,
            no_hp: pic.no_hp.trim() || null,
            jabatan: pic.jabatan.trim() || null,
          })
          .eq("id", pic.id)
          .select("id, nama, email, no_hp, jabatan")
          .single();
        if (picError) {
          setError(picError.message);
          setLoading(false);
          return;
        }
        if (data) {
          updatedPics.push({
            id: data.id,
            nama: data.nama ?? "",
            email: data.email ?? "",
            no_hp: data.no_hp ?? "",
            jabatan: data.jabatan ?? "",
          });
        }
      } else {
        const { data, error: picError } = await supabase
          .from("customer_pics")
          .insert({
            customer_id: customerId,
            nama: pic.nama.trim() || null,
            email: pic.email.trim() || null,
            no_hp: pic.no_hp.trim() || null,
            jabatan: pic.jabatan.trim() || null,
          })
          .select("id, nama, email, no_hp, jabatan")
          .single();
        if (picError) {
          setError(picError.message);
          setLoading(false);
          return;
        }
        if (data) {
          updatedPics.push({
            id: data.id,
            nama: data.nama ?? "",
            email: data.email ?? "",
            no_hp: data.no_hp ?? "",
            jabatan: data.jabatan ?? "",
          });
        }
      }
    }

    setSavedPics(updatedPics);
    setDraftPics(updatedPics.length > 0 ? updatedPics : [emptyPic()]);
    setEditingPics(updatedPics.length === 0);
    setLoading(false);
    setSuccess("Customer saved successfully.");
    router.refresh();

    if (newSlug !== customerSlug) {
      router.replace(`/dashboard/customers/${newSlug}`);
    }
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
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <label className="text-sm font-medium text-slate-700">Person in charge (PIC)</label>
            <p className="text-xs text-slate-500">Optional. Saved PICs are shown as read-only until you edit.</p>
          </div>
          {!editingPics && (
            <button
              type="button"
              onClick={startEditingPics}
              className="btn-secondary gap-2 text-sm"
            >
              <Pencil className="h-4 w-4" />
              {savedPics.length > 0 ? "Edit PICs" : "Add PIC"}
            </button>
          )}
        </div>

        {!editingPics ? (
          savedPics.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full min-w-[400px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="px-4 py-3 font-medium text-slate-700">Name</th>
                    <th className="px-4 py-3 font-medium text-slate-700">Email</th>
                    <th className="px-4 py-3 font-medium text-slate-700">Phone</th>
                    <th className="px-4 py-3 font-medium text-slate-700">Position</th>
                  </tr>
                </thead>
                <tbody>
                  {savedPics.map((pic) => (
                    <tr key={pic.id ?? pic.nama} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-3 text-slate-800">{pic.nama || "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{pic.email || "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{pic.no_hp || "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{pic.jabatan || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-4 py-6 text-center text-sm text-slate-500">
              No PIC added yet.
            </p>
          )
        ) : (
          <div className="space-y-3 rounded-lg border border-cyan-200 bg-cyan-50/20 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-slate-700">Editing PIC details</p>
              {savedPics.length > 0 && (
                <button type="button" onClick={cancelEditingPics} className="text-sm text-slate-600 hover:text-slate-800">
                  Cancel
                </button>
              )}
            </div>
            {draftPics.map((pic, i) => (
              <div
                key={pic.id ?? `draft-${i}`}
                className="grid gap-3 rounded border border-slate-100 bg-white p-3 sm:grid-cols-2 lg:grid-cols-4"
              >
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
                    disabled={draftPics.length <= 1}
                    className="shrink-0 rounded p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                    title="Remove PIC"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addPic}
              className="inline-flex items-center gap-1 rounded px-2 py-1 text-sm text-cyan-700 hover:bg-cyan-50"
            >
              <UserPlus className="h-4 w-4" />
              Add another PIC
            </button>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && (
        <p className="flex items-center gap-2 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {success}
        </p>
      )}
      <button type="submit" className="btn-primary gap-2" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Save changes
      </button>
    </form>
  );
}
