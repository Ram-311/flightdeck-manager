"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Flight, PassengerDraft, SearchQuery, Seat } from "@/lib/types";

type BookingStep = "search" | "results" | "seat" | "passengers" | "confirmation";

type FlightStore = {
  searchQuery: SearchQuery;
  selectedFlight: Flight | null;
  selectedSeat: Seat | null;
  currentStep: BookingStep;
  passengerForm: PassengerDraft[];
  optimisticSeatId: string | null;
  setSearchQuery: (query: SearchQuery) => void;
  setSelectedFlight: (flight: Flight | null) => void;
  setSelectedSeat: (seat: Seat | null) => void;
  setCurrentStep: (step: BookingStep) => void;
  setPassengerForm: (passengers: PassengerDraft[]) => void;
  markSeatOptimistically: (seatId: string | null) => void;
  resetBooking: () => void;
};

const initialQuery: SearchQuery = {
  origin: "",
  destination: "",
  date: "",
  passengers: 1
};

export const useFlightStore = create<FlightStore>()(
  persist(
    (set) => ({
      searchQuery: initialQuery,
      selectedFlight: null,
      selectedSeat: null,
      currentStep: "search",
      passengerForm: [{ fullName: "", passportNo: "", nationality: "", dob: "" }],
      optimisticSeatId: null,
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSelectedFlight: (flight) => set({ selectedFlight: flight }),
      setSelectedSeat: (seat) => set({ selectedSeat: seat, optimisticSeatId: seat?.id ?? null }),
      setCurrentStep: (step) => set({ currentStep: step }),
      setPassengerForm: (passengers) => set({ passengerForm: passengers }),
      markSeatOptimistically: (seatId) => set({ optimisticSeatId: seatId }),
      resetBooking: () =>
        set({
          searchQuery: initialQuery,
          selectedFlight: null,
          selectedSeat: null,
          currentStep: "search",
          passengerForm: [{ fullName: "", passportNo: "", nationality: "", dob: "" }],
          optimisticSeatId: null
        })
    }),
    {
      name: "flightdeck-booking",
      partialize: (state) => ({
        searchQuery: state.searchQuery,
        selectedFlight: state.selectedFlight,
        selectedSeat: state.selectedSeat,
        currentStep: state.currentStep,
        passengerForm: state.passengerForm.map((passenger) => ({
          fullName: passenger.fullName,
          passportNo: "",
          nationality: passenger.nationality,
          dob: passenger.dob
        }))
      })
    }
  )
);
