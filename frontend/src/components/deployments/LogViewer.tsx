import { useRef } from "react";
import { Loader2 } from "lucide-react";
import { useLogContainerScroll } from "@/hooks/useLogContainerScroll";
import { cn } from "@/lib/utils";

export interface LogLine {
  id: string;
  message: string;
}

interface LogViewerProps {
  logs?: LogLine[];
  isLoading?: boolean;
  emptyMessage?: string;
  followKey?: string | null;
  className?: string;
}

export function LogViewer({
  logs = [],
  isLoading = false,
  emptyMessage = "Waiting for logs…",
  followKey,
  className,
}: LogViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { onScroll } = useLogContainerScroll(containerRef, logs.length, followKey);

  return (
    <div
      ref={containerRef}
      onScroll={onScroll}
      className={cn(
        "h-[280px] max-h-[280px] min-h-[240px] overflow-y-auto overscroll-y-contain rounded-md border border-zinc-800 bg-zinc-950 p-3 font-mono text-[11px] leading-relaxed text-zinc-100 sm:text-xs lg:h-[360px] lg:max-h-[360px]",
        className,
      )}
    >
      {isLoading && logs.length === 0 ? (
        <p className="flex items-center gap-2 text-zinc-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Loading logs…
        </p>
      ) : logs.length === 0 ? (
        <p className="text-zinc-500">{emptyMessage}</p>
      ) : (
        logs.map((log) => (
          <div key={log.id} className="whitespace-pre-wrap break-all">
            {log.message}
          </div>
        ))
      )}
    </div>
  );
}
