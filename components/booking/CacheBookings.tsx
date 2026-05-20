"use client";

import { useEffect } from "react";
import type { Booking } from "@/lib/types";
import { useUserStore } from "@/store/useUserStore";

export function CacheBookings({ bookings }: { bookings: Booking[] }) {
  const setCachedBookings = useUserStore((state) => state.setCachedBookings);

  useEffect(() => {
    setCachedBookings(bookings);
  }, [bookings, setCachedBookings]);

  return null;
}
