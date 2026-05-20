"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Trash2 } from "lucide-react";
import type { Booking, Flight } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { formatDateTime, formatMoney } from "@/lib/utils";
import { useFlightStore } from "@/store/useFlightStore";
import { useUserStore } from "@/store/useUserStore";

export function BookingActions({ booking, alternatives }: { booking: Booking; alternatives: Flight[] }) {
  const router = useRouter();
  const [selectedFlightId, setSelectedFlightId] = useState(alternatives[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const resetBooking = useFlightStore((state) => state.resetBooking);
  const setCachedBookings = useUserStore((state) => state.setCachedBookings);

  async function refreshCachedBookings() {
    const supabase = createClient();
    const { data } = await supabase
      .from("bookings")
      .select("*, flights(*), seats(*), passengers(*)")
      .order("booked_at", { ascending: false });
    if (data) {
      setCachedBookings(data as Booking[]);
    }
  }

  return (
    <div className="mt-4 grid gap-3 border-t border-slate-200 pt-4 md:grid-cols-[1fr_auto_auto]">
      <select
        aria-label="Alternative flight"
        className="focus-ring rounded border border-slate-300 px-3 py-3"
        value={selectedFlightId}
        disabled={booking.status === "cancelled"}
        onChange={(event) => setSelectedFlightId(event.target.value)}
      >
        {alternatives.length === 0 ? <option>No alternative flights</option> : null}
        {alternatives.map((flight) => (
          <option key={flight.id} value={flight.id}>
            {flight.flight_no} - {formatDateTime(flight.departs_at)} - {formatMoney(flight.base_price)}
          </option>
        ))}
      </select>
      <button
        disabled={busy || !selectedFlightId || booking.status === "cancelled"}
        className="focus-ring inline-flex items-center justify-center gap-2 rounded border border-runway px-4 py-3 font-semibold text-runway disabled:opacity-50"
        onClick={async () => {
          if (!window.confirm("Reschedule this booking to the selected flight?")) {
            return;
          }
          setBusy(true);
          setMessage(null);
          const supabase = createClient();
          const { error } = await supabase.rpc("reschedule_booking", {
            p_booking_id: booking.id,
            p_new_flight_id: selectedFlightId
          });
          setBusy(false);
          if (error) {
            setMessage(error.message);
            return;
          }
          await refreshCachedBookings();
          router.refresh();
        }}
      >
        <CalendarClock className="h-4 w-4" />
        Reschedule
      </button>
      <button
        disabled={busy || booking.status === "cancelled"}
        className="focus-ring inline-flex items-center justify-center gap-2 rounded bg-signal px-4 py-3 font-semibold text-white disabled:opacity-50"
        onClick={async () => {
          if (!window.confirm("Cancel this booking? This frees the seat and cannot be undone.")) {
            return;
          }
          setBusy(true);
          setMessage(null);
          const supabase = createClient();
          const { error } = await supabase.rpc("cancel_booking", { p_booking_id: booking.id });
          setBusy(false);
          if (error) {
            setMessage(error.message);
            return;
          }
          resetBooking();
          await refreshCachedBookings();
          router.refresh();
        }}
      >
        <Trash2 className="h-4 w-4" />
        Cancel
      </button>
      {message ? <p className="md:col-span-3 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p> : null}
    </div>
  );
}
