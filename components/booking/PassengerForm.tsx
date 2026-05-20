"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { Flight, PassengerDraft, Seat } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { formatMoney } from "@/lib/utils";
import { useFlightStore } from "@/store/useFlightStore";

export function PassengerForm({ flight, defaultSeat }: { flight: Flight; defaultSeat: Seat | null }) {
  const router = useRouter();
  const { selectedSeat, passengerForm, searchQuery, setPassengerForm, setCurrentStep } = useFlightStore();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const seat = selectedSeat ?? defaultSeat;
  const count = Math.max(1, searchQuery.passengers || passengerForm.length || 1);

  const passengers = useMemo(() => {
    return Array.from({ length: count }, (_, index) => passengerForm[index] ?? { fullName: "", passportNo: "", nationality: "", dob: "" });
  }, [count, passengerForm]);

  function updatePassenger(index: number, field: keyof PassengerDraft, value: string) {
    const next = passengers.map((passenger, passengerIndex) => (passengerIndex === index ? { ...passenger, [field]: value } : passenger));
    setPassengerForm(next);
  }

  return (
    <form
      className="rounded border border-slate-200 bg-white p-4 shadow-panel"
      onSubmit={async (event) => {
        event.preventDefault();
        setError(null);
        if (!seat) {
          setError("Choose a seat before confirming.");
          return;
        }
        setLoading(true);
        const supabase = createClient();
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          setLoading(false);
          setError("Sign in with Supabase Auth before booking. In local demo mode, create a user in Supabase first.");
          return;
        }
        const totalPrice = flight.base_price + seat.extra_fee;
        const { data, error: rpcError } = await supabase.rpc("reserve_seat_and_create_booking", {
          p_flight_id: flight.id,
          p_seat_id: seat.id,
          p_total_price: totalPrice,
          p_passengers: passengers.map((passenger) => ({
            full_name: passenger.fullName,
            passport_no: passenger.passportNo,
            nationality: passenger.nationality,
            dob: passenger.dob
          }))
        });
        setLoading(false);
        if (rpcError) {
          setError(rpcError.message);
          return;
        }
        setCurrentStep("confirmation");
        router.push(`/booking/${flight.id}/confirm?booking=${data}`);
      }}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink">Passenger details</h2>
          <p className="text-sm text-slate-600">
            {seat ? `Seat ${seat.seat_number}, total ${formatMoney(flight.base_price + seat.extra_fee)}` : "Select a seat to continue"}
          </p>
        </div>
      </div>
      <div className="grid gap-4">
        {passengers.map((passenger, index) => (
          <fieldset key={index} className="grid gap-3 rounded border border-slate-200 p-3 md:grid-cols-4">
            <legend className="px-1 text-sm font-semibold text-slate-600">Passenger {index + 1}</legend>
            <input className="focus-ring rounded border border-slate-300 px-3 py-3" placeholder="Full name" value={passenger.fullName} onChange={(event) => updatePassenger(index, "fullName", event.target.value)} required />
            <input className="focus-ring rounded border border-slate-300 px-3 py-3" placeholder="Passport number" value={passenger.passportNo} onChange={(event) => updatePassenger(index, "passportNo", event.target.value)} required />
            <input className="focus-ring rounded border border-slate-300 px-3 py-3" placeholder="Nationality" value={passenger.nationality} onChange={(event) => updatePassenger(index, "nationality", event.target.value)} required />
            <input className="focus-ring rounded border border-slate-300 px-3 py-3" type="date" value={passenger.dob} onChange={(event) => updatePassenger(index, "dob", event.target.value)} required />
          </fieldset>
        ))}
      </div>
      {error ? <p className="mt-3 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      <button disabled={loading} className="focus-ring mt-4 inline-flex items-center justify-center gap-2 rounded bg-runway px-5 py-3 font-semibold text-white disabled:opacity-60">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Confirm booking
      </button>
    </form>
  );
}
