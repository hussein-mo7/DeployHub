import { ROUTES, projectSectionPath, serverSetupPath } from "@/constants/routes";
import type { ProjectDetail } from "@/types/projects.types";
import type { ServerSummary } from "@/types/servers.types";

export interface ChecklistStep {
  id: string;
  title: string;
  description: string;
  done: boolean;
  href?: string;
}

export function buildAccountFirstDeploySteps(input: {
  githubConnected: boolean;
  servers: ServerSummary[];
  projectCount: number;
  hasSuccessfulDeploy: boolean;
}): ChecklistStep[] {
  const onlineServer = input.servers.find((server) => server.status === "ONLINE");
  const needsSetupServer = input.servers.find(
    (server) => server.status !== "ONLINE" && server.status !== "UNHEALTHY",
  );

  return [
    {
      id: "github",
      title: "Connect GitHub",
      description: "Install the GitHub App so DeployHub can clone repos and receive webhooks.",
      done: input.githubConnected,
      href: ROUTES.SETTINGS_INTEGRATIONS,
    },
    {
      id: "server",
      title: "Add a server with an online agent",
      description: "Register a VPS and finish SSH or manual agent install until status is Online.",
      done: Boolean(onlineServer),
      href: onlineServer
        ? undefined
        : needsSetupServer
          ? serverSetupPath(needsSetupServer.id)
          : ROUTES.SERVER_NEW,
    },
    {
      id: "project",
      title: "Create a project",
      description: "Point at a GitHub repository and define how the app should build.",
      done: input.projectCount > 0,
      href: ROUTES.PROJECT_NEW,
    },
    {
      id: "deploy",
      title: "Run your first deploy",
      description: "Add a service and environment, then deploy and watch logs.",
      done: input.hasSuccessfulDeploy,
      href: input.projectCount > 0 ? ROUTES.PROJECTS : undefined,
    },
  ];
}

export function buildProjectFirstDeploySteps(input: {
  githubConnected: boolean;
  project: ProjectDetail;
  hasAnyDeployment: boolean;
}): ChecklistStep[] {
  const projectId = input.project.id;
  const hasService = input.project.services.length > 0;
  const onlineEnv = input.project.environments.find((env) => env.serverStatus === "ONLINE");
  const hasEnvironment = input.project.environments.length > 0;
  const pendingServerEnv = input.project.environments[0];

  return [
    {
      id: "github",
      title: "GitHub connected",
      description: "Required to clone this repository during deploys.",
      done: input.githubConnected,
      href: ROUTES.SETTINGS_INTEGRATIONS,
    },
    {
      id: "service",
      title: "Define a service",
      description: "Dockerfile, Compose, or pre-built image — how this repo is deployed.",
      done: hasService,
      href: projectSectionPath(projectId, "services/new"),
    },
    {
      id: "environment",
      title: "Bind an environment to an online server",
      description: "Pick branch and target server; agent must be Online.",
      done: Boolean(onlineEnv),
      href: !hasEnvironment
        ? projectSectionPath(projectId, "environments/new")
        : pendingServerEnv
          ? serverSetupPath(pendingServerEnv.serverId)
          : undefined,
    },
    {
      id: "deploy",
      title: "Run a deployment",
      description: hasEnvironment
        ? "Open Deployments and click Deploy."
        : "Create an environment first, then deploy.",
      done: input.hasAnyDeployment,
      href: hasEnvironment ? projectSectionPath(projectId, "deployments") : undefined,
    },
  ];
}

export function isChecklistComplete(steps: ChecklistStep[]): boolean {
  return steps.length > 0 && steps.every((step) => step.done);
}
