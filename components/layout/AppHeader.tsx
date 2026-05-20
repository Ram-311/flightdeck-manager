import Link from "next/link";
import { Plane, TicketCheck } from "lucide-react";

export function AppHeader() {
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 font-semibold text-ink">
          <span className="grid h-10 w-10 place-items-center rounded bg-runway text-white">
            <Plane className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-lg">FlightDeck</span>
        </Link>
        <nav className="flex items-center gap-2 text-sm font-medium">
          <Link className="rounded px-3 py-2 text-slate-700 hover:bg-slate-100" href="/results">
            Search
          </Link>
          <Link className="inline-flex items-center gap-2 rounded bg-ink px-3 py-2 text-white hover:bg-runway" href="/bookings">
            <TicketCheck className="h-4 w-4" aria-hidden="true" />
            Trips
          </Link>
        </nav>
      </div>
    </header>
  );
}
