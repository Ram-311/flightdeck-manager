create extension if not exists pgcrypto with schema extensions;

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

grant execute on function public.reserve_seat_and_create_booking(uuid, uuid, numeric, jsonb) to authenticated;