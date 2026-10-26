import {
  createManagedUser,
  deleteManagedUser,
  resetManagedUserPassword,
  updateManagedUser,
} from "@/app/dashboard/settings/userActions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ActionResult = { ok: true } | { ok: false; error: string };

function jsonResult(result: ActionResult) {
  return Response.json(result, { status: result.ok ? 200 : 400 });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      op?: string;
      id?: string;
      email?: string;
      password?: string;
      displayName?: string;
      role?: string;
      annualSalesTarget?: number | null;
    };

    switch (body.op) {
      case "create":
        return jsonResult(
          await createManagedUser({
            email: body.email ?? "",
            password: body.password ?? "",
            displayName: body.displayName ?? "",
            role: body.role ?? "",
            annualSalesTarget: body.annualSalesTarget ?? null,
          })
        );
      case "update":
        return jsonResult(
          await updateManagedUser({
            id: body.id ?? "",
            email: body.email ?? "",
            displayName: body.displayName ?? "",
            role: body.role ?? "",
            annualSalesTarget: body.annualSalesTarget ?? null,
          })
        );
      case "password":
        return jsonResult(
          await resetManagedUserPassword({
            id: body.id ?? "",
            password: body.password ?? "",
          })
        );
      case "delete":
        return jsonResult(await deleteManagedUser(body.id ?? ""));
      default:
        return Response.json({ ok: false, error: "Unknown operation." }, { status: 400 });
    }
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "User admin request failed.",
      },
      { status: 500 }
    );
  }
}
