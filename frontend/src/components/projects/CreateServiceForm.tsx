import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createServiceSchema } from "@/lib/validations/projects.schema";
import { DEPLOYMENT_METHODS, type DeploymentMethod } from "@/types/projects.types";

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

interface CreateServiceFormProps {
  onSubmit: (values: {
    name: string;
    description?: string;
    deploymentMethod: DeploymentMethod;
    dockerfilePath: string;
    composeFilePath: string;
    imageName?: string;
    buildContext: string;
    port?: number;
  }) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  error: string | null;
}

export function CreateServiceForm({
  onSubmit,
  onCancel,
  isSubmitting,
  error,
}: CreateServiceFormProps) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    deploymentMethod: "DOCKERFILE" as DeploymentMethod,
    dockerfilePath: "Dockerfile",
    composeFilePath: "docker-compose.yml",
    imageName: "",
    buildContext: ".",
    port: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const payload = {
      name: form.name,
      deploymentMethod: form.deploymentMethod,
      dockerfilePath: form.dockerfilePath,
      composeFilePath: form.composeFilePath,
      buildContext: form.buildContext,
      ...(form.description.trim() ? { description: form.description.trim() } : {}),
      ...(form.deploymentMethod === "IMAGE" && form.imageName.trim()
        ? { imageName: form.imageName.trim() }
        : {}),
      ...(form.port.trim() ? { port: Number(form.port) } : {}),
    };

    const result = createServiceSchema.safeParse(payload);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) errors[String(err.path[0])] = err.message;
      });
      setFieldErrors(errors);
      return;
    }

    await onSubmit(result.data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add service</CardTitle>
        <CardDescription>
          Define how this project builds or runs on the server (Dockerfile, Compose, or image).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="service-name">Name</Label>
            <Input
              id="service-name"
              placeholder="Web"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            {fieldErrors.name && <p className="text-xs text-destructive">{fieldErrors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="service-description">Description (optional)</Label>
            <Input
              id="service-description"
              placeholder="Next.js full-stack app"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deployment-method">Deployment method</Label>
            <select
              id="deployment-method"
              className={selectClassName}
              value={form.deploymentMethod}
              onChange={(e) =>
                setForm({ ...form, deploymentMethod: e.target.value as DeploymentMethod })
              }
            >
              {DEPLOYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </div>

          {form.deploymentMethod === "DOCKERFILE" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="dockerfile-path">Dockerfile path</Label>
                <Input
                  id="dockerfile-path"
                  value={form.dockerfilePath}
                  onChange={(e) => setForm({ ...form, dockerfilePath: e.target.value })}
                />
                {fieldErrors.dockerfilePath && (
                  <p className="text-xs text-destructive">{fieldErrors.dockerfilePath}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="build-context">Build context</Label>
                <Input
                  id="build-context"
                  value={form.buildContext}
                  onChange={(e) => setForm({ ...form, buildContext: e.target.value })}
                />
                {fieldErrors.buildContext && (
                  <p className="text-xs text-destructive">{fieldErrors.buildContext}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="service-port">Host port (optional)</Label>
                <Input
                  id="service-port"
                  type="number"
                  min={1}
                  max={65535}
                  placeholder="3000"
                  value={form.port}
                  onChange={(e) => setForm({ ...form, port: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Publishes the same port on your machine (e.g. 3000 for Next.js).
                </p>
                {fieldErrors.port && (
                  <p className="text-xs text-destructive">{fieldErrors.port}</p>
                )}
              </div>
            </>
          )}

          {form.deploymentMethod === "COMPOSE" && (
            <div className="space-y-2">
              <Label htmlFor="compose-file-path">Compose file path</Label>
              <Input
                id="compose-file-path"
                value={form.composeFilePath}
                onChange={(e) => setForm({ ...form, composeFilePath: e.target.value })}
              />
              {fieldErrors.composeFilePath && (
                <p className="text-xs text-destructive">{fieldErrors.composeFilePath}</p>
              )}
            </div>
          )}

          {form.deploymentMethod === "IMAGE" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="image-name">Image name</Label>
                <Input
                  id="image-name"
                  placeholder="ghcr.io/user/app:latest"
                  value={form.imageName}
                  onChange={(e) => setForm({ ...form, imageName: e.target.value })}
                />
                {fieldErrors.imageName && (
                  <p className="text-xs text-destructive">{fieldErrors.imageName}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="image-port">Host port (optional)</Label>
                <Input
                  id="image-port"
                  type="number"
                  min={1}
                  max={65535}
                  placeholder="8080"
                  value={form.port}
                  onChange={(e) => setForm({ ...form, port: e.target.value })}
                />
                {fieldErrors.port && (
                  <p className="text-xs text-destructive">{fieldErrors.port}</p>
                )}
              </div>
            </>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add service"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
