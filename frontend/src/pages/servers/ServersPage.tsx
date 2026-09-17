import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { PageContent } from "@/components/layout/PageContent";
import { CreateServerForm } from "@/components/servers/CreateServerForm";
import { ServerList, ServerListSummary } from "@/components/servers/ServerList";
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
        description="Register Linux VPS targets and keep DeployHub agents connected."
        actions={
          !showCreateForm ? (
            <Button onClick={() => setShowCreateForm(true)} className="w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              Add server
            </Button>
          ) : undefined
        }
      />

      <div className="min-h-0 flex-1 overflow-auto">
        <PageContent>
          {!isLoading && !isError && servers.length > 0 && (
            <ServerListSummary servers={servers} />
          )}

          {setupInfo && (
            <ServerSetupPanel
              title="Server created — install the agent"
              setup={setupInfo}
              onDismiss={() => setSetupInfo(null)}
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

          {isLoading && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading servers…
            </p>
          )}

          {isError && (
            <p className="text-sm text-destructive">
              {getApiErrorMessage(error, "Failed to load servers")}
            </p>
          )}

          {!isLoading && !isError && (
            <ServerList
              servers={servers}
              onAddServer={!showCreateForm ? () => setShowCreateForm(true) : undefined}
            />
          )}
        </PageContent>
      </div>
    </>
  );
}
