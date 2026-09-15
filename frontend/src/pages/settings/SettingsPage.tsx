import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Github, Loader2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatDateTime } from "@/lib/format-date";
import * as githubService from "@/services/github.service";
import { useAuthStore } from "@/stores/auth.store";

const integrationQueryKey = ["github", "integration"] as const;
const reposQueryKey = ["github", "repos"] as const;

export function SettingsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [banner, setBanner] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("github") === "connected") {
      setBanner("GitHub connected successfully.");
      searchParams.delete("github");
      setSearchParams(searchParams, { replace: true });
      void queryClient.invalidateQueries({ queryKey: integrationQueryKey });
    }
  }, [queryClient, searchParams, setSearchParams]);

  const {
    data: integrationData,
    isLoading: integrationLoading,
    isError: integrationError,
  } = useQuery({
    queryKey: integrationQueryKey,
    queryFn: githubService.getIntegration,
  });

  const integration = integrationData?.integration;
  const connected = integration?.connected === true;

  const { data: reposData, isLoading: reposLoading } = useQuery({
    queryKey: reposQueryKey,
    queryFn: () => githubService.listRepositories(20),
    enabled: connected,
  });

  const connectMutation = useMutation({
    mutationFn: githubService.getInstallUrl,
    onSuccess: ({ url }) => {
      setActionError(null);
      window.location.href = url;
    },
    onError: (err) => {
      setActionError(getApiErrorMessage(err, "Could not start GitHub install"));
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: githubService.disconnectGitHub,
    onSuccess: () => {
      setActionError(null);
      void queryClient.invalidateQueries({ queryKey: integrationQueryKey });
      void queryClient.removeQueries({ queryKey: reposQueryKey });
    },
    onError: (err) => {
      setActionError(getApiErrorMessage(err, "Failed to disconnect GitHub"));
    },
  });

  return (
    <>
      <Header
        title="Settings"
        description="Account details and GitHub App integration for deploys."
      />

      <div className="flex flex-1 flex-col gap-6 p-6">
        {banner && (
          <div className="rounded-md border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground">
            {banner}
          </div>
        )}
        {actionError && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {actionError}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Signed-in user on this browser session.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">Name:</span> {user?.name ?? "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Email:</span> {user?.email ?? "—"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Github className="h-5 w-5" />
                  GitHub
                </CardTitle>
                <CardDescription>
                  Connect the DeployHub GitHub App to clone private repos during deploys.
                </CardDescription>
              </div>
              {connected ? (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={disconnectMutation.isPending}
                  onClick={() => {
                    if (
                      window.confirm(
                        "Disconnect GitHub? Projects keep repo settings but deploys cannot clone until you reconnect.",
                      )
                    ) {
                      disconnectMutation.mutate();
                    }
                  }}
                >
                  {disconnectMutation.isPending ? "Disconnecting…" : "Disconnect"}
                </Button>
              ) : (
                <Button
                  size="sm"
                  disabled={connectMutation.isPending || integrationLoading}
                  onClick={() => connectMutation.mutate()}
                >
                  {connectMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Redirecting…
                    </>
                  ) : (
                    "Connect GitHub"
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {integrationLoading && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading integration…
              </p>
            )}
            {integrationError && (
              <p className="text-sm text-destructive">Could not load GitHub status.</p>
            )}
            {!integrationLoading && !connected && (
              <p className="text-sm text-muted-foreground">
                Not connected. Install the app on your GitHub account or organization, then return
                here to confirm status.
              </p>
            )}
            {connected && integration && (
              <>
                <dl className="grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-muted-foreground">Account</dt>
                    <dd className="font-medium">{integration.accountLogin}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Type</dt>
                    <dd className="font-medium">{integration.accountType}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Installation ID</dt>
                    <dd className="font-mono text-xs">{integration.installationId}</dd>
                  </div>
                  {integration.connectedAt && (
                    <div>
                      <dt className="text-muted-foreground">Connected</dt>
                      <dd>{formatDateTime(integration.connectedAt)}</dd>
                    </div>
                  )}
                </dl>

                <div>
                  <p className="mb-2 text-sm font-medium">Accessible repositories (sample)</p>
                  {reposLoading && (
                    <p className="text-sm text-muted-foreground">Loading repositories…</p>
                  )}
                  {!reposLoading && reposData?.repositories.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No repositories returned — check GitHub App repository access.
                    </p>
                  )}
                  {reposData && reposData.repositories.length > 0 && (
                    <ul className="max-h-48 divide-y overflow-y-auto rounded-md border text-sm">
                      {reposData.repositories.map((repo) => (
                        <li
                          key={repo.id}
                          className="flex items-center justify-between gap-2 px-3 py-2"
                        >
                          <span className="truncate font-mono text-xs">{repo.fullName}</span>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            default: {repo.defaultBranch}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  Auto deploy uses your GitHub App webhook URL and{" "}
                  <code className="rounded bg-muted px-1">GITHUB_WEBHOOK_SECRET</code> on the
                  backend. Enable auto deploy per environment on the project page or via Postman
                  Phase 10.
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>MVP checklist</CardTitle>
            <CardDescription>Five acceptance scenarios from SRS §8.</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
              <li>Dockerfile deploy end-to-end (UI or Postman Phase 7)</li>
              <li>Docker Compose multi-service project</li>
              <li>Env vars — Save vs Save &amp; Redeploy (Phase 6)</li>
              <li>Rollback to a previous SUCCESS deployment (Phase 9)</li>
              <li>Auto deploy via webhook (Phase 10 — you verified WEBHOOK SUCCESS)</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
