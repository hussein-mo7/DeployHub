export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  VERIFY_EMAIL: "/verify-email",
  VERIFY_EMAIL_SENT: "/verify-email/sent",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  DASHBOARD: "/dashboard",
  SERVERS: "/servers",
  SERVER_NEW: "/servers/new",
  SERVER_SETUP: "/servers/:id/setup",
  SERVER_DETAIL: "/servers/:id",
  PROJECTS: "/projects",
  PROJECT_DETAIL: "/projects/:id",
  DEPLOYMENTS: "/deployments",
  SETTINGS: "/settings",
  SETTINGS_PROFILE: "/settings/profile",
  SETTINGS_INTEGRATIONS: "/settings/integrations",
  SETTINGS_GITHUB: "/settings/github",
} as const;

export function serverDetailPath(id: string): string {
  return `/servers/${id}`;
}

export function serverSetupPath(id: string): string {
  return `/servers/${id}/setup`;
}

/** List/detail links: unfinished servers open the setup wizard. */
export function serverPrimaryPath(server: { id: string; status: string }): string {
  return server.status === "ONLINE" || server.status === "UNHEALTHY"
    ? serverDetailPath(server.id)
    : serverSetupPath(server.id);
}

export function projectDetailPath(id: string): string {
  return `/projects/${id}`;
}
