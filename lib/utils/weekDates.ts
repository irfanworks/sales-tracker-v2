/**
 * Mendapatkan rentang tanggal (Senin-Jumat) untuk week number tertentu di tahun yang diberikan.
 * Format: Week N (dd - dd MMM) atau (dd MMM - dd MMM) jika beda bulan.
 */
export function getWeekDateRange(year: number, weekNumber: number): { start: Date; end: Date } {
  // ISO week: Week 1 = minggu yang mengandung 4 Jan
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay(); // 0=Sun, 1=Mon, ...
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const week1Monday = new Date(year, 0, 4 + mondayOffset);
  const targetMonday = new Date(week1Monday);
  targetMonday.setDate(week1Monday.getDate() + (weekNumber - 1) * 7);
  const targetFriday = new Date(targetMonday);
  targetFriday.setDate(targetMonday.getDate() + 4);
  return { start: targetMonday, end: targetFriday };
}

export function formatWeekLabel(year: number, weekNumber: number): string {
  const { start, end } = getWeekDateRange(year, weekNumber);
  const monthFmt = new Intl.DateTimeFormat("en-GB", { month: "short" });
  const dayFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric" });
  const startDay = dayFmt.format(start);
  const endDay = dayFmt.format(end);
  const endMonth = monthFmt.format(end);
  if (start.getMonth() === end.getMonth()) {
    return `Week ${weekNumber} (${startDay} - ${endDay} ${endMonth})`;
  }
  const startMonth = monthFmt.format(start);
  return `Week ${weekNumber} (${startDay} ${startMonth} - ${endDay} ${endMonth})`;
}
