"use client";

import { useState } from "react";
import { LogIn, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useFlightStore } from "@/store/useFlightStore";
import { useUserStore } from "@/store/useUserStore";

export function AuthPanel() {
  const [email, setEmail] = useState("demo@flightdeck.test");
  const [password, setPassword] = useState("FlightDeck123!");
  const [message, setMessage] = useState<string | null>(null);
  const { session, setSession, resetUser } = useUserStore();
  const resetBooking = useFlightStore((state) => state.resetBooking);

  return (
    <section className="rounded border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-ink">Supabase Auth</h2>
          <p className="text-sm text-slate-600">{session ? `Signed in as ${session.user.email}` : "Use the seeded test account or your own user."}</p>
        </div>
      </div>
      {session ? (
        <button
          className="focus-ring inline-flex items-center gap-2 rounded bg-ink px-4 py-3 font-semibold text-white"
          onClick={async () => {
            await createClient().auth.signOut();
            resetUser();
            resetBooking();
            setMessage("Signed out.");
          }}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      ) : (
        <form
          className="grid gap-3 md:grid-cols-[1fr_1fr_auto]"
          onSubmit={async (event) => {
            event.preventDefault();
            setMessage(null);
            const supabase = createClient();
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
              setMessage(error.message);
              return;
            }
            setSession(data.session);
            setMessage("Signed in.");
          }}
        >
          <input className="focus-ring rounded border border-slate-300 px-3 py-3" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          <input className="focus-ring rounded border border-slate-300 px-3 py-3" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          <button className="focus-ring inline-flex items-center justify-center gap-2 rounded bg-runway px-4 py-3 font-semibold text-white">
            <LogIn className="h-4 w-4" />
            Sign in
          </button>
        </form>
      )}
      {message ? <p className="mt-3 rounded bg-slate-100 px-3 py-2 text-sm text-slate-700">{message}</p> : null}
    </section>
  );
}
