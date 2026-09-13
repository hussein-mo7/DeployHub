export const DEPLOYMENT_METHODS = ["DOCKERFILE", "COMPOSE", "IMAGE"] as const;

export type DeploymentMethodValue = (typeof DEPLOYMENT_METHODS)[number];
