import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, RefreshCw, Trash2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { ServerSetupPanel } from "@/components/servers/ServerSetupPanel";
import { ServerStatusBadge } from "@/components/servers/ServerStatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROUTES } from "@/constants/routes";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatDateTime } from "@/lib/format-date";
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
        <Header title="Server" description="Loading server details..." />
        <div className="p-6 text-sm text-muted-foreground">Loading...</div>
      </>
    );
  }

  if (isError || !server) {
    return (
      <>
        <Header title="Server" description="Server details" />
        <div className="space-y-4 p-6">
          <p className="text-sm text-destructive">
            {getApiErrorMessage(error, "Server not found")}
          </p>
          <Button asChild variant="outline">
            <Link to={ROUTES.SERVERS}>
              <ArrowLeft className="h-4 w-4" />
              Back to servers
            </Link>
          </Button>
        </div>
      </>
    );
  }

  const isDirty =
    editForm.name !== server.name || editForm.description !== (server.description ?? "");

  return (
    <>
      <Header title={server.name} description="Server details and agent connection." />
      <div className="flex-1 space-y-6 overflow-auto p-6">
        <Button asChild variant="ghost" className="px-0 hover:bg-transparent">
          <Link to={ROUTES.SERVERS} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to servers
          </Link>
        </Button>

        {actionError && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {actionError}
          </div>
        )}

        {setupInfo && <ServerSetupPanel setup={setupInfo} />}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Current status</span>
                <ServerStatusBadge status={server.status} />
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Registered</span>
                <span>{server.registeredAt ? formatDateTime(server.registeredAt) : "Not yet"}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Last seen</span>
                <span>{server.lastSeenAt ? formatDateTime(server.lastSeenAt) : "Never"}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Created</span>
                <span>{formatDateTime(server.createdAt)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Edit server</CardTitle>
              <CardDescription>Update the display name or description.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => void handleUpdate(e)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    value={editForm.name}
                    onChange={(e) =>
                      setForm({ ...editForm, name: e.target.value })
                    }
                  />
                  {fieldErrors.name && (
                    <p className="text-xs text-destructive">{fieldErrors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Input
                    id="edit-description"
                    value={editForm.description}
                    onChange={(e) =>
                      setForm({ ...editForm, description: e.target.value })
                    }
                  />
                  {fieldErrors.description && (
                    <p className="text-xs text-destructive">{fieldErrors.description}</p>
                  )}
                </div>

                <Button type="submit" disabled={!isDirty || updateMutation.isPending}>
                  {updateMutation.isPending ? "Saving..." : "Save changes"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Agent actions</CardTitle>
            <CardDescription>
              Regenerate a registration token if the agent is not connected yet.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              disabled={regenerateMutation.isPending || Boolean(server.registeredAt)}
              onClick={() => void regenerateMutation.mutateAsync()}
            >
              <RefreshCw className="h-4 w-4" />
              {regenerateMutation.isPending ? "Regenerating..." : "Regenerate token"}
            </Button>
            <Button
              variant="outline"
              className="border-destructive/40 text-destructive hover:bg-destructive/10"
              disabled={deleteMutation.isPending}
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
              {deleteMutation.isPending ? "Deleting..." : "Delete server"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
