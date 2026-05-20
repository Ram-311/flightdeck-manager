"use client";

import Link from "next/link";
import { ArrowRight, Clock, PlaneTakeoff } from "lucide-react";
import type { Flight } from "@/lib/types";
import { formatDateTime, formatDuration, formatMoney } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";
import { useFlightStore } from "@/store/useFlightStore";

export function FlightCard({ flight }: { flight: Flight }) {
  const setSelectedFlight = useFlightStore((state) => state.setSelectedFlight);

  return (
    <article className="rounded border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-runway">
              <PlaneTakeoff className="h-4 w-4" /> {flight.flight_no}
            </span>
            <StatusBadge status={flight.status} />
            <span className="text-sm text-slate-500">{flight.aircraft_type}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-2xl font-semibold text-ink">
            <span>{flight.origin}</span>
            <ArrowRight className="h-5 w-5 text-slate-400" />
            <span>{flight.destination}</span>
          </div>
          <div className="grid gap-1 text-sm text-slate-600 sm:grid-cols-3">
            <span>{formatDateTime(flight.departs_at)}</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-4 w-4" /> {formatDuration(flight.departs_at, flight.arrives_at)}
            </span>
            <span>From {formatMoney(flight.base_price)}</span>
          </div>
        </div>
        <div className="grid gap-2 sm:min-w-48">
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <span className="rounded bg-slate-100 px-2 py-2">Economy</span>
            <span className="rounded bg-sky-100 px-2 py-2">Business</span>
            <span className="rounded bg-taxi/30 px-2 py-2">First</span>
          </div>
          <Link
            href={`/booking/${flight.id}`}
            className="focus-ring inline-flex justify-center rounded bg-ink px-4 py-3 font-semibold text-white hover:bg-runway"
            onClick={() => setSelectedFlight(flight)}
          >
            Select flight
          </Link>
        </div>
      </div>
    </article>
  );
}
