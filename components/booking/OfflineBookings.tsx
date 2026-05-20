"use client";

import { useUserStore } from "@/store/useUserStore";
import { formatDateTime, formatMoney } from "@/lib/utils";

export function OfflineBookings() {
  const cachedBookings = useUserStore((state) => state.cachedBookings);

  if (cachedBookings.length === 0) {
    return <p className="text-sm text-slate-600">No cached bookings are available on this device yet.</p>;
  }

  return (
    <div className="grid gap-3">
      {cachedBookings.map((booking) => (
        <article key={booking.id} className="rounded border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold text-ink">{booking.pnr_code}</h2>
            <span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold capitalize">{booking.status}</span>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            {booking.flights?.origin} to {booking.flights?.destination} on {booking.flights ? formatDateTime(booking.flights.departs_at) : "cached flight"}
          </p>
          <p className="text-sm font-semibold text-runway">{formatMoney(booking.total_price)}</p>
        </article>
      ))}
    </div>
  );
}
