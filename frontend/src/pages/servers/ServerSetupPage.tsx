import { useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, FolderKanban, Terminal, TerminalSquare } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { PageContent } from "@/components/layout/PageContent";
import { WizardPanel, WizardPanelBody } from "@/components/layout/WizardPanel";
import { PublicApiUrlBanner } from "@/components/servers/PublicApiUrlBanner";
import { ServerBootstrapPanel } from "@/components/servers/ServerBootstrapPanel";
import { ServerSetupPanel } from "@/components/servers/ServerSetupPanel";
import { ServerSetupSteps } from "@/components/servers/ServerSetupSteps";
import { ServerStatusBadge } from "@/components/servers/ServerStatusBadge";
import { Button } from "@/components/ui/button";
import { FormErrorBanner } from "@/components/ui/form-field";
import { ButtonSpinner, PageLoadingState } from "@/components/ui/loading-state";
import { OptionCard, RecommendedBadge } from "@/components/ui/option-card";
import { ROUTES, serverDetailPath } from "@/constants/routes";
import { getApiErrorMessage } from "@/lib/api-error";
import * as serversService from "@/services/servers.service";
import type { ServerSetupInfo } from "@/types/servers.types";
import type { ServerSetupNavigationState } from "@/pages/servers/NewServerPage";

const serverQueryKey = (id: string) => ["servers", id];

type InstallMethod = "ssh" | "manual";

export function ServerSetupPage() {
  const { id = "" } = useParams();
  const location = useLocation();
  const queryClient = useQueryClient();
  const navState = location.state as ServerSetupNavigationState | null;
  const [setupInfo, setSetupInfo] = useState<ServerSetupInfo | null>(navState?.setup ?? null);
  const [method, setMethod] = useState<InstallMethod>("ssh");
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: serverQueryKey(id),
    queryFn: () => serversService.getServer(id),
    enabled: Boolean(id),
    refetchInterval: (query) =>
      query.state.data?.server.status === "ONLINE" ? false : 5000,
  });

  const server = data?.server;

  const regenerateMutation = useMutation({
    mutationFn: () => serversService.regenerateRegistrationToken(id),
    onSuccess: (result) => {
      setSetupInfo({
        registrationToken: result.registrationToken,
        installCommand: result.installCommand,
        expiresAt: result.expiresAt,
      });
      setActionError(null);
    },
    onError: (err) => {
      setActionError(getApiErrorMessage(err, "Failed to generate install command"));
    },
  });

  if (isLoading) {
    return (
      <>
        <Header title="Install agent" />
        <PageContent>
          <PageLoadingState label="Loading server" description="Preparing install steps…" />
        </PageContent>
      </>
    );
  }

  if (isError || !server) {
    return (
      <>
        <Header
          title="Server not found"
          breadcrumbs={[{ label: "Servers", to: ROUTES.SERVERS }, { label: "Setup" }]}
        />
        <PageContent>
          <p className="text-sm text-destructive">{getApiErrorMessage(error, "Server not found")}</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link to={ROUTES.SERVERS}>Back to servers</Link>
          </Button>
        </PageContent>
      </>
    );
  }

  const isOnline = server.status === "ONLINE";
  const isConnecting = server.status === "CONNECTING";

  return (
    <>
      <Header
        title={isOnline ? `${server.name} is ready` : `Install the agent on ${server.name}`}
        description={
          isOnline
            ? "The agent is connected. You can deploy projects to this server."
            : "The agent is a small container that runs your deployments on this VPS."
        }
        breadcrumbs={[
          { label: "Servers", to: ROUTES.SERVERS },
          { label: server.name, to: serverDetailPath(server.id) },
          { label: "Setup" },
        ]}
        actions={<ServerStatusBadge status={server.status} className="text-sm" />}
      />

      <div className="min-h-0 flex-1 overflow-auto">
        <PageContent className="mx-auto max-w-4xl">
          <ServerSetupSteps current={isOnline ? 2 : 1} className="mx-auto max-w-2xl" />

          <PublicApiUrlBanner />

          <FormErrorBanner message={actionError} />

          {isOnline ? (
            <WizardPanel className="border-emerald-500/30">
              <WizardPanelBody className="flex flex-col items-center gap-4 py-10 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                  <CheckCircle2 className="h-7 w-7" />
                </span>
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold text-foreground">Agent connected</h2>
                  <p className="max-w-md text-sm text-muted-foreground">
                    {server.name} is online and waiting for work. Create a project and pick this
                    server as its environment target.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button asChild>
                    <Link to={ROUTES.PROJECT_NEW}>
                      <FolderKanban className="h-4 w-4" />
                      Create a project
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to={serverDetailPath(server.id)}>View server</Link>
                  </Button>
                </div>
              </WizardPanelBody>
            </WizardPanel>
          ) : (
            <>
              {isConnecting && (
                <div className="flex items-center gap-3 rounded-xl border border-sky-500/30 bg-sky-500/[0.06] px-4 py-3">
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-sky-500" />
                  </span>
                  <p className="text-sm text-foreground">
                    Waiting for the agent to connect… this page updates automatically.
                  </p>
                </div>
              )}

              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-foreground">Choose how to install</h2>
                <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Install method">
                  <OptionCard
                    selected={method === "ssh"}
                    onSelect={() => setMethod("ssh")}
                    icon={Terminal}
                    title="Install via SSH"
                    badge={<RecommendedBadge />}
                    description="DeployHub connects once, installs Docker and the agent, and streams progress here."
                  />
                  <OptionCard
                    selected={method === "manual"}
                    onSelect={() => setMethod("manual")}
                    icon={TerminalSquare}
                    title="Manual install"
                    description="Copy a one-line command and run it yourself on the VPS."
                  />
                </div>
              </section>

              {method === "ssh" ? (
                <ServerBootstrapPanel
                  serverId={server.id}
                  initialHost={server.sshHost}
                  initialPort={server.sshPort}
                  initialUser={server.sshUser}
                  onComplete={() => {
                    void queryClient.invalidateQueries({ queryKey: serverQueryKey(id) });
                    void queryClient.invalidateQueries({ queryKey: ["servers"] });
                  }}
                />
              ) : (
                <div className="space-y-4">
                  <PublicApiUrlBanner />
                  {setupInfo ? (
                    <ServerSetupPanel
                      title="Run this on your VPS"
                      setup={setupInfo}
                      onDismiss={() => setSetupInfo(null)}
                    />
                  ) : (
                    <WizardPanel>
                      <WizardPanelBody className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">Generate an install command</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Creates a fresh single-use registration token for this server.
                          </p>
                        </div>
                        <Button
                          type="button"
                          disabled={regenerateMutation.isPending || Boolean(server.registeredAt)}
                          onClick={() => void regenerateMutation.mutateAsync()}
                        >
                          {regenerateMutation.isPending ? (
                            <>
                              <ButtonSpinner className="mr-2" />
                              Generating…
                            </>
                          ) : (
                            <>
                              Generate command
                              <ArrowRight className="h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </WizardPanelBody>
                    </WizardPanel>
                  )}
                </div>
              )}

              <div className="flex justify-end">
                <Button variant="ghost" size="sm" asChild>
                  <Link to={serverDetailPath(server.id)}>I’ll finish this later</Link>
                </Button>
              </div>
            </>
          )}
        </PageContent>
      </div>
    </>
  );
}
