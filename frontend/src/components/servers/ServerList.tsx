import { formatDistanceToNow } from "@/lib/format-date";
import { ServerStatusBadge } from "@/components/servers/ServerStatusBadge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ServerSummary } from "@/types/servers.types";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { serverDetailPath } from "@/constants/routes";

interface ServerListProps {
  servers: ServerSummary[];
}

export function ServerList({ servers }: ServerListProps) {
  if (servers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No servers yet</CardTitle>
          <CardDescription>Add your first server to connect an agent and start deploying.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {servers.map((server) => (
        <Link key={server.id} to={serverDetailPath(server.id)}>
          <Card className="transition-colors hover:bg-muted/30">
            <CardContent className="flex items-center justify-between gap-4 p-5">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium">{server.name}</h3>
                  <ServerStatusBadge status={server.status} />
                </div>
                {server.description && (
                  <p className="truncate text-sm text-muted-foreground">{server.description}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {server.lastSeenAt
                    ? `Last seen ${formatDistanceToNow(server.lastSeenAt)}`
                    : server.registeredAt
                      ? `Registered ${formatDistanceToNow(server.registeredAt)}`
                      : "Agent not registered yet"}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
