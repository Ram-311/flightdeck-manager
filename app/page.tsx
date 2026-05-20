import { AuthPanel } from "@/components/booking/AuthPanel";
import { SearchForm } from "@/components/booking/SearchForm";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, formatMoney } from "@/lib/utils";
import type { Flight } from "@/lib/types";

export default async function HomePage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("flights")
    .select("*")
    .eq("status", "scheduled")
    .gte("departs_at", new Date().toISOString())
    .order("departs_at", { ascending: true })
    .limit(3);
  const flights = (data ?? []) as Flight[];

  return (
    <div className="grid gap-6">
      <section className="overflow-hidden rounded border border-slate-200 bg-white shadow-panel">
        <div className="grid min-h-[360px] gap-6 bg-[linear-gradient(120deg,rgba(20,92,100,.92),rgba(23,32,42,.84)),url('/hero-airport.svg')] bg-cover bg-center p-5 text-white md:p-8">
          <div className="max-w-3xl self-end">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-100">Flight management</p>
            <h1 className="mt-3 text-4xl font-bold leading-tight md:text-6xl">FlightDeck Manager</h1>
            <p className="mt-3 max-w-2xl text-base text-slate-100 md:text-lg">
              Search flights, pick live seats, reserve safely, and manage itinerary changes from one responsive app.
            </p>
          </div>
        </div>
        <div className="-mt-10 px-4 pb-5 md:px-8">
          <SearchForm />
        </div>
      </section>

      <AuthPanel />

      <section className="grid gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-ink">Next departures</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {flights.map((flight) => (
            <article key={flight.id} className="rounded border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-runway">{flight.flight_no}</p>
              <h3 className="mt-2 text-lg font-semibold">
                {flight.origin} to {flight.destination}
              </h3>
              <p className="mt-2 text-sm text-slate-600">{formatDateTime(flight.departs_at)}</p>
              <p className="mt-3 font-semibold">{formatMoney(flight.base_price)}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
