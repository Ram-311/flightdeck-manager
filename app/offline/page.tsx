import { OfflineBookings } from "@/components/booking/OfflineBookings";

export default function OfflinePage() {
  return (
    <div className="mx-auto max-w-3xl rounded border border-slate-200 bg-white p-6 shadow-panel">
      <h1 className="text-3xl font-bold text-ink">You are offline</h1>
      <p className="mt-2 text-slate-600">Cached trips remain readable here after your first online visit to My Bookings.</p>
      <div className="mt-5">
        <OfflineBookings />
      </div>
    </div>
  );
}
