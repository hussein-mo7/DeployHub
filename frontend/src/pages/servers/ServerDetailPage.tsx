import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Trash2 } from "lucide-react";
import { PageLoadingState } from "@/components/ui/loading-state";
import { DetailRow } from "@/components/layout/DetailRow";
import { Header } from "@/components/layout/Header";
import { PageContent } from "@/components/layout/PageContent";
import { PageSection, PageSectionHeader, PageSections } from "@/components/layout/PageSection";
import { PublicApiUrlBanner } from "@/components/servers/PublicApiUrlBanner";
import { ServerSetupPanel } from "@/components/servers/ServerSetupPanel";
import { ServerStatusBadge } from "@/components/servers/ServerStatusBadge";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { ROUTES, serverSetupPath } from "@/constants/routes";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatDateTime, formatDistanceToNow } from "@/lib/format-date";
import { updateServerSchema } from "@/lib/validations/servers.schema";
import { useConfirm } from "@/components/ui/confirm-dialog";
import * as serversService from "@/services/servers.service";
import type { ServerSetupInfo } from "@/types/servers.types";

const serverQueryKey = (id: string) => ["servers", id];

export function ServerDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { confirm } = useConfirm();
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

  const handleDelete = async () => {
    if (!server) return;
    const confirmed = await confirm({
      title: "Delete server",
      description: `Remove “${server.name}” from DeployHub? The agent, containers, and files on the VPS are not deleted. Projects using this server will need another environment.`,
      confirmLabel: "Delete server",
    });
    if (confirmed) {
      void deleteMutation.mutateAsync();
    }
  };

  if (isLoading) {
    return (
      <>
        <Header title="Server" description="Loading server details…" />
        <PageContent>
          <PageLoadingState label="Loading server" description="Fetching agent status and settings…" />
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

  const needsAgentSetup =
    server.status === "UNREGISTERED" ||
    server.status === "OFFLINE" ||
    server.status === "CONNECTING";

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

          {needsAgentSetup && (
            <div className="rounded-lg border border-primary/25 bg-primary/5 px-4 py-4 text-sm">
              <p className="font-medium text-foreground">Agent setup incomplete</p>
              <p className="mt-1 text-muted-foreground">
                Install the agent via SSH or manual install, then wait for status{" "}
                <strong className="font-medium text-foreground">Online</strong>.
              </p>
              <Button className="mt-3" size="sm" asChild>
                <Link to={serverSetupPath(server.id)}>Continue setup wizard</Link>
              </Button>
            </div>
          )}

          {setupInfo && (
            <>
              <PublicApiUrlBanner className="mb-4" />
              <ServerSetupPanel
                setup={setupInfo}
                onDismiss={() => setSetupInfo(null)}
              />
            </>
          )}

          <PageSections>
            <div className="grid grid-cols-1 gap-10 xl:grid-cols-2">
              <PageSection className="space-y-4">
                <PageSectionHeader
                  title="Connection"
                  description="Live agent status and timestamps."
                  className="border-0 pb-0"
                />
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
              </PageSection>

              <PageSection>
                <PageSectionHeader
                  title="Details"
                  description="Display name and notes for this server."
                />
                <form onSubmit={(e) => void handleUpdate(e)} className="space-y-4 max-w-lg">
                  <FormField id="edit-name" label="Name" error={fieldErrors.name}>
                    <Input
                      id="edit-name"
                      value={editForm.name}
                      onChange={(e) => setForm({ ...editForm, name: e.target.value })}
                    />
                  </FormField>
                  <FormField id="edit-description" label="Description" optional error={fieldErrors.description}>
                    <Input
                      id="edit-description"
                      placeholder="Optional"
                      value={editForm.description}
                      onChange={(e) => setForm({ ...editForm, description: e.target.value })}
                    />
                  </FormField>
                  <Button type="submit" disabled={!isDirty || updateMutation.isPending}>
                    {updateMutation.isPending ? "Saving…" : "Save changes"}
                  </Button>
                </form>
              </PageSection>
            </div>

            <PageSection>
              <PageSectionHeader
                title="Agent setup"
                description="Generate a new registration token if the agent was never installed or the token expired."
              />
              <Button
                variant="outline"
                disabled={regenerateMutation.isPending || Boolean(server.registeredAt)}
                onClick={() => void regenerateMutation.mutateAsync()}
              >
                <RefreshCw className="h-4 w-4" />
                {regenerateMutation.isPending ? "Generating…" : "New install token"}
              </Button>
            </PageSection>

            <PageSection className="border-t border-destructive/25 pt-10">
              <PageSectionHeader
                title={<span className="text-destructive">Danger zone</span>}
                description="Permanently delete this server. Projects targeting it will need a new environment."
                className="border-destructive/20"
              />
              <Button
                variant="destructive"
                disabled={deleteMutation.isPending}
                onClick={() => void handleDelete()}
              >
                <Trash2 className="h-4 w-4" />
                {deleteMutation.isPending ? "Deleting…" : "Delete server"}
              </Button>
            </PageSection>
          </PageSections>
        </PageContent>
      </div>
    </>
  );
}
