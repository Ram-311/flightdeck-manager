import { cn } from "@/lib/utils";
import type { BookingStatus, FlightStatus } from "@/lib/types";

const styles: Record<string, string> = {
  confirmed: "bg-emerald-100 text-emerald-800",
  rescheduled: "bg-sky-100 text-sky-800",
  cancelled: "bg-slate-200 text-slate-700",
  scheduled: "bg-emerald-100 text-emerald-800",
  boarding: "bg-taxi/30 text-amber-900",
  delayed: "bg-orange-100 text-orange-800"
};

export function StatusBadge({ status }: { status: BookingStatus | FlightStatus }) {
  return (
    <span className={cn("inline-flex rounded px-2 py-1 text-xs font-semibold capitalize", styles[status])}>
      {status}
    </span>
  );
}
