import { Box, FileCode2, Layers } from "lucide-react";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { OptionCard } from "@/components/ui/option-card";
import type { DeploymentMethod } from "@/types/projects.types";

export interface ServiceDraft {
  name: string;
  description: string;
  deploymentMethod: DeploymentMethod;
  dockerfilePath: string;
  composeFilePath: string;
  imageName: string;
  buildContext: string;
  port: string;
}

export function defaultServiceDraft(name = "web"): ServiceDraft {
  return {
    name,
    description: "",
    deploymentMethod: "DOCKERFILE",
    dockerfilePath: "Dockerfile",
    composeFilePath: "docker-compose.yml",
    imageName: "",
    buildContext: ".",
    port: "",
  };
}

/** Shape expected by `createServiceSchema`. */
export function serviceDraftToPayload(draft: ServiceDraft) {
  return {
    name: draft.name,
    deploymentMethod: draft.deploymentMethod,
    dockerfilePath: draft.dockerfilePath,
    composeFilePath: draft.composeFilePath,
    buildContext: draft.buildContext,
    ...(draft.description.trim() ? { description: draft.description.trim() } : {}),
    ...(draft.deploymentMethod === "IMAGE" && draft.imageName.trim()
      ? { imageName: draft.imageName.trim() }
      : {}),
    ...(draft.port.trim() && draft.deploymentMethod !== "COMPOSE"
      ? { port: Number(draft.port) }
      : {}),
  };
}

const methods: Array<{
  id: DeploymentMethod;
  title: string;
  description: string;
  icon: typeof Box;
}> = [
  {
    id: "DOCKERFILE",
    title: "Dockerfile",
    description: "Build an image from a Dockerfile in your repo.",
    icon: FileCode2,
  },
  {
    id: "COMPOSE",
    title: "Docker Compose",
    description: "Run a multi-container stack from a compose file.",
    icon: Layers,
  },
  {
    id: "IMAGE",
    title: "Pre-built image",
    description: "Pull an existing image from a registry.",
    icon: Box,
  },
];

interface ServiceBuildFieldsProps {
  value: ServiceDraft;
  onChange: (next: ServiceDraft) => void;
  errors: Record<string, string>;
  idPrefix?: string;
}

export function ServiceBuildFields({ value, onChange, errors, idPrefix = "service" }: ServiceBuildFieldsProps) {
  const set = (patch: Partial<ServiceDraft>) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <p className="text-sm font-medium text-foreground">How should DeployHub run this app?</p>
        <div className="grid gap-3 md:grid-cols-3" role="radiogroup" aria-label="Deployment method">
          {methods.map((method) => (
            <OptionCard
              key={method.id}
              selected={value.deploymentMethod === method.id}
              onSelect={() => set({ deploymentMethod: method.id })}
              icon={method.icon}
              title={method.title}
              description={method.description}
            />
          ))}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          id={`${idPrefix}-name`}
          label="Service name"
          hint="Short identifier, e.g. web or api."
          error={errors.name}
        >
          <Input
            id={`${idPrefix}-name`}
            placeholder="web"
            value={value.name}
            onChange={(e) => set({ name: e.target.value })}
          />
        </FormField>
        <FormField id={`${idPrefix}-description`} label="Description" optional error={errors.description}>
          <Input
            id={`${idPrefix}-description`}
            placeholder="Next.js frontend"
            value={value.description}
            onChange={(e) => set({ description: e.target.value })}
          />
        </FormField>
      </div>

      {value.deploymentMethod === "DOCKERFILE" && (
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField
            id={`${idPrefix}-dockerfile`}
            label="Dockerfile path"
            error={errors.dockerfilePath}
          >
            <Input
              id={`${idPrefix}-dockerfile`}
              className="font-mono text-xs"
              value={value.dockerfilePath}
              onChange={(e) => set({ dockerfilePath: e.target.value })}
            />
          </FormField>
          <FormField
            id={`${idPrefix}-context`}
            label="Build context"
            error={errors.buildContext}
          >
            <Input
              id={`${idPrefix}-context`}
              className="font-mono text-xs"
              value={value.buildContext}
              onChange={(e) => set({ buildContext: e.target.value })}
            />
          </FormField>
          <FormField
            id={`${idPrefix}-port`}
            label="Port"
            optional
            hint="Published on the VPS, e.g. 3000."
            error={errors.port}
          >
            <Input
              id={`${idPrefix}-port`}
              type="number"
              min={1}
              max={65535}
              placeholder="3000"
              value={value.port}
              onChange={(e) => set({ port: e.target.value })}
            />
          </FormField>
        </div>
      )}

      {value.deploymentMethod === "COMPOSE" && (
        <FormField
          id={`${idPrefix}-compose`}
          label="Compose file path"
          hint="Relative to the repository root."
          error={errors.composeFilePath}
        >
          <Input
            id={`${idPrefix}-compose`}
            className="font-mono text-xs"
            value={value.composeFilePath}
            onChange={(e) => set({ composeFilePath: e.target.value })}
          />
        </FormField>
      )}

      {value.deploymentMethod === "IMAGE" && (
        <div className="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <FormField id={`${idPrefix}-image`} label="Image" error={errors.imageName}>
            <Input
              id={`${idPrefix}-image`}
              className="font-mono text-xs"
              placeholder="ghcr.io/you/app:latest"
              value={value.imageName}
              onChange={(e) => set({ imageName: e.target.value })}
            />
          </FormField>
          <FormField id={`${idPrefix}-image-port`} label="Port" optional error={errors.port}>
            <Input
              id={`${idPrefix}-image-port`}
              type="number"
              min={1}
              max={65535}
              placeholder="8080"
              value={value.port}
              onChange={(e) => set({ port: e.target.value })}
            />
          </FormField>
        </div>
      )}
    </div>
  );
}
