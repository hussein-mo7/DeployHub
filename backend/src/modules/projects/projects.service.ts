import type { Environment, Project, Service } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { prisma } from "../../config/database.js";
import { ERROR_CODES } from "../../constants/errors.js";
import { AppError } from "../../middleware/error.middleware.js";
import type {
  CreateEnvironmentInput,
  CreateProjectInput,
  CreateServiceInput,
  UpdateEnvironmentInput,
  UpdateProjectInput,
  UpdateServiceInput,
} from "./projects.schema.js";
import type {
  EnvironmentSummary,
  ProjectDetail,
  ProjectSummary,
  ServiceSummary,
} from "./projects.types.js";

function toProjectSummary(
  project: Project & { _count: { services: number; environments: number } },
): ProjectSummary {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    repoOwner: project.repoOwner,
    repoName: project.repoName,
    repoFullName: `${project.repoOwner}/${project.repoName}`,
    serviceCount: project._count.services,
    environmentCount: project._count.environments,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}

function toServiceSummary(service: Service): ServiceSummary {
  return {
    id: service.id,
    projectId: service.projectId,
    name: service.name,
    description: service.description,
    deploymentMethod: service.deploymentMethod,
    dockerfilePath: service.dockerfilePath,
    composeFilePath: service.composeFilePath,
    imageName: service.imageName,
    buildContext: service.buildContext,
    port: service.port,
    healthCheckPath: service.healthCheckPath,
    healthCheckEnabled: service.healthCheckEnabled,
    createdAt: service.createdAt.toISOString(),
    updatedAt: service.updatedAt.toISOString(),
  };
}

function toEnvironmentSummary(
  environment: Environment & { server: { name: string; status: string } },
): EnvironmentSummary {
  return {
    id: environment.id,
    projectId: environment.projectId,
    name: environment.name,
    serverId: environment.serverId,
    serverName: environment.server.name,
    serverStatus: environment.server.status,
    branch: environment.branch,
    autoDeployEnabled: environment.autoDeployEnabled,
    createdAt: environment.createdAt.toISOString(),
    updatedAt: environment.updatedAt.toISOString(),
  };
}

export async function getOwnedProject(userId: string, projectId: string): Promise<Project> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
  });

  if (!project) {
    throw new AppError(404, "Project not found", ERROR_CODES.PROJECT_NOT_FOUND);
  }

  return project;
}

async function assertOwnedServer(userId: string, serverId: string): Promise<void> {
  const server = await prisma.server.findFirst({
    where: { id: serverId, userId },
  });

  if (!server) {
    throw new AppError(404, "Server not found", ERROR_CODES.SERVER_NOT_FOUND);
  }
}

function handleUniqueConstraint(error: unknown, code: string, message: string): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    throw new AppError(409, message, code);
  }
  throw error;
}

export async function createProject(
  userId: string,
  input: CreateProjectInput,
): Promise<{ project: ProjectSummary }> {
  try {
    const project = await prisma.project.create({
      data: {
        userId,
        name: input.name,
        description: input.description,
        repoOwner: input.repoOwner,
        repoName: input.repoName,
      },
      include: {
        _count: { select: { services: true, environments: true } },
      },
    });

    return { project: toProjectSummary(project) };
  } catch (error) {
    handleUniqueConstraint(error, ERROR_CODES.PROJECT_NAME_IN_USE, "Project name already in use");
  }
}

export async function listProjects(userId: string): Promise<{ projects: ProjectSummary[] }> {
  const projects = await prisma.project.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { services: true, environments: true } },
    },
  });

  return { projects: projects.map(toProjectSummary) };
}

