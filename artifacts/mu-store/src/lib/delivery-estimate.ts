const FAST = new Set(["Cairo", "Giza", "Alexandria", "Qaliubiya", "Menofia"]);
const REMOTE = new Set(["Matrouh", "New Valley", "South Sinai", "North Sinai", "Red Sea", "Aswan"]);

function addBusinessDays(start: Date, days: number): Date {
  const d = new Date(start);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) added++;
  }
  return d;
}

export function getDeliveryWindow(governorate?: string): { min: number; max: number; label: string } {
  if (!governorate) return { min: 3, max: 5, label: "3–5 business days" };
  if (FAST.has(governorate)) return { min: 1, max: 2, label: "1–2 business days" };
  if (REMOTE.has(governorate)) return { min: 5, max: 7, label: "5–7 business days" };
  return { min: 3, max: 5, label: "3–5 business days" };
}

export function getEstimatedDeliveryDate(governorate?: string): string {
  const { min, max } = getDeliveryWindow(governorate);
  const now = new Date();
  const minDate = addBusinessDays(now, min);
  const maxDate = addBusinessDays(now, max);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  return `${fmt(minDate)} – ${fmt(maxDate)}`;
}
