"use client";

import { useEffect } from "react";
import { ErrorScreen } from "@/components/error-screen";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorScreen
      title="Kunne ikke laste siden"
      message="Det oppstod en feil mens vi hentet informasjonen du ba om."
      details="Prøv å laste siden på nytt. Hvis problemet vedvarer, kan tjenesten hos Statens vegvesen eller Skiltinfo være midlertidig utilgjengelig."
      onReset={reset}
    />
  );
}
