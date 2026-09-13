export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  VERIFY_EMAIL: "/verify-email",
  VERIFY_EMAIL_SENT: "/verify-email/sent",
  DASHBOARD: "/dashboard",
  SERVERS: "/servers",
  SERVER_DETAIL: "/servers/:id",
  PROJECTS: "/projects",
  PROJECT_DETAIL: "/projects/:id",
  DEPLOYMENTS: "/deployments",
  SETTINGS: "/settings",
} as const;

export function serverDetailPath(id: string): string {
  return `/servers/${id}`;
}

export function projectDetailPath(id: string): string {
  return `/projects/${id}`;
}
