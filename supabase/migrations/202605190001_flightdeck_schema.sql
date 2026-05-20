create extension if not exists pgcrypto with schema extensions;

create table if not exists public.flights (
  id uuid primary key default gen_random_uuid(),
  flight_no text not null unique,
  origin text not null,
  destination text not null,
  departs_at timestamptz not null,
  arrives_at timestamptz not null,
  aircraft_type text not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'boarding', 'delayed', 'cancelled')),
  base_price numeric(10, 2) not null check (base_price >= 0),
  created_at timestamptz not null default now(),
  check (origin <> destination),
  check (arrives_at > departs_at)
);

create table if not exists public.seats (
  id uuid primary key default gen_random_uuid(),
  flight_id uuid not null references public.flights(id) on delete cascade,
  seat_number text not null,
  class text not null check (class in ('economy', 'business', 'first')),
  is_available boolean not null default true,
  extra_fee numeric(10, 2) not null default 0 check (extra_fee >= 0),
  created_at timestamptz not null default now(),
  unique (flight_id, seat_number)
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  flight_id uuid not null references public.flights(id),
  seat_id uuid not null references public.seats(id),
  status text not null default 'confirmed' check (status in ('confirmed', 'rescheduled', 'cancelled')),
  booked_at timestamptz not null default now(),
  total_price numeric(10, 2) not null check (total_price >= 0),
  pnr_code text not null unique
);

create unique index if not exists one_active_booking_per_seat
  on public.bookings (seat_id)
  where status in ('confirmed', 'rescheduled');

create table if not exists public.passengers (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  full_name text not null,
  passport_no text not null,
  nationality text not null,
  dob date not null,
  created_at timestamptz not null default now()
);

create table if not exists public.reschedules (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  old_flight_id uuid not null references public.flights(id),
  new_flight_id uuid not null references public.flights(id),
  requested_at timestamptz not null default now(),
  fee_charged numeric(10, 2) not null default 0 check (fee_charged >= 0)
);

alter table public.flights enable row level security;
alter table public.seats enable row level security;
alter table public.bookings enable row level security;
alter table public.passengers enable row level security;
alter table public.reschedules enable row level security;

create policy "Flights are searchable by everyone"
  on public.flights for select
  using (true);

create policy "Seats are visible for live seat maps"
  on public.seats for select
  using (true);

create policy "Users can read their own bookings"
  on public.bookings for select
  using (auth.uid() = user_id);

create policy "Users can read passengers on their bookings"
  on public.passengers for select
  using (
    exists (
      select 1 from public.bookings b
      where b.id = passengers.booking_id and b.user_id = auth.uid()
    )
  );

create policy "Users can read their own reschedules"
  on public.reschedules for select
  using (
    exists (
      select 1 from public.bookings b
      where b.id = reschedules.booking_id and b.user_id = auth.uid()
    )
  );

create or replace function public.reject_late_cancellation()
returns trigger
language plpgsql
as $$
declare
  departure_time timestamptz;
begin
  if new.status = 'cancelled' and old.status <> 'cancelled' then
    select f.departs_at into departure_time
    from public.flights f
    where f.id = old.flight_id;

    if departure_time <= now() + interval '2 hours' then
      raise exception 'Cancellations within 2 hours of departure are not allowed';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists bookings_reject_late_cancellation on public.bookings;
create trigger bookings_reject_late_cancellation
  before update of status on public.bookings
  for each row
  execute function public.reject_late_cancellation();

