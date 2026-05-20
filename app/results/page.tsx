import { FlightCard } from "@/components/flight/FlightCard";
import { SearchForm } from "@/components/booking/SearchForm";
import { createClient } from "@/lib/supabase/server";
import type { Flight } from "@/lib/types";

type ResultsPageProps = {
  searchParams: {
    origin?: string;
    destination?: string;
    date?: string;
  };
};

export default async function ResultsPage({ searchParams }: ResultsPageProps) {
  const supabase = createClient();
  let query = supabase.from("flights").select("*").neq("status", "cancelled").order("departs_at", { ascending: true });

  if (searchParams.origin) {
    query = query.eq("origin", searchParams.origin);
  }
  if (searchParams.destination) {
    query = query.eq("destination", searchParams.destination);
  }
  if (searchParams.date) {
    const start = new Date(`${searchParams.date}T00:00:00`);
    const end = new Date(`${searchParams.date}T23:59:59`);
    query = query.gte("departs_at", start.toISOString()).lte("departs_at", end.toISOString());
  }

  const { data, error } = await query;
  const flights = (data ?? []) as Flight[];

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-3xl font-bold text-ink">Flight search</h1>
        <p className="mt-1 text-slate-600">Compare route, duration, aircraft, and fare classes.</p>
      </div>
      <SearchForm />
      {error ? <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error.message}</p> : null}
      <div className="grid gap-3">
        {flights.length === 0 ? (
          <div className="rounded border border-slate-200 bg-white p-6 text-slate-600">No matching flights. Try another route or date.</div>
        ) : (
          flights.map((flight) => <FlightCard key={flight.id} flight={flight} />)
        )}
      </div>
    </div>
  );
}
