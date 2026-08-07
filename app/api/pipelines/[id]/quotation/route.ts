import { NextResponse } from "next/server";
import { getAuthUser, getProfile, getSupabase } from "@/lib/auth";
import { getPipelineBySlugOrId } from "@/lib/pipelines";
import {
  buildQuotationData,
  buildQuotationFilename,
} from "@/lib/quotation/buildQuotationData";
import { generateQuotationDocx } from "@/lib/quotation/generateQuotationDocx";
import type { PaymentTermLine } from "@/lib/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parsePaymentTerms(raw: unknown): PaymentTermLine[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((t) => ({
    label: String((t as PaymentTermLine)?.label ?? ""),
    percent: Number((t as PaymentTermLine)?.percent) || 0,
    is_custom: Boolean((t as PaymentTermLine)?.is_custom),
  }));
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getProfile();
  const { id: slugOrId } = await context.params;

  const { project: lookup, error: lookupError } = await getPipelineBySlugOrId(slugOrId);
  if (lookupError) {
    return NextResponse.json({ error: lookupError.message }, { status: 500 });
  }
  if (!lookup?.id) {
    return NextResponse.json({ error: "Pipeline not found" }, { status: 404 });
  }

  const supabase = await getSupabase();
  const { data: pipeline, error } = await supabase
    .from("pipelines")
    .select(
      `
      id,
      no_quote,
      pipeline_name,
      pipeline_type,
      progress_type,
      value,
      pic_name,
      pic_salutation,
      price_validity_days,
      delivery_weeks,
      payment_terms,
      sales_id,
      customers ( id, name, sector )
    `
    )
    .eq("id", lookup.id)
    .single();

  if (error || !pipeline) {
    return NextResponse.json({ error: "Pipeline not found" }, { status: 404 });
  }

  if (profile?.role !== "admin" && pipeline.sales_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: salesProfile } = await supabase
    .from("profiles")
    .select("display_name, full_name, email")
    .eq("id", pipeline.sales_id)
    .maybeSingle();

  const customer = Array.isArray(pipeline.customers)
    ? pipeline.customers[0]
    : pipeline.customers;

  const customerName = (customer as { name?: string } | null)?.name ?? "";
  const customerSector = (customer as { sector?: string | null } | null)?.sector ?? null;

  const fields = buildQuotationData({
    no_quote: pipeline.no_quote,
    pipeline_name: pipeline.pipeline_name,
    pipeline_type: pipeline.pipeline_type,
    progress_type: pipeline.progress_type,
    value: pipeline.value != null ? Number(pipeline.value) : null,
    pic_name: pipeline.pic_name,
    pic_salutation: pipeline.pic_salutation,
    price_validity_days: pipeline.price_validity_days,
    delivery_weeks: pipeline.delivery_weeks,
    payment_terms: parsePaymentTerms(pipeline.payment_terms),
    customer_name: customerName,
    customer_sector: customerSector,
    sales_name: salesProfile?.display_name ?? salesProfile?.full_name ?? null,
    sales_email: salesProfile?.email ?? null,
  });

  try {
    const buffer = generateQuotationDocx(fields);
    const filename = buildQuotationFilename(pipeline.no_quote, customerName);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to generate quotation";
    console.error("[quotation]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