export async function getProject(userId: string, projectId: string): Promise<{ project: ProjectDetail }> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    include: {
      services: { orderBy: { createdAt: "asc" } },
      environments: {
        orderBy: { createdAt: "asc" },
        include: { server: { select: { name: true, status: true } } },
      },
      _count: { select: { services: true, environments: true } },
    },
  });

  if (!project) {
    throw new AppError(404, "Project not found", ERROR_CODES.PROJECT_NOT_FOUND);
  }

  const summary = toProjectSummary(project);

  return {
    project: {
      ...summary,
      services: project.services.map(toServiceSummary),
      environments: project.environments.map(toEnvironmentSummary),
    },
  };
}

export async function updateProject(
  userId: string,
  projectId: string,
  input: UpdateProjectInput,
): Promise<{ project: ProjectSummary }> {
  await getOwnedProject(userId, projectId);

  try {
    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.repoOwner !== undefined ? { repoOwner: input.repoOwner } : {}),
        ...(input.repoName !== undefined ? { repoName: input.repoName } : {}),
      },
      include: {
        _count: { select: { services: true, environments: true } },
      },
    });

    return { project: toProjectSummary(project) };
  } catch (error) {
    handleUniqueConstraint(error, ERROR_CODES.PROJECT_NAME_IN_USE, "Project name already in use");
  }
}

export async function deleteProject(
  userId: string,
  projectId: string,
): Promise<{ message: string }> {
  await getOwnedProject(userId, projectId);
  await prisma.project.delete({ where: { id: projectId } });
  return { message: "Project deleted successfully" };
}

export async function createService(
  userId: string,
  projectId: string,
  input: CreateServiceInput,
): Promise<{ service: ServiceSummary }> {
  await getOwnedProject(userId, projectId);

  try {
    const service = await prisma.service.create({
      data: {
        projectId,
        name: input.name,
        description: input.description,
        deploymentMethod: input.deploymentMethod,
        dockerfilePath: input.dockerfilePath,
        composeFilePath: input.composeFilePath,
        imageName: input.imageName,
        buildContext: input.buildContext,
        port: input.port,
        healthCheckPath: input.healthCheckPath,
        healthCheckEnabled: input.healthCheckEnabled,
      },
    });

    return { service: toServiceSummary(service) };
  } catch (error) {
    handleUniqueConstraint(
      error,
      ERROR_CODES.SERVICE_NAME_IN_USE,
      "Service name already exists in this project",
    );
  }
}

export async function listServices(
  userId: string,
  projectId: string,
): Promise<{ services: ServiceSummary[] }> {
  await getOwnedProject(userId, projectId);

  const services = await prisma.service.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
  });

  return { services: services.map(toServiceSummary) };
}

export async function getService(
  userId: string,
  projectId: string,
  serviceId: string,
): Promise<{ service: ServiceSummary }> {
  await getOwnedProject(userId, projectId);

  const service = await prisma.service.findFirst({
    where: { id: serviceId, projectId },
  });

  if (!service) {
    throw new AppError(404, "Service not found", ERROR_CODES.SERVICE_NOT_FOUND);
  }

  return { service: toServiceSummary(service) };
}

export async function updateService(
  userId: string,
  projectId: string,
  serviceId: string,
  input: UpdateServiceInput,
): Promise<{ service: ServiceSummary }> {
  await getService(userId, projectId, serviceId);

  if (input.deploymentMethod === "IMAGE" && input.imageName === null) {
    throw new AppError(
      400,
      "imageName is required for IMAGE deployment method",
      ERROR_CODES.INVALID_DEPLOYMENT_METHOD,
    );
  }

  try {
    const service = await prisma.service.update({
      where: { id: serviceId },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.deploymentMethod !== undefined
          ? { deploymentMethod: input.deploymentMethod }
          : {}),
        ...(input.dockerfilePath !== undefined ? { dockerfilePath: input.dockerfilePath } : {}),
        ...(input.composeFilePath !== undefined ? { composeFilePath: input.composeFilePath } : {}),
        ...(input.imageName !== undefined ? { imageName: input.imageName } : {}),
        ...(input.buildContext !== undefined ? { buildContext: input.buildContext } : {}),
        ...(input.port !== undefined ? { port: input.port } : {}),
        ...(input.healthCheckPath !== undefined ? { healthCheckPath: input.healthCheckPath } : {}),
        ...(input.healthCheckEnabled !== undefined
          ? { healthCheckEnabled: input.healthCheckEnabled }
          : {}),
      },
    });

    if (service.deploymentMethod === "IMAGE" && !service.imageName) {
      throw new AppError(
        400,
        "imageName is required for IMAGE deployment method",
        ERROR_CODES.INVALID_DEPLOYMENT_METHOD,
      );
    }

    return { service: toServiceSummary(service) };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    handleUniqueConstraint(
      error,
      ERROR_CODES.SERVICE_NAME_IN_USE,
      "Service name already exists in this project",
    );
  }
}

