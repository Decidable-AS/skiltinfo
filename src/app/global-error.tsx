"use client";

import { useEffect } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { ErrorScreen } from "@/components/error-screen";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

interface GlobalErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalErrorPage({ error, reset }: GlobalErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="nb">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ErrorScreen
          title="Bilskiltnummer er midlertidig utilgjengelig"
          message="Applikasjonen traff en uventet feil før siden kunne vises."
          details="Prøv igjen om litt. Hvis feilen fortsetter, jobber vi sannsynligvis allerede med saken."
          onReset={reset}
        />
      </body>
    </html>
  );
}
