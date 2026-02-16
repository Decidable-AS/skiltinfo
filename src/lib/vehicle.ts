import { fetchVehicle } from "./api";
import {
  formatDate,
  formatWeight,
  formatSpeed,
  formatFuelConsumption,
  formatCO2,
  formatPlate,
  formatNumber,
  getRegistrationStatusText,
  isEUControlOverdue,
} from "./utils";
import type { KjoretoyData } from "./types";

/** Pre-parsed vehicle data for use in page components */
export interface VehicleView {
  raw: KjoretoyData;
  plate: string;
  merke: string;
  modell: string;
  year: string;
  farge: string;
  statusCode: string | undefined;
  statusText: string;
  beskrivelse: string;
  // Motor
  drivstoff: string;
  effektKW: number | undefined;
  effektHP: number | undefined;
  slagvolum: string | undefined;
  motorKode: string | undefined;
  girkasse: string | undefined;
  maxSpeed: string | undefined;
  hybrid: string | undefined;
  // Karosseri
  karosseritype: string;
  antallDorer: number | undefined;
  sitteplasserForan: number | undefined;
  sitteplasserTotalt: number | undefined;
  lengde: string | undefined;
  bredde: string | undefined;
  hoyde: string | undefined;
  // Vekter
  egenvekt: string;
  nyttelast: string;
  tillattTotalvekt: string;
  tillattTaklast: string;
  tilhengervektMedBrems: string;
  tilhengervektUtenBrems: string;
  tillattVogntogvekt: string;
  vertikalKoplingslast: string;
  // Miljo
  euroKlasse: string;
  co2Blandet: string | undefined;
  forbrukBlandet: string | undefined;
  nox: string | undefined;
  co2Vektet: string | undefined;
  forbrukVektet: string | undefined;
  // Registrering
  understellsnummer: string | undefined;
  forstegangsregistrert: string;
  registrertPaEier: string;
  kjoringensArt: string | undefined;
  kjoretoyklasse: string | undefined;
  typegodkjenning: string | undefined;
  // EU-kontroll
  kontrollfrist: string | undefined;
  kontrollfristFormatted: string | undefined;
  sistGodkjent: string | undefined;
  sistGodkjentFormatted: string | undefined;
  euControlOverdue: boolean;
  // Dekk
  dekkData: {
    kombNr: number;
    aksler: { akselId: number | undefined; dekk: string | undefined; felg: string | undefined }[];
  }[];
  // Aksler
  antallAksler: number | undefined;
  aksler: { id: number | undefined; sporvidde: string | undefined; maxLast: string; drivaksel: string | undefined }[];
  // Merknader
  merknader: string[];
}

