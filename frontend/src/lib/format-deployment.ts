import type { DeploymentSummary } from "@/types/deployments.types";

export function formatDeploymentTrigger(trigger: DeploymentSummary["trigger"]): string {
  if (trigger === "SAVE_AND_REDEPLOY") {
    return "save & redeploy";
  }
  if (trigger === "ROLLBACK") {
    return "rollback";
  }
  return trigger.toLowerCase();
}
