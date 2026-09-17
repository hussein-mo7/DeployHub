import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { ROUTES } from "@/constants/routes";
import { DashboardPage } from "@/pages/dashboard/DashboardPage";
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "@/pages/auth/ResetPasswordPage";
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { VerifyEmailPage } from "@/pages/auth/VerifyEmailPage";
import { VerifyEmailSentPage } from "@/pages/auth/VerifyEmailSentPage";
import { DeploymentsPage } from "@/pages/deployments/DeploymentsPage";
import { SettingsPage } from "@/pages/settings/SettingsPage";
import { ProjectDetailPage } from "@/pages/projects/ProjectDetailPage";
import { ProjectsPage } from "@/pages/projects/ProjectsPage";
import { ServerDetailPage } from "@/pages/servers/ServerDetailPage";
import { ServersPage } from "@/pages/servers/ServersPage";
import { ProtectedRoute, PublicRoute } from "@/routes/ProtectedRoute";

export function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.VERIFY_EMAIL} element={<VerifyEmailPage />} />
      <Route path={ROUTES.VERIFY_EMAIL_SENT} element={<VerifyEmailSentPage />} />
      <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />

      <Route element={<PublicRoute />}>
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
        <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to={ROUTES.DASHBOARD} replace />} />
          <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
          <Route path={ROUTES.SERVERS} element={<ServersPage />} />
          <Route path={ROUTES.SERVER_DETAIL} element={<ServerDetailPage />} />
          <Route path={ROUTES.PROJECTS} element={<ProjectsPage />} />
          <Route path={ROUTES.PROJECT_DETAIL} element={<ProjectDetailPage />} />
          <Route path={ROUTES.DEPLOYMENTS} element={<DeploymentsPage />} />
          <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
          <Route
            path={ROUTES.SETTINGS_GITHUB}
            element={<Navigate to={`${ROUTES.SETTINGS}?github=connected`} replace />}
          />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
    </Routes>
  );
}
