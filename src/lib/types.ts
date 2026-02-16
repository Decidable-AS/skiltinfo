export interface KodeVerdi {
  kodeBeskrivelse?: string;
  kodeNavn?: string;
  kodeVerdi?: string;
  kodeTypeId?: string;
  tidligereKodeVerdi?: string[];
}

export interface Kjennemerke {
  fomTidspunkt?: string;
  kjennemerke?: string;
  kjennemerkekategori?: string;
  kjennemerketype?: KodeVerdi;
}

export interface Registrering {
  fomTidspunkt?: string;
  kjoringensArt?: KodeVerdi;
  registreringsstatus?: KodeVerdi;
  registrertForstegangPaEierskap?: string;
}

export interface ForstegangsRegistrering {
  registrertForstegangNorgeDato?: string;
}

export interface Aksel {
  avstandTilNesteAksling?: number;
  drivAksel?: boolean;
  id?: number;
  plasseringAksel?: string;
  sporvidde?: number;
  tekniskTillattAkselLast?: number;
}

export interface AkselGruppe {
  akselListe?: { aksel?: Aksel[] };
  id?: number;
  plasseringAkselGruppe?: string;
  tekniskTillattAkselGruppeLast?: number;
}

export interface Akslinger {
  akselGruppe?: AkselGruppe[];
  antallAksler?: number;
}

export interface AkselDekkOgFelg {
  akselId?: number;
  belastningskodeDekk?: string;
  dekkdimensjon?: string;
  felgdimensjon?: string;
  hastighetskodeDekk?: string;
  innpress?: string;
}

export interface DekkOgFelg {
  akselDekkOgFelgKombinasjon?: {
    akselDekkOgFelg?: AkselDekkOgFelg[];
  }[];
}

export interface Dimensjoner {
  bredde?: number;
  lengde?: number;
  hoyde?: number;
}

export interface Merke {
  merke?: string;
  merkeKode?: string;
}

export interface Generelt {
  fabrikant?: string[];
  handelsbetegnelse?: string[];
  merke?: Merke[];
  tekniskKode?: KodeVerdi;
  typebetegnelse?: string;
}

export interface KarosseriOgLasteplan {
  antallDorer?: number[];
  karosseritype?: KodeVerdi;
  rFarge?: KodeVerdi[];
  kjoringSide?: string;
  oppbygningUnderstellsnummer?: string;
  plasseringAvDorer?: KodeVerdi;
  dorUtforming?: KodeVerdi[];
  kjennemerketypeBak?: KodeVerdi;
  kjennemerkestorrelseBak?: KodeVerdi;
  kjennemerketypeForan?: KodeVerdi;
  kjennemerkestorrelseForan?: KodeVerdi;
  plasseringFabrikasjonsplate?: KodeVerdi[];
  plasseringUnderstellsnummer?: KodeVerdi[];
}

export interface ForbrukOgUtslipp {
  co2BlandetKjoring?: number;
  forbrukBlandetKjoring?: number;
  malemetode?: KodeVerdi;
  utslippNOxMgPrKm?: number;
  co2Vektet?: number;
  forbrukVektet?: number;
}

export interface MiljoOgDrivstoffGruppe {
  drivstoffKodeMiljodata?: KodeVerdi;
  forbrukOgUtslipp?: ForbrukOgUtslipp[];
  lyd?: {
    standstoy?: number;
    stoyMalingOppgittAv?: KodeVerdi;
    vedAntallOmdreininger?: number;
  };
}

export interface Miljodata {
  euroKlasse?: KodeVerdi;
  miljoOgdrivstoffGruppe?: MiljoOgDrivstoffGruppe[];
  okoInnovasjon?: boolean;
}

export interface Drivstoff {
  drivstoffKode?: KodeVerdi;
  maksNettoEffekt?: number;
}

export interface Motor {
  drivstoff?: Drivstoff[];
  motorKode?: string;
  slagvolum?: number;
}

export interface MotorOgDrivverk {
  girkassetype?: KodeVerdi;
  hybridKategori?: KodeVerdi;
  maksimumHastighet?: number[];
  motor?: Motor[];
  girutvekslingPrGir?: unknown[];
  maksimumHastighetMalt?: number[];
}

export interface Persontall {
  sitteplasserForan?: number;
  sitteplasserTotalt?: number;
}

export interface Vekter {
  egenvekt?: number;
  egenvektMinimum?: number;
  nyttelast?: number;
  tillattTaklast?: number;
  tillattTilhengervektMedBrems?: number;
  tillattTilhengervektUtenBrems?: number;
  tillattTotalvekt?: number;
  tillattVertikalKoplingslast?: number;
  tillattVogntogvekt?: number;
  vogntogvektAvhBremsesystem?: unknown[];
}

export interface TekniskeData {
  akslinger?: Akslinger;
  dekkOgFelg?: DekkOgFelg;
  dimensjoner?: Dimensjoner;
  generelt?: Generelt;
  karosseriOgLasteplan?: KarosseriOgLasteplan;
  miljodata?: Miljodata;
  motorOgDrivverk?: MotorOgDrivverk;
  persontall?: Persontall;
  vekter?: Vekter;
  bremser?: unknown;
  tilhengerkopling?: unknown;
  ovrigeTekniskeData?: unknown[];
}

export interface Kjoretoyklassifisering {
  beskrivelse?: string;
  efTypegodkjenning?: {
    typegodkjenningNrTekst?: string;
    variant?: string;
    versjon?: string;
  };
  kjoretoyAvgiftsKode?: KodeVerdi;
  nasjonalGodkjenning?: {
    nasjonaltGodkjenningsAr?: string;
    nasjonaltGodkjenningsHovednummer?: string;
    nasjonaltGodkjenningsUndernummer?: string;
  };
  spesielleKjennetegn?: string;
  tekniskKode?: KodeVerdi;
  iSamsvarMedTypegodkjenning?: boolean;
}

export interface TekniskGodkjenning {
  godkjenningsId?: string;
  gyldigFraDato?: string;
  kjoretoyklassifisering?: Kjoretoyklassifisering;
  tekniskeData?: TekniskeData;
  unntak?: unknown[];
}

export interface Godkjenning {
  forstegangsGodkjenning?: {
    forstegangRegistrertDato?: string;
    godkjenningsId?: string;
    gyldigFraDato?: string;
  };
  kjoretoymerknad?: { merknad?: string; merknadtypeKode?: string }[];
  tekniskGodkjenning?: TekniskGodkjenning;
  tilleggsgodkjenninger?: unknown[];
}

export interface PeriodiskKjoretoyKontroll {
  kontrollfrist?: string;
  sistGodkjent?: string;
}

export interface KjoretoyData {
  kjoretoyId?: {
    kjennemerke?: string;
    understellsnummer?: string;
  };
  forstegangsregistrering?: ForstegangsRegistrering;
  kjennemerke?: Kjennemerke[];
  registrering?: Registrering;
  godkjenning?: Godkjenning;
  periodiskKjoretoyKontroll?: PeriodiskKjoretoyKontroll;
}

export interface VegvesenResponse {
  kjoretoydataListe?: KjoretoyData[];
}
