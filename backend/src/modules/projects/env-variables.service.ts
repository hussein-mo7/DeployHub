import type { EnvironmentVariable } from "@prisma/client";
import { deploymentQueue } from "../../config/queues.js";
import { prisma } from "../../config/database.js";
import { ERROR_CODES } from "../../constants/errors.js";
import { AppError } from "../../middleware/error.middleware.js";
import { decryptSecret, encryptSecret, SECRET_MASK } from "../../utils/encryption.js";
import type { SaveEnvironmentVariablesInput } from "./env-variables.schema.js";
import { getEnvironment } from "./projects.service.js";
import type { EnvironmentVariableSummary } from "./env-variables.types.js";

function toEnvironmentVariableSummary(variable: EnvironmentVariable): EnvironmentVariableSummary {
  const hasValue = variable.isSecret
    ? Boolean(variable.encryptedValue)
    : variable.value !== null && variable.value !== "";

  return {
    id: variable.id,
    environmentId: variable.environmentId,
    key: variable.key,
    value: variable.isSecret ? null : variable.value,
    maskedValue: variable.isSecret && hasValue ? SECRET_MASK : null,
    isSecret: variable.isSecret,
    hasValue,
    createdAt: variable.createdAt.toISOString(),
    updatedAt: variable.updatedAt.toISOString(),
  };
}

export async function listEnvironmentVariables(
  userId: string,
  projectId: string,
  environmentId: string,
): Promise<{ variables: EnvironmentVariableSummary[] }> {
  await getEnvironment(userId, projectId, environmentId);

  const variables = await prisma.environmentVariable.findMany({
    where: { environmentId },
    orderBy: { key: "asc" },
  });

  return { variables: variables.map(toEnvironmentVariableSummary) };
}

export async function saveEnvironmentVariables(
  userId: string,
  projectId: string,
  environmentId: string,
  input: SaveEnvironmentVariablesInput,
): Promise<{ variables: EnvironmentVariableSummary[]; redeployQueued: boolean }> {
  await getEnvironment(userId, projectId, environmentId);

  const existing = await prisma.environmentVariable.findMany({
    where: { environmentId },
  });
  const existingByKey = new Map(existing.map((variable) => [variable.key, variable]));

  const seenKeys = new Set<string>();
  for (const item of input.variables) {
    if (seenKeys.has(item.key)) {
      throw new AppError(
        400,
        `Duplicate key "${item.key}" in request`,
        ERROR_CODES.VALIDATION_ERROR,
      );
    }
    seenKeys.add(item.key);

    const current = existingByKey.get(item.key);
    const hasIncomingValue = item.value !== undefined && item.value !== "";

    if (item.isSecret) {
      if (!hasIncomingValue && !current?.encryptedValue) {
        throw new AppError(
          400,
          `Secret value is required for new key "${item.key}"`,
          ERROR_CODES.VALIDATION_ERROR,
        );
      }
    } else if (!hasIncomingValue && !current) {
      throw new AppError(
        400,
        `Value is required for new key "${item.key}"`,
        ERROR_CODES.VALIDATION_ERROR,
      );
    }
  }

  const saved = await prisma.$transaction(async (tx) => {
    await tx.environmentVariable.deleteMany({
      where: {
        environmentId,
        key: { notIn: input.variables.map((variable) => variable.key) },
      },
    });

    const results: EnvironmentVariable[] = [];

    for (const item of input.variables) {
      const current = existingByKey.get(item.key);
      const hasIncomingValue = item.value !== undefined && item.value !== "";

      let value: string | null = null;
      let encryptedValue: string | null = null;

      if (item.isSecret) {
        if (hasIncomingValue) {
          encryptedValue = encryptSecret(item.value!);
        } else if (current?.encryptedValue) {
          encryptedValue = current.encryptedValue;
        }
      } else {
        value = hasIncomingValue ? item.value! : (current?.value ?? null);
      }

      const variable = await tx.environmentVariable.upsert({
        where: {
          environmentId_key: {
            environmentId,
            key: item.key,
          },
        },
        create: {
          environmentId,
          key: item.key,
          isSecret: item.isSecret,
          value,
          encryptedValue,
        },
        update: {
          isSecret: item.isSecret,
          value,
          encryptedValue,
        },
      });

      results.push(variable);
    }

    return results;
  });

  let redeployQueued = false;
  if (input.redeploy) {
    await deploymentQueue.add(
      "deploy-environment",
      {
        projectId,
        environmentId,
        userId,
        trigger: "save-and-redeploy",
      },
      { jobId: `deploy-${environmentId}-${Date.now()}` },
    );
    redeployQueued = true;
  }

  return {
    variables: saved.map(toEnvironmentVariableSummary),
    redeployQueued,
  };
}

/** Internal helper for future deployment worker — decrypt secrets for agent. */
export async function getDecryptedEnvironmentVariables(
  environmentId: string,
): Promise<Record<string, string>> {
  const variables = await prisma.environmentVariable.findMany({
    where: { environmentId },
    orderBy: { key: "asc" },
  });

  const result: Record<string, string> = {};

  for (const variable of variables) {
    if (variable.isSecret) {
      if (!variable.encryptedValue) continue;
      result[variable.key] = decryptSecret(variable.encryptedValue);
    } else if (variable.value !== null) {
      result[variable.key] = variable.value;
    }
  }

  return result;
}
