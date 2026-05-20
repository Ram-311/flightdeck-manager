"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useFlightStore } from "@/store/useFlightStore";
import { makeSearchParams } from "@/lib/utils";

const airports = ["JFK", "LAX", "SFO", "ORD", "SEA", "MIA"];

export function SearchForm() {
  const router = useRouter();
  const { searchQuery, setSearchQuery, setCurrentStep } = useFlightStore();

  return (
    <form
      className="grid gap-4 rounded border border-slate-200 bg-white p-4 shadow-panel md:grid-cols-[1fr_1fr_1fr_0.8fr_auto]"
      onSubmit={(event) => {
        event.preventDefault();
        setCurrentStep("results");
        router.push(`/results?${makeSearchParams(searchQuery)}`);
      }}
    >
      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Origin
        <select
          className="focus-ring rounded border border-slate-300 px-3 py-3"
          value={searchQuery.origin}
          onChange={(event) => setSearchQuery({ ...searchQuery, origin: event.target.value })}
          required
        >
          <option value="">Select</option>
          {airports.map((airport) => (
            <option key={airport} value={airport}>
              {airport}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Destination
        <select
          className="focus-ring rounded border border-slate-300 px-3 py-3"
          value={searchQuery.destination}
          onChange={(event) => setSearchQuery({ ...searchQuery, destination: event.target.value })}
          required
        >
          <option value="">Select</option>
          {airports.map((airport) => (
            <option key={airport} value={airport}>
              {airport}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Date
        <input
          className="focus-ring rounded border border-slate-300 px-3 py-3"
          type="date"
          value={searchQuery.date}
          onChange={(event) => setSearchQuery({ ...searchQuery, date: event.target.value })}
          required
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Passengers
        <input
          className="focus-ring rounded border border-slate-300 px-3 py-3"
          min={1}
          max={6}
          type="number"
          value={searchQuery.passengers}
          onChange={(event) => setSearchQuery({ ...searchQuery, passengers: Number(event.target.value) })}
          required
        />
      </label>
      <button className="focus-ring mt-auto inline-flex items-center justify-center gap-2 rounded bg-runway px-5 py-3 font-semibold text-white hover:bg-ink">
        <Search className="h-4 w-4" aria-hidden="true" />
        Search
      </button>
    </form>
  );
}
