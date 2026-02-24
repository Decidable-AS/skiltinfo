import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Skiltinfo - Kjøretøyinformasjon for norske kjøretøy",
    template: "%s",
  },
  description:
    "Søk opp detaljert kjøretøyinformasjon med registreringsnummer. Tekniske data, motor, vekt, EU-kontroll, utslipp og mer fra Statens vegvesen.",
  keywords: [
    "kjøretøyoppslag",
    "registreringsnummer",
    "biloppslag",
    "vegvesen",
    "EU-kontroll",
    "kjøretøydata",
    "bilinfo",
    "norske biler",
    "skiltinfo",
  ],
  openGraph: {
    type: "website",
    locale: "nb_NO",
    siteName: "Skiltinfo",
    title: "Skiltinfo - Kjøretøyinformasjon for norske kjøretøy",
    description:
      "Søk opp detaljert kjøretøyinformasjon med registreringsnummer. Tekniske data, motor, vekt, EU-kontroll, utslipp og mer.",
  },
  twitter: {
    card: "summary",
    title: "Skiltinfo - Kjøretøyinformasjon for norske kjøretøy",
    description:
      "Søk opp detaljert kjøretøyinformasjon med registreringsnummer.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nb">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <footer className="py-4 text-center font-mono text-[11px] text-slate-400">
          Laget av{" "}
          <a
            href="https://decidable.no"
            className="underline hover:text-slate-600 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            Decidable AS
          </a>
        </footer>
        <Script
          src="https://umami.decidable.no/script.js"
          data-website-id="3c0cf6e7-8a24-4c6f-992a-696aad24e70a"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
