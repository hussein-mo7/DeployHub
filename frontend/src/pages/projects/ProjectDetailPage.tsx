import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { ServerStatusBadge } from "@/components/servers/ServerStatusBadge";
import { CreateEnvironmentForm } from "@/components/projects/CreateEnvironmentForm";
import { CreateServiceForm } from "@/components/projects/CreateServiceForm";
import { DeploymentMethodBadge } from "@/components/projects/DeploymentMethodBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROUTES } from "@/constants/routes";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatDateTime } from "@/lib/format-date";
import { updateProjectSchema } from "@/lib/validations/projects.schema";
import * as projectsService from "@/services/projects.service";
import * as serversService from "@/services/servers.service";
import type { ServerStatus } from "@/types/servers.types";

const projectQueryKey = (id: string) => ["projects", id];

export function ProjectDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [showEnvironmentForm, setShowEnvironmentForm] = useState(false);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [environmentError, setEnvironmentError] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: projectQueryKey(id),
    queryFn: () => projectsService.getProject(id),
    enabled: Boolean(id),
  });

  const { data: serversData } = useQuery({
    queryKey: ["servers"],
    queryFn: serversService.listServers,
  });

  const project = data?.project;
  const servers = serversData?.servers ?? [];

  const [form, setForm] = useState<{
    name: string;
    description: string;
    repoOwner: string;
    repoName: string;
  } | null>(null);

  const editForm = form ?? {
    name: project?.name ?? "",
    description: project?.description ?? "",
    repoOwner: project?.repoOwner ?? "",
    repoName: project?.repoName ?? "",
  };

  const updateMutation = useMutation({
    mutationFn: (values: {
      name: string;
      description: string;
      repoOwner: string;
      repoName: string;
    }) =>
      projectsService.updateProject(id, {
        name: values.name,
        description: values.description.trim() ? values.description.trim() : null,
        repoOwner: values.repoOwner,
        repoName: values.repoName,
      }),
    onSuccess: () => {
      setActionError(null);
      setFieldErrors({});
      setForm(null);
      void queryClient.invalidateQueries({ queryKey: projectQueryKey(id) });
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (err) => {
      setActionError(getApiErrorMessage(err, "Failed to update project"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => projectsService.deleteProject(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
      navigate(ROUTES.PROJECTS);
    },
    onError: (err) => {
      setActionError(getApiErrorMessage(err, "Failed to delete project"));
    },
  });

  const createServiceMutation = useMutation({
    mutationFn: projectsService.createService.bind(null, id),
    onSuccess: () => {
      setShowServiceForm(false);
      setServiceError(null);
      void queryClient.invalidateQueries({ queryKey: projectQueryKey(id) });
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (err) => {
      setServiceError(getApiErrorMessage(err, "Failed to add service"));
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: (serviceId: string) => projectsService.deleteService(id, serviceId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectQueryKey(id) });
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (err) => {
      setActionError(getApiErrorMessage(err, "Failed to delete service"));
    },
  });

  const createEnvironmentMutation = useMutation({
    mutationFn: projectsService.createEnvironment.bind(null, id),
    onSuccess: () => {
      setShowEnvironmentForm(false);
      setEnvironmentError(null);
      void queryClient.invalidateQueries({ queryKey: projectQueryKey(id) });
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (err) => {
      setEnvironmentError(getApiErrorMessage(err, "Failed to add environment"));
    },
  });

  const deleteEnvironmentMutation = useMutation({
    mutationFn: (environmentId: string) =>
      projectsService.deleteEnvironment(id, environmentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectQueryKey(id) });
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (err) => {
      setActionError(getApiErrorMessage(err, "Failed to delete environment"));
    },
  });

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setFieldErrors({});

    const result = updateProjectSchema.safeParse(editForm);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) errors[String(err.path[0])] = err.message;
      });
      setFieldErrors(errors);
      return;
    }

    await updateMutation.mutateAsync({
      name: result.data.name ?? editForm.name,
      description: editForm.description,
      repoOwner: result.data.repoOwner ?? editForm.repoOwner,
      repoName: result.data.repoName ?? editForm.repoName,
    });
  };

  const handleDeleteProject = () => {
    if (!project) return;
    const confirmed = window.confirm(`Delete "${project.name}"? This cannot be undone.`);
    if (confirmed) {
      void deleteMutation.mutateAsync();
    }
  };

  const handleDeleteService = (serviceId: string, name: string) => {
    const confirmed = window.confirm(`Delete service "${name}"?`);
    if (confirmed) {
      void deleteServiceMutation.mutateAsync(serviceId);
    }
  };

  const handleDeleteEnvironment = (environmentId: string, name: string) => {
    const confirmed = window.confirm(`Delete environment "${name}"?`);
    if (confirmed) {
      void deleteEnvironmentMutation.mutateAsync(environmentId);
    }
  };

  if (isLoading) {
    return (
      <>
        <Header title="Project" description="Loading project details..." />
        <div className="p-6 text-sm text-muted-foreground">Loading...</div>
      </>
    );
  }

  if (isError || !project) {
    return (
      <>
        <Header title="Project" description="Project details" />
        <div className="space-y-4 p-6">
          <p className="text-sm text-destructive">
            {getApiErrorMessage(error, "Project not found")}
          </p>
          <Button asChild variant="outline">
            <Link to={ROUTES.PROJECTS}>
              <ArrowLeft className="h-4 w-4" />
              Back to projects
            </Link>
          </Button>
        </div>
      </>
    );
  }

  const isDirty =
    editForm.name !== project.name ||
    editForm.description !== (project.description ?? "") ||
    editForm.repoOwner !== project.repoOwner ||
    editForm.repoName !== project.repoName;

  return (
    <>
      <Header title={project.name} description={project.repoFullName} />
      <div className="flex-1 space-y-6 overflow-auto p-6">
        <Button asChild variant="ghost" className="px-0 hover:bg-transparent">
          <Link to={ROUTES.PROJECTS} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to projects
          </Link>
        </Button>

        {actionError && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {actionError}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Repository</span>
                <span className="font-mono text-xs">{project.repoFullName}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Services</span>
                <span>{project.services.length}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Environments</span>
                <span>{project.environments.length}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Created</span>
                <span>{formatDateTime(project.createdAt)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Edit project</CardTitle>
              <CardDescription>Update the project name, description, or repository.</CardDescription>
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
                    value={editForm.description}
                    onChange={(e) => setForm({ ...editForm, description: e.target.value })}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-repo-owner">Repository owner</Label>
                    <Input
                      id="edit-repo-owner"
                      value={editForm.repoOwner}
                      onChange={(e) => setForm({ ...editForm, repoOwner: e.target.value })}
                    />
                    {fieldErrors.repoOwner && (
                      <p className="text-xs text-destructive">{fieldErrors.repoOwner}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-repo-name">Repository name</Label>
                    <Input
                      id="edit-repo-name"
                      value={editForm.repoName}
                      onChange={(e) => setForm({ ...editForm, repoName: e.target.value })}
                    />
                    {fieldErrors.repoName && (
                      <p className="text-xs text-destructive">{fieldErrors.repoName}</p>
                    )}
                  </div>
                </div>

                <Button type="submit" disabled={!isDirty || updateMutation.isPending}>
                  {updateMutation.isPending ? "Saving..." : "Save changes"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Services</CardTitle>
              <CardDescription>How this project builds or runs on the server.</CardDescription>
            </div>
            {!showServiceForm && (
              <Button variant="outline" size="sm" onClick={() => setShowServiceForm(true)}>
                <Plus className="h-4 w-4" />
                Add service
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {showServiceForm && (
              <CreateServiceForm
                onSubmit={async (values) => {
                  setServiceError(null);
                  await createServiceMutation.mutateAsync(values);
                }}
                onCancel={() => {
                  setShowServiceForm(false);
                  setServiceError(null);
                }}
                isSubmitting={createServiceMutation.isPending}
                error={serviceError}
              />
            )}

            {project.services.length === 0 ? (
              <p className="text-sm text-muted-foreground">No services configured yet.</p>
            ) : (
              <div className="space-y-3">
                {project.services.map((service) => (
                  <div
                    key={service.id}
                    className="flex flex-wrap items-start justify-between gap-3 rounded-md border p-4"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-medium">{service.name}</h4>
                        <DeploymentMethodBadge method={service.deploymentMethod} />
                      </div>
                      {service.description && (
                        <p className="text-sm text-muted-foreground">{service.description}</p>
                      )}
                      <p className="font-mono text-xs text-muted-foreground">
                        {service.deploymentMethod === "DOCKERFILE" &&
                          `${service.dockerfilePath} · context ${service.buildContext}`}
                        {service.deploymentMethod === "COMPOSE" && service.composeFilePath}
                        {service.deploymentMethod === "IMAGE" && service.imageName}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      disabled={deleteServiceMutation.isPending}
                      onClick={() => handleDeleteService(service.id, service.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Environments</CardTitle>
              <CardDescription>Target server and branch for deployments.</CardDescription>
            </div>
            {!showEnvironmentForm && (
              <Button variant="outline" size="sm" onClick={() => setShowEnvironmentForm(true)}>
                <Plus className="h-4 w-4" />
                Add environment
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {showEnvironmentForm && (
              <CreateEnvironmentForm
                servers={servers}
                onSubmit={async (values) => {
                  setEnvironmentError(null);
                  await createEnvironmentMutation.mutateAsync(values);
                }}
                onCancel={() => {
                  setShowEnvironmentForm(false);
                  setEnvironmentError(null);
                }}
                isSubmitting={createEnvironmentMutation.isPending}
                error={environmentError}
              />
            )}

            {project.environments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No environments configured yet.</p>
            ) : (
              <div className="space-y-3">
                {project.environments.map((environment) => (
                  <div
                    key={environment.id}
                    className="flex flex-wrap items-start justify-between gap-3 rounded-md border p-4"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-medium">{environment.name}</h4>
                        <ServerStatusBadge status={environment.serverStatus as ServerStatus} />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {environment.serverName} · branch {environment.branch}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Auto deploy: {environment.autoDeployEnabled ? "enabled" : "disabled"}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      disabled={deleteEnvironmentMutation.isPending}
                      onClick={() =>
                        handleDeleteEnvironment(environment.id, environment.name)
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Danger zone</CardTitle>
            <CardDescription>Permanently delete this project and all related configuration.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="border-destructive/40 text-destructive hover:bg-destructive/10"
              disabled={deleteMutation.isPending}
              onClick={handleDeleteProject}
            >
              <Trash2 className="h-4 w-4" />
              {deleteMutation.isPending ? "Deleting..." : "Delete project"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
