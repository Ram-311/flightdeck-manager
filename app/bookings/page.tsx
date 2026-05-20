import { AuthPanel } from "@/components/booking/AuthPanel";
import { BookingActions } from "@/components/booking/BookingActions";
import { CacheBookings } from "@/components/booking/CacheBookings";
import { OfflineBookings } from "@/components/booking/OfflineBookings";
import { StatusBadge } from "@/components/StatusBadge";
import { createClient } from "@/lib/supabase/server";
import type { Booking, Flight } from "@/lib/types";
import { formatDateTime, formatMoney } from "@/lib/utils";

type BookingWithAlternatives = {
  booking: Booking;
  alternatives: Flight[];
};

export default async function BookingsPage() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return (
      <div className="grid gap-5">
        <div>
          <h1 className="text-3xl font-bold text-ink">My bookings</h1>
          <p className="mt-1 text-slate-600">Sign in to manage confirmed trips, reschedules, and cancellations.</p>
        </div>
        <AuthPanel />
        <section className="rounded border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-semibold text-ink">Offline cached bookings</h2>
          <OfflineBookings />
        </section>
      </div>
    );
  }

  const { data, error } = await supabase
    .from("bookings")
    .select("*, flights(*), seats(*), passengers(*)")
    .order("booked_at", { ascending: false });

  const bookings = (data ?? []) as Booking[];
  const enriched: BookingWithAlternatives[] = await Promise.all(
    bookings.map(async (booking) => {
      const flight = booking.flights;
      if (!flight) {
        return { booking, alternatives: [] };
      }

      const { data: alternativesData } = await supabase
        .from("flights")
        .select("*")
        .eq("origin", flight.origin)
        .eq("destination", flight.destination)
        .neq("id", flight.id)
        .neq("status", "cancelled")
        .gte("departs_at", new Date().toISOString())
        .order("departs_at", { ascending: true });

      return { booking, alternatives: (alternativesData ?? []) as Flight[] };
    })
  );

  return (
    <div className="grid gap-5">
      <CacheBookings bookings={bookings} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-ink">My bookings</h1>
          <p className="mt-1 text-slate-600">Review PNRs, change flights on the same route, or cancel eligible trips.</p>
        </div>
        <AuthPanel />
      </div>

      {error ? <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error.message}</p> : null}

      <div className="grid gap-4">
        {enriched.length === 0 ? (
          <div className="rounded border border-slate-200 bg-white p-6 text-slate-600">No bookings yet.</div>
        ) : (
          enriched.map(({ booking, alternatives }) => (
            <article key={booking.id} className="rounded border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-semibold text-ink">{booking.pnr_code}</h2>
                    <StatusBadge status={booking.status} />
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    {booking.flights?.flight_no} - {booking.flights?.origin} to {booking.flights?.destination}
                  </p>
                  <p className="text-sm text-slate-600">
                    {booking.flights ? formatDateTime(booking.flights.departs_at) : "Flight pending"} - Seat{" "}
                    {booking.seats?.seat_number ?? "pending"}
                  </p>
                </div>
                <p className="text-lg font-semibold text-runway">{formatMoney(booking.total_price)}</p>
              </div>

              {booking.passengers?.length ? (
                <div className="mt-4 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                  {booking.passengers.map((passenger) => (
                    <p key={passenger.id} className="rounded bg-cloud px-3 py-2">
                      {passenger.full_name} - {passenger.nationality}
                    </p>
                  ))}
                </div>
              ) : null}

              <BookingActions booking={booking} alternatives={alternatives} />
            </article>
          ))
        )}
      </div>
    </div>
  );
}
