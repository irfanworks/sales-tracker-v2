"use server";

import { revalidatePath } from "next/cache";
import { getAuthUser, getSupabase } from "@/lib/auth";
import { slugWithId } from "@/lib/slugify";

export type CustomerActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export type CreateCustomerInput = {
  name: string;
  sector: string | null;
  pics: {
    nama: string;
    email: string;
    no_hp: string;
    jabatan: string;
  }[];
};

export async function createCustomerAction(
  input: CreateCustomerInput
): Promise<CustomerActionResult> {
  const user = await getAuthUser();
  if (!user) {
    return { ok: false, error: "Not authenticated. Please sign in again." };
  }

  const name = input.name.trim();
  if (!name) return { ok: false, error: "Customer name is required." };

  const picsWithName = input.pics.filter((p) => p.nama.trim());
  if (picsWithName.length === 0) {
    return { ok: false, error: "At least one PIC with a name is required." };
  }

  const incomplete = input.pics.find(
    (p) => !p.nama.trim() && (p.email.trim() || p.no_hp.trim() || p.jabatan.trim())
  );
  if (incomplete) {
    return { ok: false, error: "PIC name is required for each PIC entry." };
  }

  const supabase = await getSupabase();

  const { data: existing } = await supabase
    .from("customers")
    .select("id, name")
    .ilike("name", name)
    .limit(5);

  const exact = (existing ?? []).find(
    (c) => c.name.trim().toLowerCase() === name.toLowerCase()
  );
  if (exact) {
    return {
      ok: false,
      error: "Customer name already exists. Use the existing customer record instead.",
    };
  }

  // slug is NOT NULL — generate id first so slugWithId can include the short id suffix
  const id = crypto.randomUUID();
  const slug = slugWithId(name, id);

  const { data: customer, error: insertError } = await supabase
    .from("customers")
    .insert({
      id,
      name,
      sector: input.sector?.trim() || null,
      slug,
    })
    .select("id")
    .single();

  if (insertError || !customer?.id) {
    return {
      ok: false,
      error: insertError?.message ?? "Failed to create customer.",
    };
  }

  const { error: picsError } = await supabase.from("customer_pics").insert(
    picsWithName.map((p) => ({
      customer_id: customer.id,
      nama: p.nama.trim(),
      email: p.email.trim() || null,
      no_hp: p.no_hp.trim() || null,
      jabatan: p.jabatan.trim() || null,
    }))
  );

  if (picsError) {
    return {
      ok: false,
      error: `Customer created but PIC save failed: ${picsError.message}`,
    };
  }

  revalidatePath("/dashboard/customers");
  revalidatePath("/dashboard/pipeline/new");
  revalidatePath("/dashboard/prospects/new");
  return { ok: true, id: customer.id };
}