export async function getVehicleView(regnr: string): Promise<VehicleView | null> {
  const vehicle = await fetchVehicle(regnr);
  if (!vehicle) return null;

  const tech = vehicle.godkjenning?.tekniskGodkjenning?.tekniskeData;
  const generelt = tech?.generelt;
  const klassifisering = vehicle.godkjenning?.tekniskGodkjenning?.kjoretoyklassifisering;
  const reg = vehicle.registrering;
  const motor = tech?.motorOgDrivverk;
  const miljo = tech?.miljodata;
  const vekter = tech?.vekter;
  const karosseri = tech?.karosseriOgLasteplan;
  const dimensjoner = tech?.dimensjoner;
  const persontall = tech?.persontall;
  const dekk = tech?.dekkOgFelg;
  const pkk = vehicle.periodiskKjoretoyKontroll;
  const forbruk = miljo?.miljoOgdrivstoffGruppe?.[0]?.forbrukOgUtslipp?.[0];

  const effekt = motor?.motor?.[0]?.drivstoff?.[0]?.maksNettoEffekt;
  const slagvolum = motor?.motor?.[0]?.slagvolum;
  const maxSpeedRaw = motor?.maksimumHastighet?.[0];

  const dekkData: VehicleView["dekkData"] = [];
  dekk?.akselDekkOgFelgKombinasjon?.forEach((kombi, i) => {
    const aksler = kombi.akselDekkOgFelg?.map((adf) => ({
      akselId: adf.akselId,
      dekk: adf.dekkdimensjon,
      felg: adf.felgdimensjon,
    })) || [];
    dekkData.push({ kombNr: i + 1, aksler });
  });

  const aksler: VehicleView["aksler"] = [];
  tech?.akslinger?.akselGruppe?.forEach((gruppe) => {
    gruppe.akselListe?.aksel?.forEach((aksel) => {
      aksler.push({
        id: aksel.id,
        sporvidde: aksel.sporvidde ? `${aksel.sporvidde} mm` : undefined,
        maxLast: formatWeight(aksel.tekniskTillattAkselLast),
        drivaksel: aksel.drivAksel !== undefined ? (aksel.drivAksel ? "Ja" : "Nei") : undefined,
      });
    });
  });

  return {
    raw: vehicle,
    plate: formatPlate(vehicle.kjoretoyId?.kjennemerke || regnr.toUpperCase()),
    merke: generelt?.merke?.[0]?.merke || "Ukjent",
    modell: generelt?.handelsbetegnelse?.[0] || "",
    year: vehicle.forstegangsregistrering?.registrertForstegangNorgeDato?.slice(0, 4) || "",
    farge: karosseri?.rFarge?.[0]?.kodeNavn || "",
    statusCode: reg?.registreringsstatus?.kodeVerdi,
    statusText: getRegistrationStatusText(reg?.registreringsstatus?.kodeVerdi),
    beskrivelse: klassifisering?.beskrivelse || "",
    drivstoff: motor?.motor?.[0]?.drivstoff?.[0]?.drivstoffKode?.kodeNavn || "",
    effektKW: effekt,
    effektHP: effekt ? Math.round(effekt * 1.36) : undefined,
    slagvolum: slagvolum ? `${formatNumber(slagvolum)} ccm` : undefined,
    motorKode: motor?.motor?.[0]?.motorKode,
    girkasse: motor?.girkassetype?.kodeNavn,
    maxSpeed: maxSpeedRaw ? formatSpeed(maxSpeedRaw) : undefined,
    hybrid: motor?.hybridKategori?.kodeNavn,
    karosseritype: karosseri?.karosseritype?.kodeNavn || "",
    antallDorer: karosseri?.antallDorer?.[0],
    sitteplasserForan: persontall?.sitteplasserForan,
    sitteplasserTotalt: persontall?.sitteplasserTotalt,
    lengde: dimensjoner?.lengde ? `${dimensjoner.lengde} mm` : undefined,
    bredde: dimensjoner?.bredde ? `${dimensjoner.bredde} mm` : undefined,
    hoyde: dimensjoner?.hoyde ? `${dimensjoner.hoyde} mm` : undefined,
    egenvekt: formatWeight(vekter?.egenvekt),
    nyttelast: formatWeight(vekter?.nyttelast),
    tillattTotalvekt: formatWeight(vekter?.tillattTotalvekt),
    tillattTaklast: formatWeight(vekter?.tillattTaklast),
    tilhengervektMedBrems: formatWeight(vekter?.tillattTilhengervektMedBrems),
    tilhengervektUtenBrems: formatWeight(vekter?.tillattTilhengervektUtenBrems),
    tillattVogntogvekt: formatWeight(vekter?.tillattVogntogvekt),
    vertikalKoplingslast: formatWeight(vekter?.tillattVertikalKoplingslast),
    euroKlasse: miljo?.euroKlasse?.kodeNavn || "",
    co2Blandet: forbruk?.co2BlandetKjoring ? formatCO2(forbruk.co2BlandetKjoring) : undefined,
    forbrukBlandet: forbruk?.forbrukBlandetKjoring ? formatFuelConsumption(forbruk.forbrukBlandetKjoring) : undefined,
    nox: forbruk?.utslippNOxMgPrKm ? `${forbruk.utslippNOxMgPrKm} mg/km` : undefined,
    co2Vektet: forbruk?.co2Vektet ? formatCO2(forbruk.co2Vektet) : undefined,
    forbrukVektet: forbruk?.forbrukVektet ? formatFuelConsumption(forbruk.forbrukVektet) : undefined,
    understellsnummer: vehicle.kjoretoyId?.understellsnummer,
    forstegangsregistrert: formatDate(vehicle.forstegangsregistrering?.registrertForstegangNorgeDato),
    registrertPaEier: formatDate(reg?.registrertForstegangPaEierskap),
    kjoringensArt: reg?.kjoringensArt?.kodeNavn,
    kjoretoyklasse: klassifisering?.tekniskKode?.kodeNavn,
    typegodkjenning: klassifisering?.efTypegodkjenning?.typegodkjenningNrTekst,
    kontrollfrist: pkk?.kontrollfrist,
    kontrollfristFormatted: pkk?.kontrollfrist ? formatDate(pkk.kontrollfrist) : undefined,
    sistGodkjent: pkk?.sistGodkjent,
    sistGodkjentFormatted: pkk?.sistGodkjent ? formatDate(pkk.sistGodkjent) : undefined,
    euControlOverdue: isEUControlOverdue(pkk?.kontrollfrist),
    dekkData,
    antallAksler: tech?.akslinger?.antallAksler,
    aksler,
    merknader: vehicle.godkjenning?.kjoretoymerknad?.map((m) => m.merknad || "").filter(Boolean) || [],
  };
}