create or replace function public.reserve_seat_and_create_booking(
  p_flight_id uuid,
  p_seat_id uuid,
  p_total_price numeric,
  p_passengers jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_seat public.seats%rowtype;
  v_booking_id uuid;
  v_passenger jsonb;
  v_pnr text;
begin
  if v_user_id is null then
    raise exception 'Authentication is required';
  end if;

  select * into v_seat
  from public.seats
  where id = p_seat_id and flight_id = p_flight_id
  for update;

  if not found then
    raise exception 'Seat does not belong to this flight';
  end if;

  if not v_seat.is_available then
    raise exception 'Seat is no longer available';
  end if;

  v_pnr := upper(substr(encode(extensions.gen_random_bytes(6), 'hex'), 1, 8));

  insert into public.bookings (user_id, flight_id, seat_id, total_price, pnr_code)
  values (v_user_id, p_flight_id, p_seat_id, p_total_price, v_pnr)
  returning id into v_booking_id;

  for v_passenger in select * from jsonb_array_elements(p_passengers)
  loop
    insert into public.passengers (booking_id, full_name, passport_no, nationality, dob)
    values (
      v_booking_id,
      v_passenger->>'full_name',
      v_passenger->>'passport_no',
      v_passenger->>'nationality',
      (v_passenger->>'dob')::date
    );
  end loop;

  update public.seats
  set is_available = false
  where id = p_seat_id;

  return v_booking_id;
end;
$$;

create or replace function public.cancel_booking(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_booking public.bookings%rowtype;
begin
  select * into v_booking
  from public.bookings
  where id = p_booking_id and user_id = auth.uid()
  for update;

  if not found then
    raise exception 'Booking not found';
  end if;

  if v_booking.status = 'cancelled' then
    return;
  end if;

  update public.bookings
  set status = 'cancelled'
  where id = p_booking_id;

  update public.seats
  set is_available = true
  where id = v_booking.seat_id;
end;
$$;

create or replace function public.reschedule_booking(
  p_booking_id uuid,
  p_new_flight_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_booking public.bookings%rowtype;
  v_old_flight public.flights%rowtype;
  v_new_flight public.flights%rowtype;
  v_old_seat public.seats%rowtype;
  v_new_seat public.seats%rowtype;
  v_fee numeric(10, 2);
begin
  select * into v_booking
  from public.bookings
  where id = p_booking_id and user_id = auth.uid()
  for update;

  if not found then
    raise exception 'Booking not found';
  end if;

  if v_booking.status = 'cancelled' then
    raise exception 'Cancelled bookings cannot be rescheduled';
  end if;

  select * into v_old_flight from public.flights where id = v_booking.flight_id;
  select * into v_new_flight from public.flights where id = p_new_flight_id;

  if v_new_flight.id is null then
    raise exception 'Selected flight is not available';
  end if;

  select * into v_old_seat from public.seats where id = v_booking.seat_id;

  if v_old_seat.id is null then
    raise exception 'Current seat was not found';
  end if;

  if v_old_flight.origin <> v_new_flight.origin or v_old_flight.destination <> v_new_flight.destination then
    raise exception 'Reschedule must stay on the same route';
  end if;

  if v_new_flight.departs_at <= now() then
    raise exception 'Cannot reschedule to a departed flight';
  end if;

  select * into v_new_seat
  from public.seats
  where flight_id = p_new_flight_id
    and class = v_old_seat.class
    and is_available = true
  order by seat_number
  limit 1
  for update;

  if not found then
    raise exception 'No available seat in the same class on the new flight';
  end if;

  v_fee := greatest(0, v_new_flight.base_price - v_old_flight.base_price);

  update public.seats set is_available = true where id = v_booking.seat_id;
  update public.seats set is_available = false where id = v_new_seat.id;

  update public.bookings
  set flight_id = p_new_flight_id,
      seat_id = v_new_seat.id,
      status = 'rescheduled',
      total_price = total_price + v_fee
  where id = p_booking_id;

  insert into public.reschedules (booking_id, old_flight_id, new_flight_id, fee_charged)
  values (p_booking_id, v_booking.flight_id, p_new_flight_id, v_fee);
end;
$$;

grant execute on function public.reserve_seat_and_create_booking(uuid, uuid, numeric, jsonb) to authenticated;
grant execute on function public.cancel_booking(uuid) to authenticated;
grant execute on function public.reschedule_booking(uuid, uuid) to authenticated;