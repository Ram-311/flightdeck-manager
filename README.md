# FlightDeck Manager

A responsive flight management app built with Next.js App Router, Supabase, Zustand, Tailwind CSS, and `next-pwa`.

## Features

- Search flights by route, date, and passenger count.
- Compare results with price, duration, aircraft, and class options.
- Interactive realtime seat map with first, business, and economy zones.
- Supabase RPC booking flow that locks seats before creating a booking.
- My Bookings page with rescheduling, cancellation, status badges, and confirmation dialogs.
- DB-level cancellation guard blocking cancellations within 2 hours of departure.
- Zustand stores with persisted booking progress and sensitive passport numbers excluded.
- Installable PWA manifest, offline fallback, runtime caching for results, bookings, and static assets.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env.local` and fill in your Supabase values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-for-seeding-only
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

3. Apply the SQL in `supabase/migrations` to your Supabase project.

4. Seed flights, seats, and the demo account:

```bash
npm run seed
```

Demo credentials:

- Email: `demo@flightdeck.test`
- Password: `FlightDeck123!`

5. Start the app:

```bash
npm run dev
```

## Supabase Notes

All required tables are created in `supabase/migrations/202605190001_flightdeck_schema.sql`. RLS is enabled on every table. Flights and seats are readable for search and realtime seat maps, while bookings, passengers, and reschedules are scoped to `auth.uid()`.

Seat reservation uses `reserve_seat_and_create_booking`, which locks the selected seat row with `for update`, verifies availability, creates the booking and passenger rows, and marks the seat unavailable in one transaction. Cancellation uses `cancel_booking`, and rescheduling uses `reschedule_booking`.

The cancellation rule is enforced by the `bookings_reject_late_cancellation` trigger, so attempts to cancel within 2 hours of departure fail even if called outside the app.

## Zustand Store Structure

`store/useFlightStore.ts` keeps the active search query, selected flight, selected seat, current booking step, passenger draft data, and optimistic seat selection. Its `partialize` removes passport numbers from localStorage.

`store/useUserStore.ts` keeps the Supabase session and cached bookings for the UI. Persistence is intentionally narrow so only token material is stored.

## PWA

`next.config.mjs` configures `next-pwa` with:

- `StaleWhileRevalidate` for flight search results.
- `StaleWhileRevalidate` for My Bookings.
- `CacheFirst` for Next.js static assets.
- `/offline` as the document fallback.

The manifest is in `public/manifest.json` with 192x192 and 512x512 icons. A Lighthouse PWA screenshot can be added after running an audit against your deployed Vercel URL.

## Deployment

Deploy to Vercel with the same Supabase environment variables. The production URL was not created from this local workspace; add it here after deployment.
