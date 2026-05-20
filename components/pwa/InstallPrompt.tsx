"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const handler = (installEvent: Event) => {
      installEvent.preventDefault();
      setEvent(installEvent as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!event || hidden) {
    return null;
  }

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-lg items-center justify-between gap-3 rounded border border-slate-200 bg-white p-3 shadow-panel">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink">Install FlightDeck</p>
        <p className="text-xs text-slate-600">Keep trips and cached bookings handy offline.</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          className="focus-ring grid h-10 w-10 place-items-center rounded bg-runway text-white"
          title="Install app"
          onClick={async () => {
            await event.prompt();
            setHidden(true);
          }}
        >
          <Download className="h-4 w-4" />
        </button>
        <button
          className="focus-ring grid h-10 w-10 place-items-center rounded border border-slate-200"
          title="Dismiss"
          onClick={() => setHidden(true)}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
