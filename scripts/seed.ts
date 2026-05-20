import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";

loadEnvConfig(process.cwd());

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running the seed script.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

type FlightSeed = {
  flight_no: string;
  origin: string;
  destination: string;
  departs_at: string;
  arrives_at: string;
  aircraft_type: string;
  status: "scheduled" | "boarding" | "delayed" | "cancelled";
  base_price: number;
};

function isoDaysFromNow(days: number, hour: number, minute = 0) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCHours(hour, minute, 0, 0);
  return date.toISOString();
}

function flightSeeds(): FlightSeed[] {
  return [
    ["FD101", "JFK", "LAX", 2, 13, 10, 429],
    ["FD102", "JFK", "LAX", 3, 21, 15, 389],
    ["FD201", "SFO", "SEA", 2, 16, 2, 189],
    ["FD202", "SFO", "SEA", 4, 23, 4, 209],
    ["FD301", "ORD", "MIA", 3, 12, 6, 259],
    ["FD302", "ORD", "MIA", 5, 19, 8, 279],
    ["FD401", "LAX", "JFK", 4, 14, 11, 459],
    ["FD402", "LAX", "JFK", 6, 22, 16, 419]
  ].map(([flight_no, origin, destination, day, hour, durationHours, base_price]) => ({
    flight_no: String(flight_no),
    origin: String(origin),
    destination: String(destination),
    departs_at: isoDaysFromNow(Number(day), Number(hour)),
    arrives_at: isoDaysFromNow(Number(day), Number(hour) + Number(durationHours), 20),
    aircraft_type: "Airbus A321neo",
    status: "scheduled",
    base_price: Number(base_price)
  }));
}

function seatsForFlight(flightId: string) {
  const columns = ["A", "B", "C", "D", "E", "F"];
  const seats = [];

  for (let row = 1; row <= 24; row += 1) {
    for (const column of columns) {
      const seatClass = row <= 2 ? "first" : row <= 6 ? "business" : "economy";
      const extraFee = seatClass === "first" ? 450 : seatClass === "business" ? 180 : row <= 10 ? 45 : 0;
      seats.push({
        flight_id: flightId,
        seat_number: `${row}${column}`,
        class: seatClass,
        is_available: true,
        extra_fee: extraFee
      });
    }
  }

  return seats;
}

async function main() {
  const { error: userError } = await supabase.auth.admin.createUser({
    email: "demo@flightdeck.test",
    password: "FlightDeck123!",
    email_confirm: true
  });

  if (userError && !userError.message.toLowerCase().includes("already")) {
    throw userError;
  }

  const { data: flights, error: flightError } = await supabase
    .from("flights")
    .upsert(flightSeeds(), { onConflict: "flight_no" })
    .select("id, flight_no");

  if (flightError) {
    throw flightError;
  }

  for (const flight of flights ?? []) {
    const { error: seatError } = await supabase
      .from("seats")
      .upsert(seatsForFlight(flight.id), { onConflict: "flight_id,seat_number" });
    if (seatError) {
      throw seatError;
    }
  }

  console.log(`Seeded ${flights?.length ?? 0} flights and full seat maps.`);
  console.log("Demo user: demo@flightdeck.test / FlightDeck123!");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
