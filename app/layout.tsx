import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppHeader } from "@/components/layout/AppHeader";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";

export const metadata: Metadata = {
  title: "FlightDeck Manager",
  description: "Search, book, reschedule, and manage flights.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "FlightDeck"
  }
};

export const viewport: Viewport = {
  themeColor: "#145c64",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <AppHeader />
        <main className="mx-auto w-full max-w-7xl px-4 pb-12 pt-6 sm:px-6 lg:px-8">{children}</main>
        <InstallPrompt />
      </body>
    </html>
  );
}
