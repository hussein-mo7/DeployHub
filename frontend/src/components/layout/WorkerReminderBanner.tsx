import { useState } from "react";
import { Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "deployhub.dismiss-worker-reminder";

/** Shown on dashboard when the account has infra configured — deploy/bootstrap need a worker process. */
export function WorkerReminderBanner({ visible }: { visible: boolean }) {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });

  if (!visible || dismissed) {
    return null;
  }

  return (
    <div
      className="flex flex-col gap-3 rounded-lg border border-sky-500/30 bg-sky-500/[0.06] px-4 py-3 sm:flex-row sm:items-start sm:justify-between"
      role="status"
    >
      <div className="flex gap-3">
        <Cpu className="mt-0.5 h-5 w-5 shrink-0 text-sky-700" />
        <div className="text-sm">
          <p className="font-medium text-foreground">Run the background worker locally</p>
          <p className="mt-0.5 text-muted-foreground">
            SSH bootstrap, deploys, and webhooks enqueue jobs in Redis. Start the worker in a second
            terminal:{" "}
            <code className="rounded bg-muted px-1 font-mono text-xs">npm run worker</code> (from the
            repo root).
          </p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="shrink-0 border-sky-600/30"
        onClick={() => {
          try {
            localStorage.setItem(STORAGE_KEY, "1");
          } catch {
            /* ignore */
          }
          setDismissed(true);
        }}
      >
        Dismiss
      </Button>
    </div>
  );
}
