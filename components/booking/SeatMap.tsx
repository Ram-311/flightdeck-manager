"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Seat, SeatClass } from "@/lib/types";
import { cn, formatMoney } from "@/lib/utils";
import { useFlightStore } from "@/store/useFlightStore";

const columns = ["A", "B", "C", "D", "E", "F"];
const zoneLabels: Record<SeatClass, string> = {
  first: "First",
  business: "Business",
  economy: "Economy"
};

function seatRow(seatNumber: string) {
  return Number.parseInt(seatNumber.replace(/\D/g, ""), 10);
}

export function SeatMap({ flightId, initialSeats, currentSeatId }: { flightId: string; initialSeats: Seat[]; currentSeatId?: string }) {
  const [seats, setSeats] = useState(initialSeats);
  const { selectedSeat, optimisticSeatId, setSelectedSeat, markSeatOptimistically } = useFlightStore();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`seat-map-${flightId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "seats", filter: `flight_id=eq.${flightId}` },
        (payload) => {
          const changedSeat = payload.new as Seat;
          setSeats((existing) => existing.map((seat) => (seat.id === changedSeat.id ? changedSeat : seat)));
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [flightId]);

  const grouped = useMemo(() => {
    return seats
      .slice()
      .sort((a, b) => seatRow(a.seat_number) - seatRow(b.seat_number) || a.seat_number.localeCompare(b.seat_number))
      .reduce<Record<SeatClass, Seat[]>>(
        (acc, seat) => {
          acc[seat.class].push(seat);
          return acc;
        },
        { first: [], business: [], economy: [] }
      );
  }, [seats]);

  return (
    <div className="rounded border border-slate-200 bg-white p-4 shadow-panel">
      <div className="mb-4 flex flex-wrap gap-3 text-xs font-medium text-slate-600">
        <span className="inline-flex items-center gap-2"><i className="h-3 w-3 rounded bg-emerald-500" /> Available</span>
        <span className="inline-flex items-center gap-2"><i className="h-3 w-3 rounded bg-runway" /> Selected</span>
        <span className="inline-flex items-center gap-2"><i className="h-3 w-3 rounded bg-slate-300" /> Occupied</span>
        <span className="inline-flex items-center gap-2"><i className="h-3 w-3 rounded bg-taxi" /> Your seat</span>
      </div>
      <div className="max-h-[64vh] overflow-auto rounded bg-cloud p-4">
        {(["first", "business", "economy"] as SeatClass[]).map((seatClass) => (
          <section key={seatClass} className="mb-6 last:mb-0">
            <div className="sticky top-0 z-10 mb-3 flex items-center justify-between bg-cloud py-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">{zoneLabels[seatClass]}</h2>
              <span className="text-xs text-slate-500">{grouped[seatClass].filter((seat) => seat.is_available).length} open</span>
            </div>
            <div className="grid min-w-[360px] grid-cols-7 gap-2">
              {Array.from(new Set(grouped[seatClass].map((seat) => seatRow(seat.seat_number)))).flatMap((row) => [
                <div key={`${seatClass}-${row}-label`} className="grid h-11 place-items-center text-xs font-semibold text-slate-500">{row}</div>,
                ...columns.map((column, index) => {
                  const seat = grouped[seatClass].find((candidate) => candidate.seat_number === `${row}${column}`);
                  if (!seat) {
                    return <div key={`${seatClass}-${row}-${column}`} className={index === 3 ? "ml-4" : ""} />;
                  }
                  const isSelected = optimisticSeatId === seat.id || selectedSeat?.id === seat.id;
                  const isYourSeat = currentSeatId === seat.id;
                  return (
                    <button
                      key={seat.id}
                      title={`${seat.seat_number} - ${zoneLabels[seat.class]} - Extra ${formatMoney(seat.extra_fee)}`}
                      disabled={!seat.is_available && !isYourSeat}
                      onClick={() => {
                        markSeatOptimistically(seat.id);
                        setSelectedSeat(seat);
                      }}
                      className={cn(
                        "focus-ring h-11 rounded text-xs font-bold transition",
                        index === 3 && "ml-4",
                        seat.is_available && "bg-emerald-500 text-white hover:bg-emerald-600",
                        !seat.is_available && "cursor-not-allowed bg-slate-300 text-slate-600",
                        isSelected && "bg-runway text-white ring-2 ring-runway ring-offset-2",
                        isYourSeat && "bg-taxi text-ink"
                      )}
                    >
                      {seat.seat_number}
                    </button>
                  );
                })
              ])}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