export async function deleteService(
  userId: string,
  projectId: string,
  serviceId: string,
): Promise<{ message: string }> {
  await getService(userId, projectId, serviceId);
  await prisma.service.delete({ where: { id: serviceId } });
  return { message: "Service deleted successfully" };
}

export async function createEnvironment(
  userId: string,
  projectId: string,
  input: CreateEnvironmentInput,
): Promise<{ environment: EnvironmentSummary }> {
  await getOwnedProject(userId, projectId);
  await assertOwnedServer(userId, input.serverId);

  try {
    const environment = await prisma.environment.create({
      data: {
        projectId,
        name: input.name,
        serverId: input.serverId,
        branch: input.branch,
        autoDeployEnabled: input.autoDeployEnabled,
      },
      include: { server: { select: { name: true, status: true } } },
    });

    return { environment: toEnvironmentSummary(environment) };
  } catch (error) {
    handleUniqueConstraint(
      error,
      ERROR_CODES.ENVIRONMENT_NAME_IN_USE,
      "Environment name already exists in this project",
    );
  }
}

export async function listEnvironments(
  userId: string,
  projectId: string,
): Promise<{ environments: EnvironmentSummary[] }> {
  await getOwnedProject(userId, projectId);

  const environments = await prisma.environment.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
    include: { server: { select: { name: true, status: true } } },
  });

  return { environments: environments.map(toEnvironmentSummary) };
}

export async function getEnvironment(
  userId: string,
  projectId: string,
  environmentId: string,
): Promise<{ environment: EnvironmentSummary }> {
  await getOwnedProject(userId, projectId);

  const environment = await prisma.environment.findFirst({
    where: { id: environmentId, projectId },
    include: { server: { select: { name: true, status: true } } },
  });

  if (!environment) {
    throw new AppError(404, "Environment not found", ERROR_CODES.ENVIRONMENT_NOT_FOUND);
  }

  return { environment: toEnvironmentSummary(environment) };
}

export async function updateEnvironment(
  userId: string,
  projectId: string,
  environmentId: string,
  input: UpdateEnvironmentInput,
): Promise<{ environment: EnvironmentSummary }> {
  await getEnvironment(userId, projectId, environmentId);

  if (input.serverId) {
    await assertOwnedServer(userId, input.serverId);
  }

  try {
    const environment = await prisma.environment.update({
      where: { id: environmentId },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.serverId !== undefined ? { serverId: input.serverId } : {}),
        ...(input.branch !== undefined ? { branch: input.branch } : {}),
        ...(input.autoDeployEnabled !== undefined
          ? { autoDeployEnabled: input.autoDeployEnabled }
          : {}),
      },
      include: { server: { select: { name: true, status: true } } },
    });

    return { environment: toEnvironmentSummary(environment) };
  } catch (error) {
    handleUniqueConstraint(
      error,
      ERROR_CODES.ENVIRONMENT_NAME_IN_USE,
      "Environment name already exists in this project",
    );
  }
}

export async function deleteEnvironment(
  userId: string,
  projectId: string,
  environmentId: string,
): Promise<{ message: string }> {
  await getEnvironment(userId, projectId, environmentId);
  await prisma.environment.delete({ where: { id: environmentId } });
  return { message: "Environment deleted successfully" };
}
