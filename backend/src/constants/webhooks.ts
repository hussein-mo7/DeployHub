export const WEBHOOK_QUEUE_JOB = "process-github-push";

export type GithubPushWebhookJob = {
  deliveryId: string;
  userId: string;
  projectId: string;
  environmentId: string;
  repoOwner: string;
  repoName: string;
  branch: string;
};
