import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: "#f0ecf5" }}>
      <div className="max-w-lg w-full mx-4">
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

          <div className="border-b-2 border-dashed border-slate-300" />

          <div className="px-6 py-10 text-center">
            <div className="inline-block border-2 border-dashed border-red-400 rounded-sm px-6 py-3 mb-6">
              <span className="font-mono text-xs font-bold text-red-600 uppercase tracking-[0.2em]">
                Ikke funnet
              </span>
            </div>

            <h1 className="font-mono text-lg font-bold text-slate-800 uppercase mb-2">
              Kjøretøy ikke funnet
            </h1>
            <p className="font-mono text-sm text-slate-500 mb-8">
              Vi fant ingen kjøretøy med dette registreringsnummeret.
              Sjekk at du har skrevet riktig og prøv igjen.
            </p>

            <Link
              href="/"
              className="inline-block bg-slate-800 text-white font-mono text-sm font-bold uppercase tracking-wider px-6 py-3 rounded-sm hover:bg-slate-700 transition-colors"
            >
              Nytt søk
            </Link>
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
