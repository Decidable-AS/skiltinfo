"use client";

import Link from "next/link";

interface ErrorScreenProps {
  title?: string;
  message?: string;
  details?: string;
  resetLabel?: string;
  onReset?: () => void;
  showHomeLink?: boolean;
}

export function ErrorScreen({
  title = "Noe gikk galt",
  message = "Vi klarte ikke å laste kjøretøyinformasjonen akkurat nå.",
  details = "Prøv igjen om et øyeblikk. Hvis feilen fortsetter, kan det skyldes midlertidige problemer hos datakilden.",
  resetLabel = "Prøv igjen",
  onReset,
  showHomeLink = true,
}: ErrorScreenProps) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10" style={{ background: "#f0ecf5" }}>
      <div className="w-full max-w-lg">
        <div className="bg-white rounded shadow-lg shadow-slate-300/40 border border-slate-200 overflow-hidden">
          <div className="bg-slate-800 text-white px-6 py-4 font-mono">
            <div className="flex items-center justify-between gap-3">
              {showHomeLink ? (
                <Link href="/" className="text-sm font-bold text-white hover:text-slate-300 transition-colors tracking-wider uppercase">
                  Nytt søk
                </Link>
              ) : (
                <div className="text-xs invisible">Nytt søk</div>
              )}
              <div className="text-lg font-bold tracking-wider">SKILTINFO</div>
              <div className="text-xs invisible">Nytt søk</div>
            </div>
          </div>

          <div className="border-b-2 border-dashed border-slate-300" />

          <div className="px-6 py-10 text-center">
            <div className="inline-block border-2 border-dashed border-amber-400 rounded-sm px-6 py-3 mb-6 bg-amber-50">
              <span className="font-mono text-xs font-bold text-amber-700 uppercase tracking-[0.2em]">
                Midlertidig feil
              </span>
            </div>

            <h1 className="font-mono text-lg font-bold text-slate-800 uppercase mb-3">
              {title}
            </h1>
            <p className="font-mono text-sm text-slate-600 mb-3">
              {message}
            </p>
            <p className="font-mono text-xs text-slate-400 max-w-md mx-auto leading-6">
              {details}
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              {onReset && (
                <button
                  type="button"
                  onClick={onReset}
                  className="bg-slate-800 text-white font-mono text-sm font-bold uppercase tracking-wider px-6 py-3 rounded-sm hover:bg-slate-700 active:bg-slate-900 transition-colors"
                >
                  {resetLabel}
                </button>
              )}

              {showHomeLink && (
                <Link
                  href="/"
                  className="border border-slate-300 text-slate-700 font-mono text-sm font-bold uppercase tracking-wider px-6 py-3 rounded-sm hover:bg-slate-50 transition-colors"
                >
                  Gå til forsiden
                </Link>
              )}
            </div>
          </div>

          <div className="border-t-2 border-dashed border-slate-300" />
          <div className="px-6 py-3 text-center font-mono text-[10px] text-slate-400 uppercase tracking-wider">
            Data fra Statens vegvesen &bull; Skiltinfo er uavhengig
          </div>
        </div>
      </div>
    </main>
  );
}
