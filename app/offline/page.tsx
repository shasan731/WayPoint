import Link from "next/link";
import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="max-w-md rounded-md border border-border bg-white p-6 text-center shadow-panel">
        <WifiOff className="mx-auto h-9 w-9 text-amber-600" />
        <h1 className="mt-4 text-xl font-semibold">You are offline</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          WayPoint pauses polling while offline and keeps only the latest unsent location update locally.
        </p>
        <Button asChild className="mt-5">
          <Link href="/dashboard">Return to app</Link>
        </Button>
      </div>
    </main>
  );
}
