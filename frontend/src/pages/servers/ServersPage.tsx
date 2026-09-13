import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { CreateServerForm } from "@/components/servers/CreateServerForm";
import { ServerList } from "@/components/servers/ServerList";
import { ServerSetupPanel } from "@/components/servers/ServerSetupPanel";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/api-error";
import * as serversService from "@/services/servers.service";
import type { ServerSetupInfo } from "@/types/servers.types";

const SERVERS_QUERY_KEY = ["servers"];

function shouldPollStatuses(servers: { status: string }[] | undefined): number | false {
  if (!servers?.length) return false;
  return servers.some((server) => server.status === "CONNECTING" || server.status === "OFFLINE")
    ? 5000
    : false;
}

export function ServersPage() {
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [setupInfo, setSetupInfo] = useState<ServerSetupInfo | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: SERVERS_QUERY_KEY,
    queryFn: serversService.listServers,
    refetchInterval: (query) => shouldPollStatuses(query.state.data?.servers),
  });

  const createMutation = useMutation({
    mutationFn: serversService.createServer,
    onSuccess: (result) => {
      setSetupInfo({
        registrationToken: result.registrationToken,
        installCommand: result.installCommand,
        expiresAt: result.expiresAt,
      });
      setShowCreateForm(false);
      setCreateError(null);
      void queryClient.invalidateQueries({ queryKey: SERVERS_QUERY_KEY });
    },
    onError: (err) => {
      setCreateError(getApiErrorMessage(err, "Failed to create server"));
    },
  });

  const servers = data?.servers ?? [];

  return (
    <>
      <Header
        title="Servers"
        description="Manage your Linux VPS servers and connected agents."
      />
      <div className="flex-1 space-y-6 overflow-auto p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {servers.length} server{servers.length === 1 ? "" : "s"} registered
          </p>
          {!showCreateForm && (
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4" />
              Add server
            </Button>
          )}
        </div>

        {setupInfo && (
          <ServerSetupPanel
            title="Server created — connect your agent"
            setup={setupInfo}
          />
        )}

        {showCreateForm && (
          <CreateServerForm
            onSubmit={async (values) => {
              setCreateError(null);
              await createMutation.mutateAsync(values);
            }}
            onCancel={() => {
              setShowCreateForm(false);
              setCreateError(null);
            }}
            isSubmitting={createMutation.isPending}
            error={createError}
          />
        )}

        {isLoading && <p className="text-sm text-muted-foreground">Loading servers...</p>}

        {isError && (
          <p className="text-sm text-destructive">
            {getApiErrorMessage(error, "Failed to load servers")}
          </p>
        )}

        {!isLoading && !isError && <ServerList servers={servers} />}
      </div>
    </>
  );
}
