import { formatDistanceToNow } from "@/lib/format-date";
import { EmptyState } from "@/components/layout/EmptyState";
import { ServerStatusBadge } from "@/components/servers/ServerStatusBadge";
import { Button } from "@/components/ui/button";
import type { ServerSummary } from "@/types/servers.types";
import { ChevronRight, Plus, Server } from "lucide-react";
import { Link } from "react-router-dom";
import { serverDetailPath } from "@/constants/routes";

interface ServerListProps {
  servers: ServerSummary[];
  onAddServer?: () => void;
}

function lastSeenLabel(server: ServerSummary): string {
  if (server.lastSeenAt) {
    return formatDistanceToNow(server.lastSeenAt);
  }
  if (server.registeredAt) {
    return `Registered ${formatDistanceToNow(server.registeredAt)}`;
  }
  return "Awaiting agent";
}

export function ServerList({ servers, onAddServer }: ServerListProps) {
  if (servers.length === 0) {
    return (
      <EmptyState
        icon={Server}
        title="No servers yet"
        description="Register a Linux VPS, run the install command, and connect the DeployHub agent."
        action={
          onAddServer ? (
            <Button onClick={onAddServer}>
              <Plus className="h-4 w-4" />
              Add your first server
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <>
      <ul className="space-y-3 md:hidden">
        {servers.map((server) => (
          <li key={server.id}>
            <Link
              to={serverDetailPath(server.id)}
              className="flex items-center justify-between gap-3 rounded-lg border bg-card p-4 shadow-sm transition-colors hover:bg-muted/30"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-foreground">{server.name}</span>
                  <ServerStatusBadge status={server.status} />
                </div>
                {server.description && (
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {server.description}
                  </p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">{lastSeenLabel(server)}</p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-hidden rounded-lg border bg-card shadow-sm md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Server</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="hidden px-4 py-3 font-medium lg:table-cell">Description</th>
              <th className="px-4 py-3 font-medium">Activity</th>
              <th className="w-10 px-2 py-3" aria-hidden />
            </tr>
          </thead>
          <tbody>
            {servers.map((server) => (
              <tr key={server.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3">
                  <Link
                    to={serverDetailPath(server.id)}
                    className="font-medium text-foreground hover:text-primary hover:underline"
                  >
                    {server.name}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <ServerStatusBadge status={server.status} />
                </td>
                <td className="hidden max-w-xs truncate px-4 py-3 text-muted-foreground lg:table-cell">
                  {server.description ?? "—"}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{lastSeenLabel(server)}</td>
                <td className="px-2 py-3">
                  <Link
                    to={serverDetailPath(server.id)}
                    className="inline-flex text-muted-foreground hover:text-foreground"
                    aria-label={`Open ${server.name}`}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function ServerListSummary({ servers }: { servers: ServerSummary[] }) {
  const online = servers.filter((s) => s.status === "ONLINE").length;
  const needsSetup = servers.filter(
    (s) => s.status === "UNREGISTERED" || s.status === "CONNECTING",
  ).length;
  const offline = servers.length - online - needsSetup;

  return (
    <div className="flex flex-wrap gap-2">
      <span className="rounded-md border bg-card px-3 py-1.5 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{servers.length}</span> server
        {servers.length === 1 ? "" : "s"}
      </span>
      <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-sm">
        <span className="font-medium text-foreground">{online}</span> online
      </span>
      {needsSetup > 0 && (
        <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-sm">
          <span className="font-medium text-foreground">{needsSetup}</span> need setup
        </span>
      )}
      {offline > 0 && (
        <span className="rounded-md border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{offline}</span> offline
        </span>
      )}
    </div>
  );
}
