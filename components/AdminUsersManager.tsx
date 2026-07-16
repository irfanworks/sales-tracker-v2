"use client";

import { useMemo, useState, useTransition } from "react";
import { KeyRound, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  createManagedUser,
  deleteManagedUser,
  resetManagedUserPassword,
  updateManagedUser,
} from "@/app/dashboard/settings/userActions";
import { formatNumberAsThousands, formatThousandsInput, parseThousandsInput } from "@/lib/formatThousands";

export type ManagedUser = {
  id: string;
  email: string;
  display_name: string;
  role: "admin" | "sales";
  annual_sales_target: number | null;
};

type Mode =
  | { type: "idle" }
  | { type: "create" }
  | { type: "edit"; user: ManagedUser }
  | { type: "password"; user: ManagedUser };

const emptyForm = {
  email: "",
  displayName: "",
  role: "sales" as "admin" | "sales",
  annualTargetDisplay: "",
  password: "",
  confirmPassword: "",
};

export function AdminUsersManager({
  users,
  currentUserId,
}: {
  users: ManagedUser[];
  currentUserId: string;
}) {
  const [mode, setMode] = useState<Mode>({ type: "idle" });
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const sorted = useMemo(
    () =>
      [...users].sort((a, b) =>
        a.display_name.localeCompare(b.display_name, undefined, { sensitivity: "base" })
      ),
    [users]
  );

  function openCreate() {
    setError(null);
    setSuccess(null);
    setForm(emptyForm);
    setMode({ type: "create" });
  }

  function openEdit(user: ManagedUser) {
    setError(null);
    setSuccess(null);
    setForm({
      ...emptyForm,
      email: user.email,
      displayName: user.display_name,
      role: user.role,
      annualTargetDisplay: formatNumberAsThousands(user.annual_sales_target),
    });
    setMode({ type: "edit", user });
  }

  function openPassword(user: ManagedUser) {
    setError(null);
    setSuccess(null);
    setForm({ ...emptyForm, password: "", confirmPassword: "" });
    setMode({ type: "password", user });
  }

  function closePanel() {
    setMode({ type: "idle" });
    setError(null);
  }

  function parseTarget(): number | null | undefined {
    const display = form.annualTargetDisplay;
    if (!display.trim()) return null;
    const n = parseThousandsInput(display);
    if (n == null || n < 0) return undefined;
    return n;
  }

  function submitCreate() {
    setError(null);
    setSuccess(null);
    const target = parseTarget();
    if (target === undefined) {
      setError("Annual sales target must be a valid non-negative number.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Password and confirmation do not match.");
      return;
    }
    startTransition(async () => {
      const result = await createManagedUser({
        email: form.email,
        password: form.password,
        displayName: form.displayName,
        role: form.role,
        annualSalesTarget: target,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSuccess("User created successfully.");
      setMode({ type: "idle" });
    });
  }

  function submitEdit() {
    if (mode.type !== "edit") return;
    setError(null);
    setSuccess(null);
    const target = parseTarget();
    if (target === undefined) {
      setError("Annual sales target must be a valid non-negative number.");
      return;
    }
    startTransition(async () => {
      const result = await updateManagedUser({
        id: mode.user.id,
        email: form.email,
        displayName: form.displayName,
        role: form.role,
        annualSalesTarget: target,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSuccess("User updated successfully.");
      setMode({ type: "idle" });
    });
  }

  function submitPassword() {
    if (mode.type !== "password") return;
    setError(null);
    setSuccess(null);
    if (form.password !== form.confirmPassword) {
      setError("Password and confirmation do not match.");
      return;
    }
    startTransition(async () => {
      const result = await resetManagedUserPassword({
        id: mode.user.id,
        password: form.password,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSuccess(`Password updated for ${mode.user.display_name}.`);
      setMode({ type: "idle" });
    });
  }

  function confirmDelete(user: ManagedUser) {
    const ok = window.confirm(
      `Delete ${user.display_name} (${user.email})?\n\n` +
        "This permanently removes the account and all projects / BD updates owned by this user. This cannot be undone."
    );
    if (!ok) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await deleteManagedUser(user.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSuccess(`${user.display_name} deleted.`);
      setMode({ type: "idle" });
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <p className="text-sm text-slate-600">
          Create, edit, or delete sales and admin accounts. You can also set a new password for any
          user. Requires <code className="text-xs">SUPABASE_SERVICE_ROLE_KEY</code> on the server.
        </p>
        <button type="button" onClick={openCreate} className="btn-primary shrink-0 gap-2" disabled={pending}>
          <Plus className="h-4 w-4" />
          Add user
        </button>
      </div>

      {success && <p className="text-sm text-green-600">{success}</p>}
      {error && mode.type === "idle" && <p className="text-sm text-red-600">{error}</p>}

      {mode.type !== "idle" && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-800">
              {mode.type === "create" && "Add user"}
              {mode.type === "edit" && `Edit ${mode.user.display_name}`}
              {mode.type === "password" && `Set password — ${mode.user.display_name}`}
            </h3>
            <button
              type="button"
              onClick={closePanel}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-white hover:text-slate-800"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {(mode.type === "create" || mode.type === "edit") && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-500">Display name</label>
                <input
                  type="text"
                  value={form.displayName}
                  onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                  className="input-field"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="input-field"
                  placeholder="user@company.com"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Role</label>
                <select
                  value={form.role}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, role: e.target.value as "admin" | "sales" }))
                  }
                  className="input-field"
                >
                  <option value="sales">Sales</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  Annual sales target (IDR)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.annualTargetDisplay}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      annualTargetDisplay: formatThousandsInput(e.target.value),
                    }))
                  }
                  className="input-field tabular-nums"
                  placeholder="Optional"
                />
              </div>
              {mode.type === "create" && (
                <>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Password</label>
                    <input
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                      className="input-field"
                      placeholder="Min. 8 characters"
                      autoComplete="new-password"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">
                      Confirm password
                    </label>
                    <input
                      type="password"
                      value={form.confirmPassword}
                      onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                      className="input-field"
                      autoComplete="new-password"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {mode.type === "password" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">New password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="input-field"
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Confirm password</label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                  className="input-field"
                  autoComplete="new-password"
                />
              </div>
            </div>
          )}

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <div className="mt-4 flex flex-wrap gap-2">
            {mode.type === "create" && (
              <button
                type="button"
                onClick={submitCreate}
                className="btn-primary gap-2"
                disabled={pending}
              >
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                Create user
              </button>
            )}
            {mode.type === "edit" && (
              <button
                type="button"
                onClick={submitEdit}
                className="btn-primary gap-2"
                disabled={pending}
              >
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                Save changes
              </button>
            )}
            {mode.type === "password" && (
              <button
                type="button"
                onClick={submitPassword}
                className="btn-primary gap-2"
                disabled={pending}
              >
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                Update password
              </button>
            )}
            <button type="button" onClick={closePanel} className="btn-secondary" disabled={pending}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Target (IDR)</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.map((u) => {
              const isSelf = u.id === currentUserId;
              return (
                <tr key={u.id} className="bg-white">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {u.display_name}
                    {isSelf && (
                      <span className="ml-2 text-xs font-normal text-slate-400">(you)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{u.email || "—"}</td>
                  <td className="px-4 py-3 capitalize text-slate-500">{u.role}</td>
                  <td className="px-4 py-3 tabular-nums text-slate-600">
                    {u.annual_sales_target != null
                      ? formatNumberAsThousands(u.annual_sales_target)
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEdit(u)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        disabled={pending}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => openPassword(u)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        disabled={pending}
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                        Password
                      </button>
                      <button
                        type="button"
                        onClick={() => confirmDelete(u)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-40"
                        disabled={pending || isSelf}
                        title={isSelf ? "You cannot delete your own account" : "Delete user"}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
