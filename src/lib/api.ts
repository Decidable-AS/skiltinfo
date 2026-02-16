import { VegvesenResponse, KjoretoyData } from "./types";

const API_BASE =
  "https://www.vegvesen.no/ws/no/vegvesen/kjoretoy/felles/datautlevering/enkeltoppslag/kjoretoydata";

export async function fetchVehicle(
  regnr: string
): Promise<KjoretoyData | null> {
  const cleaned = regnr.toUpperCase().replace(/[\s-]/g, "");

  const res = await fetch(`${API_BASE}?kjennemerke=${cleaned}`, {
    headers: {
      "SVV-Authorization": `Apikey ${process.env.SVV_API_KEY}`,
    },
    next: { revalidate: 3600 },
  });

  if (res.status === 204 || res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error(`Vegvesen API error: ${res.status}`);
  }

  const data: VegvesenResponse = await res.json();

  if (!data.kjoretoydataListe || data.kjoretoydataListe.length === 0) {
    return null;
  }

  return data.kjoretoydataListe[0];
}
