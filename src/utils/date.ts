export function formatDate(date: Date | string | number): string {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatDateTime(date: Date | string | number): string {
  const d = date instanceof Date ? date : new Date(date);
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${formatDate(d)} ${h}:${min}`;
}

export function daysAgo(date: Date | string | number): number {
  return Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
}

export function isToday(date: Date | string | number): boolean {
  const d = new Date(date);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function isOverdue(date: Date | string | number): boolean {
  return new Date(date) < new Date();
}
