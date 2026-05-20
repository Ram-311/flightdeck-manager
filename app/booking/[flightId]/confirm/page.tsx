import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, formatMoney } from "@/lib/utils";
import type { Booking } from "@/lib/types";

export default async function ConfirmationPage({ searchParams }: { searchParams: { booking?: string } }) {
  const supabase = createClient();
  const { data } = searchParams.booking
    ? await supabase.from("bookings").select("*, flights(*), seats(*), passengers(*)").eq("id", searchParams.booking).single()
    : { data: null };
  const booking = data as Booking | null;

  return (
    <div className="mx-auto max-w-3xl rounded border border-slate-200 bg-white p-6 text-center shadow-panel">
      <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" />
      <h1 className="mt-4 text-3xl font-bold text-ink">Booking confirmed</h1>
      {booking ? (
        <div className="mt-5 grid gap-3 text-left">
          <div className="rounded bg-cloud p-4 text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">PNR</p>
            <p className="text-4xl font-bold text-runway">{booking.pnr_code}</p>
          </div>
          <p>
            <strong>Flight:</strong> {booking.flights?.flight_no} from {booking.flights?.origin} to {booking.flights?.destination}
          </p>
          <p><strong>Departure:</strong> {booking.flights ? formatDateTime(booking.flights.departs_at) : "Pending"}</p>
          <p><strong>Seat:</strong> {booking.seats?.seat_number} ({booking.seats?.class})</p>
          <p><strong>Total:</strong> {formatMoney(booking.total_price)}</p>
        </div>
      ) : (
        <p className="mt-4 text-slate-600">Your booking was created. Open My Bookings to view the itinerary.</p>
      )}
      <Link href="/bookings" className="focus-ring mt-6 inline-flex rounded bg-runway px-5 py-3 font-semibold text-white">
        View my bookings
      </Link>
    </div>
  );
}
