"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Session } from "@supabase/supabase-js";
import type { Booking } from "@/lib/types";

type UserStore = {
  session: Session | null;
  sessionToken: string | null;
  cachedBookings: Booking[];
  setSession: (session: Session | null) => void;
  setCachedBookings: (bookings: Booking[]) => void;
  resetUser: () => void;
};

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      session: null,
      sessionToken: null,
      cachedBookings: [],
      setSession: (session) => set({ session, sessionToken: session?.access_token ?? null }),
      setCachedBookings: (bookings) => set({ cachedBookings: bookings }),
      resetUser: () => set({ session: null, sessionToken: null, cachedBookings: [] })
    }),
    {
      name: "flightdeck-user",
      partialize: (state) => ({
        sessionToken: state.sessionToken
      })
    }
  )
);
