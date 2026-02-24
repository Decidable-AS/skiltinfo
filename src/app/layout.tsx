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
    default: "Skiltinfo - Kjoretoyinformasjon for norske kjoretoy",
    template: "%s",
  },
  description:
    "Sok opp detaljert kjoretoyinformasjon med registreringsnummer. Tekniske data, motor, vekt, EU-kontroll, utslipp og mer fra Statens vegvesen.",
  keywords: [
    "kjoretoyoppslag",
    "registreringsnummer",
    "biloppslag",
    "vegvesen",
    "EU-kontroll",
    "kjoretoydata",
    "bilinfo",
    "norske biler",
    "skiltinfo",
  ],
  openGraph: {
    type: "website",
    locale: "nb_NO",
    siteName: "Skiltinfo",
    title: "Skiltinfo - Kjoretoyinformasjon for norske kjoretoy",
    description:
      "Sok opp detaljert kjoretoyinformasjon med registreringsnummer. Tekniske data, motor, vekt, EU-kontroll, utslipp og mer.",
  },
  twitter: {
    card: "summary",
    title: "Skiltinfo - Kjoretoyinformasjon for norske kjoretoy",
    description:
      "Sok opp detaljert kjoretoyinformasjon med registreringsnummer.",
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
        <Script
          src="https://umami.decidable.no/script.js"
          data-website-id="3c0cf6e7-8a24-4c6f-992a-696aad24e70a"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
