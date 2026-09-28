import { useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronDown, ChevronUp, FolderKanban, Server } from "lucide-react";
import { PageLoadingState } from "@/components/ui/loading-state";
import { Header } from "@/components/layout/Header";
import { PageContent } from "@/components/layout/PageContent";
import { PublicApiUrlBanner } from "@/components/servers/PublicApiUrlBanner";
import { ServerBootstrapPanel } from "@/components/servers/ServerBootstrapPanel";
import { ServerSetupPanel } from "@/components/servers/ServerSetupPanel";
import { ServerStatusBadge } from "@/components/servers/ServerStatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES, serverDetailPath } from "@/constants/routes";
import { getApiErrorMessage } from "@/lib/api-error";
import * as serversService from "@/services/servers.service";
import type { ServerSetupInfo } from "@/types/servers.types";
import type { ServerSetupNavigationState } from "@/pages/servers/NewServerPage";
import { cn } from "@/lib/utils";

const serverQueryKey = (id: string) => ["servers", id];

function SetupStep({
  step,
  title,
  description,
  status,
  children,
}: {
  step: number;
  title: string;
  description?: string;
  status: "complete" | "current" | "upcoming";
  children?: React.ReactNode;
}) {
  return (
    <section className="relative pl-10">
      <div
        className={cn(
          "absolute left-0 flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold",
          status === "complete" && "border-primary bg-primary text-primary-foreground",
          status === "current" && "border-primary bg-primary/10 text-primary",
          status === "upcoming" && "border-border bg-muted text-muted-foreground",
        )}
      >
        {status === "complete" ? <Check className="h-3.5 w-3.5" /> : step}
      </div>
      <div className="space-y-3 pb-8">
        <div>
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {children}
      </div>
    </section>
  );
}

export function ServerSetupPage() {
  const { id = "" } = useParams();
  const location = useLocation();
  const queryClient = useQueryClient();
  const navState = location.state as ServerSetupNavigationState | null;
  const [setupInfo, setSetupInfo] = useState<ServerSetupInfo | null>(navState?.setup ?? null);
  const [showManual, setShowManual] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: serverQueryKey(id),
    queryFn: () => serversService.getServer(id),
    enabled: Boolean(id),
    refetchInterval: (query) => {
      const status = query.state.data?.server.status;
      return status === "CONNECTING" || status === "OFFLINE" || status === "UNREGISTERED" ? 5000 : false;
    },
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
      setShowManual(true);
      setActionError(null);
    },
    onError: (err) => {
      setActionError(getApiErrorMessage(err, "Failed to generate install token"));
    },
  });

  if (isLoading) {
    return (
      <>
        <Header title="Install agent" description="Loading setup…" />
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
          <p className="text-sm text-destructive">
            {getApiErrorMessage(error, "Server not found")}
          </p>
          <Button variant="outline" className="mt-4" asChild>
            <Link to={ROUTES.SERVERS}>Back to servers</Link>
          </Button>
        </PageContent>
      </>
    );
  }

  const isOnline = server.status === "ONLINE";
  const installInProgress = server.status === "CONNECTING";
  const step2Status: "complete" | "current" | "upcoming" = isOnline
    ? "complete"
    : installInProgress
      ? "current"
      : "current";
  const step3Status: "complete" | "current" | "upcoming" = isOnline ? "current" : "upcoming";

  return (
    <>
      <Header
        title={`Set up ${server.name}`}
        description="Install the DeployHub agent so this VPS can receive deployments."
        breadcrumbs={[
          { label: "Servers", to: ROUTES.SERVERS },
          { label: server.name, to: serverDetailPath(server.id) },
          { label: "Setup" },
        ]}
        actions={<ServerStatusBadge status={server.status} className="text-sm" />}
      />

      <div className="min-h-0 flex-1 overflow-auto">
        <PageContent className="max-w-3xl">
          {actionError && (
            <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {actionError}
            </div>
          )}

          <p className="mb-6 text-sm text-muted-foreground">
            Use one server record per VPS. Re-running install on the same machine with a new token can
            create duplicate registrations — prefer SSH bootstrap or one manual install command.
          </p>

          <SetupStep
            step={1}
            title="Server registered"
            description="This target exists in DeployHub. Next, install the agent on the VPS."
            status="complete"
          />

          <SetupStep
            step={2}
            title="Install agent on the VPS"
            description="Recommended: one-time SSH from DeployHub (installs Docker + agent). Manual curl is available under Advanced."
            status={isOnline ? "complete" : step2Status}
          >
            {!isOnline && (
              <div className="space-y-4">
                {server.status === "CONNECTING" && (
                  <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-sm">
                    Agent install in progress or waiting to connect. This page refreshes every few
                    seconds.
                  </div>
                )}

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

                <div className="rounded-lg border border-border/60 bg-muted/20">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium"
                    onClick={() => setShowManual((open) => !open)}
                  >
                    <span>Advanced — manual install on the VPS</span>
                    {showManual ? (
                      <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                  </button>
                  {showManual && (
                    <div className="space-y-4 border-t border-border/60 px-4 pb-4 pt-2">
                      <PublicApiUrlBanner />
                      {!setupInfo ? (
                        <div className="space-y-3">
                          <p className="text-sm text-muted-foreground">
                            Generate a registration token and run the curl command on your VPS over SSH.
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={regenerateMutation.isPending || Boolean(server.registeredAt)}
                            onClick={() => void regenerateMutation.mutateAsync()}
                          >
                            {regenerateMutation.isPending ? "Generating…" : "Generate install command"}
                          </Button>
                        </div>
                      ) : (
                        <ServerSetupPanel
                          title="Manual agent install"
                          setup={setupInfo}
                          onDismiss={() => setSetupInfo(null)}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </SetupStep>

          <SetupStep
            step={3}
            title="Deploy an application"
            description="Create a project and bind an environment to this server."
            status={step3Status}
          >
            {isOnline ? (
              <Card className="border-primary/25 bg-primary/5 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Check className="h-4 w-4 text-primary" />
                    Agent connected
                  </CardTitle>
                  <CardDescription>
                    {server.name} is online. Create a project and add an environment that targets this
                    server.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button asChild>
                    <Link to={ROUTES.PROJECTS}>
                      <FolderKanban className="h-4 w-4" />
                      Create a project
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to={serverDetailPath(server.id)}>
                      <Server className="h-4 w-4" />
                      Server settings
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <p className="text-sm text-muted-foreground">
                Complete step 2 — status must show <strong className="font-medium">Online</strong> before
                you can deploy.
              </p>
            )}
          </SetupStep>

          {!isOnline && (
            <Button variant="ghost" size="sm" className="mt-2" asChild>
              <Link to={serverDetailPath(server.id)}>Skip to server details</Link>
            </Button>
          )}
        </PageContent>
      </div>
    </>
  );
}
