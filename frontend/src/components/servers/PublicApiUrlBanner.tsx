import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import * as configService from "@/services/config.service";

const publicConfigQueryKey = ["config", "public"] as const;

function isLocalControlPlaneUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch {
    return false;
  }
}

/** Warn when manual install commands point at localhost (VPS cannot reach them). */
export function PublicApiUrlBanner({ className }: { className?: string }) {
  const { data: publicConfig } = useQuery({
    queryKey: publicConfigQueryKey,
    queryFn: configService.getPublicConfig,
    staleTime: 60_000,
  });

  const apiUrl = publicConfig?.publicApiUrl;
  if (!apiUrl || !isLocalControlPlaneUrl(apiUrl)) {
    return null;
  }

  return (
    <div
      className={
        className ??
        "flex gap-3 rounded-lg border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-foreground"
      }
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
      <div className="space-y-1 leading-relaxed">
        <p className="font-medium">VPS cannot use localhost install URLs</p>
        <p className="text-muted-foreground">
          Your control plane is <code className="rounded bg-muted px-1 font-mono text-xs">{apiUrl}</code>.
          Set <code className="rounded bg-muted px-1 font-mono text-xs">PUBLIC_API_URL</code> to a URL the VPS
          can reach (deployed API or tunnel), then restart the API before running manual install on a remote
          server. SSH bootstrap from DeployHub still works for local dev in many setups.
        </p>
      </div>
    </div>
  );
}
