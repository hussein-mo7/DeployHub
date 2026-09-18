import { useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCw, Trash2 } from "lucide-react";
import { DetailRow } from "@/components/layout/DetailRow";
import { Header } from "@/components/layout/Header";
import { PageContent } from "@/components/layout/PageContent";
import { ServerBootstrapPanel } from "@/components/servers/ServerBootstrapPanel";
import { ServerSetupPanel } from "@/components/servers/ServerSetupPanel";
import { ServerStatusBadge } from "@/components/servers/ServerStatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROUTES } from "@/constants/routes";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatDateTime, formatDistanceToNow } from "@/lib/format-date";
import { updateServerSchema } from "@/lib/validations/servers.schema";
import * as serversService from "@/services/servers.service";
import type { ServerSetupInfo } from "@/types/servers.types";

const serverQueryKey = (id: string) => ["servers", id];

export function ServerDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [setupInfo, setSetupInfo] = useState<ServerSetupInfo | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { data, isLoading, isError, error } = useQuery({
    queryKey: serverQueryKey(id),
    queryFn: () => serversService.getServer(id),
    enabled: Boolean(id),
    refetchInterval: (query) => {
      const status = query.state.data?.server.status;
      return status === "CONNECTING" || status === "OFFLINE" ? 5000 : false;
    },
  });

  const server = data?.server;

  const [form, setForm] = useState<{ name: string; description: string } | null>(null);
  const editForm = form ?? {
    name: server?.name ?? "",
    description: server?.description ?? "",
  };

  const updateMutation = useMutation({
    mutationFn: (values: { name: string; description: string }) =>
      serversService.updateServer(id, values),
    onSuccess: () => {
      setActionError(null);
      setFieldErrors({});
      setForm(null);
      void queryClient.invalidateQueries({ queryKey: serverQueryKey(id) });
      void queryClient.invalidateQueries({ queryKey: ["servers"] });
    },
    onError: (err) => {
      setActionError(getApiErrorMessage(err, "Failed to update server"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => serversService.deleteServer(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["servers"] });
      navigate(ROUTES.SERVERS);
    },
    onError: (err) => {
      setActionError(getApiErrorMessage(err, "Failed to delete server"));
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: () => serversService.regenerateRegistrationToken(id),
    onSuccess: (result) => {
      setSetupInfo({
        registrationToken: result.registrationToken,
        installCommand: result.installCommand,
        expiresAt: result.expiresAt,
      });
      setActionError(null);
      void queryClient.invalidateQueries({ queryKey: serverQueryKey(id) });
      void queryClient.invalidateQueries({ queryKey: ["servers"] });
    },
    onError: (err) => {
      setActionError(getApiErrorMessage(err, "Failed to regenerate token"));
    },
  });

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setFieldErrors({});

    const result = updateServerSchema.safeParse(editForm);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) errors[String(err.path[0])] = err.message;
      });
      setFieldErrors(errors);
      return;
    }

    await updateMutation.mutateAsync(result.data);
  };

  const handleDelete = () => {
    if (!server) return;
    const confirmed = window.confirm(`Delete "${server.name}"? This cannot be undone.`);
    if (confirmed) {
      void deleteMutation.mutateAsync();
    }
  };

  if (isLoading) {
    return (
      <>
        <Header title="Server" description="Loading server details…" />
        <PageContent>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </p>
        </PageContent>
      </>
    );
  }

  if (isError || !server) {
    return (
      <>
        <Header
          title="Server not found"
          breadcrumbs={[{ label: "Servers", to: ROUTES.SERVERS }, { label: "Not found" }]}
        />
        <PageContent>
          <p className="text-sm text-destructive">
            {getApiErrorMessage(error, "Server not found")}
          </p>
          <Button variant="outline" className="mt-4" onClick={() => navigate(ROUTES.SERVERS)}>
            Back to servers
          </Button>
        </PageContent>
      </>
    );
  }

  const isDirty =
    editForm.name !== server.name || editForm.description !== (server.description ?? "");

  const showSetupHint = server.status === "UNREGISTERED" || server.status === "OFFLINE";

  return (
    <>
      <Header
        title={server.name}
        description={server.description ?? "Agent connection and server settings."}
        breadcrumbs={[
          { label: "Servers", to: ROUTES.SERVERS },
          { label: server.name },
        ]}
        actions={<ServerStatusBadge status={server.status} className="text-sm" />}
      />

      <div className="min-h-0 flex-1 overflow-auto">
        <PageContent>
          {actionError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {actionError}
            </div>
          )}

          {server.status === "CONNECTING" && (
            <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-sm text-foreground">
              Agent install in progress or waiting for the agent to connect. Status refreshes
              automatically.
            </div>
          )}

          {server.status !== "ONLINE" && (
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
          )}

          {showSetupHint && !setupInfo && server.status === "UNREGISTERED" && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-foreground">
              Prefer manual install? Regenerate a token below if your install link expired.
            </div>
          )}

          {setupInfo && (
            <ServerSetupPanel
              setup={setupInfo}
              onDismiss={() => setSetupInfo(null)}
            />
          )}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Connection</CardTitle>
                <CardDescription>Live agent status and timestamps.</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <DetailRow label="Status">
                  <ServerStatusBadge status={server.status} />
                </DetailRow>
                <DetailRow label="Last seen">
                  {server.lastSeenAt ? (
                    <span title={formatDateTime(server.lastSeenAt)}>
                      {formatDistanceToNow(server.lastSeenAt)}
                    </span>
                  ) : (
                    "Never"
                  )}
                </DetailRow>
                <DetailRow label="Registered">
                  {server.registeredAt ? formatDateTime(server.registeredAt) : "Not yet"}
                </DetailRow>
                {server.sshHost && (
                  <DetailRow label="SSH target">
                    {server.sshUser ?? "root"}@{server.sshHost}:{server.sshPort}
                  </DetailRow>
                )}
                <DetailRow label="Created">{formatDateTime(server.createdAt)}</DetailRow>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Details</CardTitle>
                <CardDescription>Display name and notes for this server.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => void handleUpdate(e)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Name</Label>
                    <Input
                      id="edit-name"
                      value={editForm.name}
                      onChange={(e) => setForm({ ...editForm, name: e.target.value })}
                    />
                    {fieldErrors.name && (
                      <p className="text-xs text-destructive">{fieldErrors.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-description">Description</Label>
                    <Input
                      id="edit-description"
                      placeholder="Optional"
                      value={editForm.description}
                      onChange={(e) => setForm({ ...editForm, description: e.target.value })}
                    />
                    {fieldErrors.description && (
                      <p className="text-xs text-destructive">{fieldErrors.description}</p>
                    )}
                  </div>

                  <Button type="submit" disabled={!isDirty || updateMutation.isPending}>
                    {updateMutation.isPending ? "Saving…" : "Save changes"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Agent setup</CardTitle>
              <CardDescription>
                Generate a new registration token if the agent was never installed or the token
                expired.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                disabled={regenerateMutation.isPending || Boolean(server.registeredAt)}
                onClick={() => void regenerateMutation.mutateAsync()}
              >
                <RefreshCw className="h-4 w-4" />
                {regenerateMutation.isPending ? "Generating…" : "New install token"}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-destructive/20 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base text-destructive">Danger zone</CardTitle>
              <CardDescription>
                Permanently delete this server. Projects targeting it will need a new environment.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="border-destructive/40 text-destructive hover:bg-destructive/10"
                disabled={deleteMutation.isPending}
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
                {deleteMutation.isPending ? "Deleting…" : "Delete server"}
              </Button>
            </CardContent>
          </Card>
        </PageContent>
      </div>
    </>
  );
}
