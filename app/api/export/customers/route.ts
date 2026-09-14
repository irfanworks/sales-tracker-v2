import { NextRequest, NextResponse } from "next/server";
import { format } from "date-fns";
import { getAuthUser, getSupabase } from "@/lib/auth";
import { buildCustomersWorkbook } from "@/lib/exportCustomersServer";

const EXPORT_CUSTOMER_CAP = 5000;

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 80);
  const supabase = await getSupabase();

  let query = supabase
    .from("customers")
    .select(
      `
      name,
      sector,
      customer_role,
      created_at,
      customer_pics ( nama, email )
    `
    )
    .order("name")
    .limit(EXPORT_CUSTOMER_CAP);

  if (q) {
    query = query.or(`name.ilike.%${q}%,sector.ilike.%${q}%,customer_role.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[export-customers]", error.message);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }

  const rows = (data ?? []).map((c) => {
    const pics = Array.isArray(c.customer_pics) ? c.customer_pics : [];
    return {
      name: c.name,
      sector: c.sector ?? "",
      customer_role: c.customer_role ?? "",
      created: c.created_at ? format(new Date(c.created_at), "dd MMM yyyy") : "",
      pics_summary: pics
        .map((p: { nama: string | null; email: string | null }) => p.nama || p.email || "")
        .filter(Boolean)
        .join(", "),
    };
  });

  const buffer = buildCustomersWorkbook(rows);
  const filename = `customers-export-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
