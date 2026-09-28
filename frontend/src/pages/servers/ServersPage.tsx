import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { ListLoadingSkeleton } from "@/components/ui/loading-state";
import { Header } from "@/components/layout/Header";
import { PageContent } from "@/components/layout/PageContent";
import { ServerList, ServerListSummary } from "@/components/servers/ServerList";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { getApiErrorMessage } from "@/lib/api-error";
import * as serversService from "@/services/servers.service";

const SERVERS_QUERY_KEY = ["servers"];

function shouldPollStatuses(servers: { status: string }[] | undefined): number | false {
  if (!servers?.length) return false;
  return servers.some((server) => server.status === "CONNECTING" || server.status === "OFFLINE")
    ? 5000
    : false;
}

export function ServersPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: SERVERS_QUERY_KEY,
    queryFn: serversService.listServers,
    refetchInterval: (query) => shouldPollStatuses(query.state.data?.servers),
  });

  const servers = data?.servers ?? [];

  return (
    <>
      <Header
        title="Servers"
        description="Register Linux VPS targets and keep DeployHub agents connected."
        actions={
          <Button asChild className="w-full sm:w-auto">
            <Link to={ROUTES.SERVER_NEW}>
              <Plus className="h-4 w-4" />
              Add server
            </Link>
          </Button>
        }
      />

      <div className="min-h-0 flex-1 overflow-auto">
        <PageContent>
          {!isLoading && !isError && servers.length > 0 && (
            <ServerListSummary servers={servers} />
          )}

          {isLoading && <ListLoadingSkeleton rows={3} />}

          {isError && (
            <p className="text-sm text-destructive">
              {getApiErrorMessage(error, "Failed to load servers")}
            </p>
          )}

          {!isLoading && !isError && <ServerList servers={servers} />}
        </PageContent>
      </div>
    </>
  );
}
