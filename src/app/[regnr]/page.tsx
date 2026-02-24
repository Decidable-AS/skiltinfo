import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getVehicleView } from "@/lib/vehicle";
import { formatPlate, getBaseUrl } from "@/lib/utils";
import { fetchVehicle } from "@/lib/api";

interface PageProps {
  params: Promise<{ regnr: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { regnr } = await params;
  const plate = formatPlate(regnr.toUpperCase());
  const baseUrl = getBaseUrl();
  const canonical = `${baseUrl}/${regnr.toUpperCase()}`;
  const vehicle = await fetchVehicle(regnr);

  if (!vehicle) {
    return {
      title: `${plate} - Kjøretøy ikke funnet`,
      description: `Ingen kjøretøy funnet med registreringsnummer ${plate}.`,
      robots: { index: false, follow: false },
    };
  }

  const tech = vehicle.godkjenning?.tekniskGodkjenning?.tekniskeData;
  const merke = tech?.generelt?.merke?.[0]?.merke || "";
  const modell = tech?.generelt?.handelsbetegnelse?.[0] || "";
  const year = vehicle.forstegangsregistrering?.registrertForstegangNorgeDato?.slice(0, 4) || "";
  const title = `${plate} - ${merke} ${modell} ${year} | Skiltinfo`;
  const description = `Se all informasjon om ${merke} ${modell} (${year}) med registreringsnummer ${plate}. Motor, vekt, dekk, EU-kontroll, utslipp og mer.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "Skiltinfo",
      url: canonical,
    },
    twitter: { card: "summary", title, description },
    alternates: { canonical },
  };
}

function DotRow({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-baseline gap-1 py-1 font-mono text-[13px] min-w-0">
      <span className="text-slate-600 whitespace-nowrap shrink-0">{label}</span>
      <span className="flex-1 border-b border-dotted border-slate-300 translate-y-[-3px] mx-1 min-w-2 shrink" />
      <span className="text-slate-900 font-medium text-right break-words min-w-0">{String(value)}</span>
    </div>
  );
}

function FormSection({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3 border-b-2 border-dashed border-slate-300 pb-2">
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-white text-[10px] font-bold font-mono shrink-0">{num}</span>
        <h2 className="font-mono text-sm font-bold text-slate-800 uppercase tracking-wider">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default async function VehiclePage({ params }: PageProps) {
  const { regnr } = await params;
  const v = await getVehicleView(regnr);
  if (!v) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    name: `${v.merke} ${v.modell}`,
    brand: { "@type": "Brand", name: v.merke },
    model: v.modell,
    vehicleIdentificationNumber: v.understellsnummer || "",
    dateVehicleFirstRegistered: v.raw.forstegangsregistrering?.registrertForstegangNorgeDato || "",
    fuelType: v.drivstoff,
    vehicleTransmission: v.girkasse || "",
    color: v.farge,
    numberOfDoors: v.antallDorer,
    seatingCapacity: v.sitteplasserTotalt,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="min-h-screen" style={{ background: "#f0ecf5" }}>
        <div className="max-w-2xl mx-auto px-4 py-10">
          {/* Paper */}
          <div className="bg-white rounded shadow-lg shadow-slate-300/40 border border-slate-200 overflow-hidden">
            {/* Header strip */}
            <div className="bg-slate-800 text-white px-6 py-4 font-mono">
              <div className="flex items-center justify-between">
                <Link href="/" className="text-sm font-bold text-white hover:text-slate-300 transition-colors tracking-wider uppercase">
                  Nytt søk
                </Link>
                <div className="text-lg font-bold tracking-wider">SKILTINFO</div>
                <div className="text-xs invisible">Nytt søk</div>
              </div>
            </div>

            {/* Perforated edge */}
            <div className="border-b-2 border-dashed border-slate-300" />

            <div className="px-6 py-6">
              {/* Identity block */}
              <div className="text-center mb-8">
                <div className="inline-block border-2 border-slate-800 px-5 py-2 rounded mb-3">
                  <span className="font-mono text-2xl font-bold tracking-[0.2em] text-slate-900">{v.plate}</span>
                </div>
                <h1 className="font-mono text-xl font-bold text-slate-800 uppercase">{v.merke} {v.modell}</h1>
                <p className="font-mono text-sm text-slate-500 mt-1">{[v.beskrivelse, v.year, v.farge].filter(Boolean).join(" / ")}</p>

                {/* Stamp */}
                <div className="mt-4 inline-block">
                  <span className={`inline-block font-mono text-xs font-bold uppercase tracking-[0.2em] px-4 py-1.5 border-2 rounded-sm ${
                    v.statusCode === "REGISTRERT" ? "border-green-600 text-green-600"
                    : v.statusCode === "VRAKET" ? "border-red-600 text-red-600"
                    : v.statusCode === "AVREGISTRERT" ? "border-amber-600 text-amber-600"
                    : "border-slate-400 text-slate-400"
                  }`} style={{ transform: "rotate(-2deg)" }}>
                    {v.statusText}
                  </span>
                </div>
              </div>

              {/* Quick stats in boxes */}
              <div className="grid grid-cols-2 gap-2 mb-8">
                {[
                  { label: "Drivstoff", value: v.drivstoff },
                  { label: "Effekt", value: v.effektKW ? `${v.effektKW} kW / ${v.effektHP} hk` : undefined },
                  { label: "Girkasse", value: v.girkasse },
                  { label: "Toppfart", value: v.maxSpeed },
                ].filter(s => s.value).map((s) => (
                  <div key={s.label} className="border border-dashed border-slate-300 px-3 py-2.5 text-center">
                    <div className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">{s.label}</div>
                    <div className="font-mono text-sm font-bold text-slate-800 mt-0.5">{s.value}</div>
                  </div>
                ))}
              </div>

              {/* EU-kontroll */}
              {v.kontrollfrist && (
                <div className={`border-2 border-dashed rounded-sm px-4 py-3 mb-8 text-center ${v.euControlOverdue ? "border-red-400 bg-red-50" : "border-green-400 bg-green-50"}`}>
                  <div className={`font-mono text-xs font-bold uppercase tracking-wider ${v.euControlOverdue ? "text-red-700" : "text-green-700"}`}>
                    EU-kontroll: {v.euControlOverdue ? "FORFALT" : "GODKJENT"}
                  </div>
                  <div className="font-mono text-xs text-slate-600 mt-1">
                    Frist: {v.kontrollfristFormatted}
                    {v.sistGodkjentFormatted && ` | Sist: ${v.sistGodkjentFormatted}`}
                  </div>
                </div>
              )}

              {/* Sections */}
              <FormSection num="01" title="Registrering">
                <DotRow label="Registreringsnr" value={v.plate} />
                <DotRow label="Understellsnr" value={v.understellsnummer} />
                <DotRow label="1. gang Norge" value={v.forstegangsregistrert} />
                <DotRow label="På eier" value={v.registrertPaEier} />
                <DotRow label="Kjøringens art" value={v.kjoringensArt} />
                <DotRow label="Klasse" value={v.kjoretoyklasse} />
                <DotRow label="Typegodkj." value={v.typegodkjenning} />
              </FormSection>

              <FormSection num="02" title="Motor og drivverk">
                <DotRow label="Drivstoff" value={v.drivstoff} />
                {v.hybrid && v.hybrid !== "Ingen" && <DotRow label="Hybrid" value={v.hybrid} />}
                <DotRow label="Motorkode" value={v.motorKode} />
                <DotRow label="Slagvolum" value={v.slagvolum} />
                <DotRow label="Effekt" value={v.effektKW ? `${v.effektKW} kW (${v.effektHP} hk)` : undefined} />
                <DotRow label="Girkasse" value={v.girkasse} />
                <DotRow label="Toppfart" value={v.maxSpeed} />
              </FormSection>

              <FormSection num="03" title="Karosseri">
                <DotRow label="Type" value={v.karosseritype} />
                <DotRow label="Farge" value={v.farge} />
                <DotRow label="Dører" value={v.antallDorer} />
                <DotRow label="Seter foran" value={v.sitteplasserForan} />
                <DotRow label="Seter totalt" value={v.sitteplasserTotalt} />
                <DotRow label="Lengde" value={v.lengde} />
                <DotRow label="Bredde" value={v.bredde} />
                <DotRow label="Høyde" value={v.hoyde} />
              </FormSection>

              <FormSection num="04" title="Vekter">
                <DotRow label="Egenvekt" value={v.egenvekt} />
                <DotRow label="Nyttelast" value={v.nyttelast} />
                <DotRow label="Totalvekt" value={v.tillattTotalvekt} />
                <DotRow label="Taklast" value={v.tillattTaklast} />
                <DotRow label="Henger m/br" value={v.tilhengervektMedBrems} />
                <DotRow label="Henger u/br" value={v.tilhengervektUtenBrems} />
                <DotRow label="Vogntog" value={v.tillattVogntogvekt} />
              </FormSection>

              <FormSection num="05" title="Miljø og utslipp">
                <DotRow label="Euroklasse" value={v.euroKlasse} />
                <DotRow label="CO2 blandet" value={v.co2Blandet} />
                <DotRow label="Forbruk blandet" value={v.forbrukBlandet} />
                <DotRow label="NOx" value={v.nox} />
                <DotRow label="CO2 vektet" value={v.co2Vektet} />
                <DotRow label="Forbruk vektet" value={v.forbrukVektet} />
              </FormSection>

              {v.dekkData.length > 0 && (
                <FormSection num="06" title="Dekk og felg">
                  {v.dekkData.map((k) => (
                    <div key={k.kombNr}>
                      {v.dekkData.length > 1 && <p className="font-mono text-[10px] text-slate-400 uppercase mt-2 mb-1">Komb. {k.kombNr}</p>}
                      {k.aksler.map((a, j) => (
                        <div key={j}>
                          <DotRow label={`A${a.akselId} dekk`} value={a.dekk} />
                          <DotRow label={`A${a.akselId} felg`} value={a.felg} />
                        </div>
                      ))}
                    </div>
                  ))}
                </FormSection>
              )}

              {v.aksler.length > 0 && (
                <FormSection num="07" title="Aksler">
                  <DotRow label="Antall" value={v.antallAksler} />
                  {v.aksler.map((a) => (
                    <div key={a.id}>
                      <DotRow label={`A${a.id} sporvidde`} value={a.sporvidde} />
                      <DotRow label={`A${a.id} maks last`} value={a.maxLast} />
                      <DotRow label={`A${a.id} drivaksel`} value={a.drivaksel} />
                    </div>
                  ))}
                </FormSection>
              )}

              {v.merknader.length > 0 && (
                <FormSection num="08" title="Merknader">
                  {v.merknader.map((m, i) => (
                    <p key={i} className="font-mono text-[13px] text-slate-600 py-1">{m}</p>
                  ))}
                </FormSection>
              )}
            </div>

            {/* Footer strip */}
            <div className="border-t-2 border-dashed border-slate-300" />
            <div className="px-6 py-4">
              <Link
                href="/"
                className="block w-full text-center bg-slate-800 text-white font-mono text-sm font-bold uppercase tracking-wider px-6 py-3 rounded-sm hover:bg-slate-700 transition-colors"
              >
                Nytt søk
              </Link>
              <div className="mt-3 text-center font-mono text-[10px] text-slate-400 uppercase tracking-wider">
                Data fra Statens vegvesen &bull; Skiltinfo er uavhengig
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
