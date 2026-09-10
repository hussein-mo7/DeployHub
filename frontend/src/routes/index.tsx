import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { ROUTES } from "@/constants/routes";
import { DashboardPage } from "@/pages/dashboard/DashboardPage";
import {
  DeploymentsPage,
  LoginPage,
  ProjectsPage,
  RegisterPage,
  ServersPage,
  SettingsPage,
} from "@/pages/PlaceholderPages";

export function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />
      <Route path={ROUTES.REGISTER} element={<RegisterPage />} />

      <Route element={<AppShell />}>
        <Route index element={<Navigate to={ROUTES.DASHBOARD} replace />} />
        <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
        <Route path={ROUTES.SERVERS} element={<ServersPage />} />
        <Route path={ROUTES.PROJECTS} element={<ProjectsPage />} />
        <Route path={ROUTES.DEPLOYMENTS} element={<DeploymentsPage />} />
        <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
    </Routes>
  );
}
