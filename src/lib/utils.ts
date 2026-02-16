export function formatDate(dateStr?: string): string {
  if (!dateStr) return "Ukjent";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("nb-NO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function formatNumber(num?: number): string {
  if (num === undefined || num === null) return "Ukjent";
  return num.toLocaleString("nb-NO");
}

export function formatWeight(kg?: number): string {
  if (kg === undefined || kg === null) return "Ukjent";
  return `${kg.toLocaleString("nb-NO")} kg`;
}

export function formatSpeed(kmh?: number): string {
  if (kmh === undefined || kmh === null) return "Ukjent";
  return `${kmh} km/t`;
}

export function formatFuelConsumption(liters?: number): string {
  if (liters === undefined || liters === null) return "Ukjent";
  return `${liters} l/100km`;
}

export function formatCO2(grams?: number): string {
  if (grams === undefined || grams === null) return "Ukjent";
  return `${grams} g/km`;
}

export function formatPlate(plate?: string): string {
  if (!plate) return "";
  const cleaned = plate.replace(/\s/g, "");
  if (cleaned.length >= 4) {
    return `${cleaned.slice(0, 2)} ${cleaned.slice(2)}`;
  }
  return plate;
}

export function getRegistrationStatusColor(status?: string): string {
  switch (status) {
    case "REGISTRERT":
      return "text-emerald-700 bg-emerald-50 border-emerald-200";
    case "AVREGISTRERT":
      return "text-amber-700 bg-amber-50 border-amber-200";
    case "VRAKET":
      return "text-red-700 bg-red-50 border-red-200";
    default:
      return "text-slate-700 bg-slate-50 border-slate-200";
  }
}

export function getRegistrationStatusText(status?: string): string {
  switch (status) {
    case "REGISTRERT":
      return "Registrert";
    case "AVREGISTRERT":
      return "Avregistrert";
    case "VRAKET":
      return "Vraket";
    default:
      return status || "Ukjent";
  }
}

export function isEUControlOverdue(kontrollfrist?: string): boolean {
  if (!kontrollfrist) return false;
  return new Date(kontrollfrist) < new Date();
}
