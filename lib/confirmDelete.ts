/**
 * Native browser OK / Cancel for destructive deletes.
 * Returns true only when the user clicks OK.
 */
export function confirmDelete(message: string): boolean {
  return window.confirm(message);
}
