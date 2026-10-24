// The event editor works with plain local strings: "YYYY-MM-DD" and "HH:MM".

const pad = (n: number) => String(n).padStart(2, "0");

export function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function toTimeStr(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Local date + time strings → a Date in the device's time zone. */
export function combine(date: string, time: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  return new Date(y, m - 1, d, h, min);
}

export function formatDateStr(date: string): string {
  if (!date) return "";
  return combine(date, "12:00").toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTimeStr(time: string): string {
  if (!time) return "";
  return combine("2000-01-01", time).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}
