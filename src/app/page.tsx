"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [regnr, setRegnr] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const cleaned = regnr.trim().replace(/[\s-]/g, "").toUpperCase();

    if (!cleaned) {
      setError("Skriv inn et registreringsnummer");
      return;
    }

    if (!/^[A-Z]{2}\d{4,5}$/.test(cleaned)) {
      setError("Ugyldig format. Bruk f.eks. AB12345 eller EK12345");
      return;
    }

    setError("");
    router.push(`/${cleaned}`);
  }

  return (
    <main className="min-h-screen flex flex-col" style={{ background: "#f0ecf5" }}>
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-lg">
          {/* Paper */}
          <div className="bg-white rounded shadow-lg shadow-slate-300/40 border border-slate-200 overflow-hidden">
            {/* Header strip */}
            <div className="bg-slate-800 text-white px-6 py-4 font-mono text-center">
              <div className="text-lg font-bold tracking-wider">SKILTINFO</div>
            </div>

            {/* Perforated edge */}
            <div className="border-b-2 border-dashed border-slate-300" />

            <div className="px-6 py-8">
              {/* Title */}
              <div className="text-center mb-8">
                <p className="font-mono text-sm text-slate-500 mb-1">
                  Søk opp kjøretøyinformasjon
                </p>
                <p className="font-mono text-xs text-slate-400">
                  Skriv inn registreringsnummer for å starte
                </p>
              </div>

              {/* Search form */}
              <form onSubmit={handleSubmit}>
                <div className="border-2 border-dashed border-slate-300 rounded-sm p-4 mb-4">
                  <label className="font-mono text-[10px] text-slate-400 uppercase tracking-wider block mb-2">
                    Registreringsnummer
                  </label>
                  <input
                    type="text"
                    value={regnr}
                    onChange={(e) => {
                      setRegnr(e.target.value.toUpperCase());
                      setError("");
                    }}
                    placeholder="AB 12345"
                    maxLength={7}
                    className="w-full font-mono text-2xl font-bold tracking-[0.2em] text-slate-900 text-center py-2 bg-transparent placeholder:text-slate-300 placeholder:tracking-normal placeholder:font-normal placeholder:text-lg focus:outline-none"
                    autoFocus
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                  />
                </div>

                {error && (
                  <p className="font-mono text-xs text-red-600 text-center mb-4">{error}</p>
                )}

                <button
                  type="submit"
                  className="w-full bg-slate-800 text-white font-mono text-sm font-bold uppercase tracking-wider py-3 rounded-sm hover:bg-slate-700 active:bg-slate-900 transition-colors"
                >
                  Søk
                </button>
              </form>

              {/* Info */}
              <div className="border-t-2 border-dashed border-slate-300 mt-8 pt-6">
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    { label: "Teknisk info", desc: "Motor, vekt, mål" },
                    { label: "Miljødata", desc: "Utslipp, forbruk" },
                    { label: "EU-kontroll", desc: "Frist, status" },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="font-mono text-xs font-bold text-slate-700">{item.label}</div>
                      <div className="font-mono text-[10px] text-slate-400 mt-0.5">{item.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer strip */}
            <div className="border-t-2 border-dashed border-slate-300" />
            <div className="px-6 py-3 text-center font-mono text-[10px] text-slate-400 uppercase tracking-wider">
              Data fra Statens vegvesen &bull; Skiltinfo er uavhengig
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
