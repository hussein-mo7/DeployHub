export const BOOTSTRAP_QUEUE_NAME = "server-bootstrap";
export const BOOTSTRAP_QUEUE_JOB = "run";

/** Max bootstrap jobs per user per hour (Redis counter). */
export const BOOTSTRAP_RATE_LIMIT_PER_HOUR = 10;

export const BOOTSTRAP_UI_CHANNEL = "deployhub:server:bootstrap:ui";
