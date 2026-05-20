import { notFound } from "next/navigation";
import { PassengerForm } from "@/components/booking/PassengerForm";
import { SeatMap } from "@/components/booking/SeatMap";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, formatDuration, formatMoney } from "@/lib/utils";
import type { Flight, Seat } from "@/lib/types";

export default async function BookingPage({ params }: { params: { flightId: string } }) {
  const supabase = createClient();
  const [{ data: flightData }, { data: seatsData }] = await Promise.all([
    supabase.from("flights").select("*").eq("id", params.flightId).single(),
    supabase.from("seats").select("*").eq("flight_id", params.flightId).order("seat_number", { ascending: true })
  ]);

  if (!flightData) {
    notFound();
  }

  const flight = flightData as Flight;
  const seats = (seatsData ?? []) as Seat[];
  const firstAvailable = seats.find((seat) => seat.is_available) ?? null;

  return (
    <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
      <section className="grid gap-4">
        <div className="rounded border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-runway">{flight.flight_no}</p>
          <h1 className="mt-2 text-3xl font-bold text-ink">
            {flight.origin} to {flight.destination}
          </h1>
          <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-4">
            <span>{formatDateTime(flight.departs_at)}</span>
            <span>{formatDuration(flight.departs_at, flight.arrives_at)}</span>
            <span>{flight.aircraft_type}</span>
            <span>Base {formatMoney(flight.base_price)}</span>
          </div>
        </div>
        <SeatMap flightId={flight.id} initialSeats={seats} />
      </section>
      <PassengerForm flight={flight} defaultSeat={firstAvailable} />
    </div>
  );
}
