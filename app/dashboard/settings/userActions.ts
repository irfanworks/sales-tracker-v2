"use server";

import { revalidatePath } from "next/cache";
import { getAuthUser, getProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { validatePassword } from "@/lib/password";
import type { UserRole } from "@/lib/types/database";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function requireAdmin() {
  const [user, profile] = await Promise.all([getAuthUser(), getProfile()]);
  if (!user || profile?.role !== "admin") {
    return { error: "Forbidden. Admin access required." as const, user: null };
  }
  return { error: null, user, profile };
}

function parseRole(role: string): UserRole | null {
  if (role === "admin" || role === "sales") return role;
  return null;
}

async function countAdmins(admin = createAdminClient()) {
  const { count, error } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function createManagedUser(input: {
  email: string;
  password: string;
  displayName: string;
  role: string;
  annualSalesTarget: number | null;
}): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (gate.error) return { ok: false, error: gate.error };

  const email = input.email.trim().toLowerCase();
  const displayName = input.displayName.trim();
  const role = parseRole(input.role);
  if (!email || !email.includes("@")) return { ok: false, error: "A valid email is required." };
  if (!displayName) return { ok: false, error: "Display name is required." };
  if (!role) return { ok: false, error: "Role must be admin or sales." };
  const pwError = validatePassword(input.password);
  if (pwError) return { ok: false, error: pwError };
  if (input.annualSalesTarget != null && input.annualSalesTarget < 0) {
    return { ok: false, error: "Annual sales target must be non-negative." };
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: input.password,
      email_confirm: true,
      user_metadata: { full_name: displayName },
    });
    if (error || !data.user) {
      return { ok: false, error: error?.message ?? "Failed to create user." };
    }

    const { error: profileError } = await admin
      .from("profiles")
      .update({
        email,
        full_name: displayName,
        display_name: displayName,
        role,
        annual_sales_target: input.annualSalesTarget,
      })
      .eq("id", data.user.id);

    if (profileError) {
      return {
        ok: false,
        error: `User created but profile update failed: ${profileError.message}`,
      };
    }

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to create user." };
  }
}

export async function updateManagedUser(input: {
  id: string;
  email: string;
  displayName: string;
  role: string;
  annualSalesTarget: number | null;
}): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (gate.error) return { ok: false, error: gate.error };

  const email = input.email.trim().toLowerCase();
  const displayName = input.displayName.trim();
  const role = parseRole(input.role);
  if (!input.id) return { ok: false, error: "User id is required." };
  if (!email || !email.includes("@")) return { ok: false, error: "A valid email is required." };
  if (!displayName) return { ok: false, error: "Display name is required." };
  if (!role) return { ok: false, error: "Role must be admin or sales." };
  if (input.annualSalesTarget != null && input.annualSalesTarget < 0) {
    return { ok: false, error: "Annual sales target must be non-negative." };
  }

  try {
    const admin = createAdminClient();
    const { data: existing, error: existingError } = await admin
      .from("profiles")
      .select("id, role")
      .eq("id", input.id)
      .maybeSingle();
    if (existingError) return { ok: false, error: existingError.message };
    if (!existing) return { ok: false, error: "User not found." };

    if (existing.role === "admin" && role !== "admin") {
      const admins = await countAdmins(admin);
      if (admins <= 1) {
        return { ok: false, error: "Cannot demote the last admin account." };
      }
      if (gate.user!.id === input.id) {
        return { ok: false, error: "You cannot demote your own admin role." };
      }
    }

    const { error: authError } = await admin.auth.admin.updateUserById(input.id, {
      email,
      email_confirm: true,
      user_metadata: { full_name: displayName },
    });
    if (authError) return { ok: false, error: authError.message };

    const { error: profileError } = await admin
      .from("profiles")
      .update({
        email,
        full_name: displayName,
        display_name: displayName,
        role,
        annual_sales_target: input.annualSalesTarget,
      })
      .eq("id", input.id);
    if (profileError) return { ok: false, error: profileError.message };

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to update user." };
  }
}

export async function resetManagedUserPassword(input: {
  id: string;
  password: string;
}): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (gate.error) return { ok: false, error: gate.error };
  if (!input.id) return { ok: false, error: "User id is required." };
  const pwError = validatePassword(input.password);
  if (pwError) return { ok: false, error: pwError };

  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(input.id, {
      password: input.password,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to reset password." };
  }
}

export async function deleteManagedUser(id: string): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (gate.error) return { ok: false, error: gate.error };
  if (!id) return { ok: false, error: "User id is required." };
  if (gate.user!.id === id) {
    return { ok: false, error: "You cannot delete your own account." };
  }

  try {
    const admin = createAdminClient();
    const { data: existing, error: existingError } = await admin
      .from("profiles")
      .select("id, role")
      .eq("id", id)
      .maybeSingle();
    if (existingError) return { ok: false, error: existingError.message };
    if (!existing) return { ok: false, error: "User not found." };

    if (existing.role === "admin") {
      const admins = await countAdmins(admin);
      if (admins <= 1) {
        return { ok: false, error: "Cannot delete the last admin account." };
      }
    }

    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) return { ok: false, error: error.message };

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to delete user." };
  }
}
