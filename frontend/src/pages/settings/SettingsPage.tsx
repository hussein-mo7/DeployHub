import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Github, User } from "lucide-react";
import { ButtonSpinner, SectionLoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/layout/EmptyState";
import { Header } from "@/components/layout/Header";
import { pagePaddingX } from "@/components/layout/PageContent";
import { PageSection, PageSectionHeader, PageSections } from "@/components/layout/PageSection";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatDateTime } from "@/lib/format-date";
import { changePasswordSchema, updateProfileSchema } from "@/lib/validations/auth.schema";
import { ROUTES } from "@/constants/routes";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { toastApiError, toastSuccess } from "@/lib/toast";
import * as authService from "@/services/auth.service";
import * as githubService from "@/services/github.service";
import { useAuthStore } from "@/stores/auth.store";

const integrationQueryKey = ["github", "integration"] as const;
const reposQueryKey = ["github", "repos"] as const;

type SettingsSection = "profile" | "integrations";

const navItems: { id: SettingsSection; label: string; icon: typeof User }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "integrations", label: "Integrations", icon: Github },
];

function sectionFromPath(pathname: string): SettingsSection {
  return pathname.startsWith(ROUTES.SETTINGS_INTEGRATIONS) ? "integrations" : "profile";
}

function initials(name?: string | null, email?: string | null): string {
  const source = name?.trim() || email?.trim() || "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function SettingsPage() {
  const { confirm } = useConfirm();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, updateProfile, logout, isLoading: profileSaving } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const section = sectionFromPath(location.pathname);
  const [banner, setBanner] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [nameField, setNameField] = useState(user?.name ?? "");
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [passwordFieldErrors, setPasswordFieldErrors] = useState<Record<string, string>>({});
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const passwordDirty =
    passwordForm.currentPassword.length > 0 ||
    passwordForm.newPassword.length > 0 ||
    passwordForm.confirmNewPassword.length > 0;

  useEffect(() => {
    setNameField(user?.name ?? "");
  }, [user?.name]);

  useEffect(() => {
    if (searchParams.get("github") === "connected") {
      setBanner("GitHub connected successfully.");
      toastSuccess("GitHub connected successfully.");
      if (section !== "integrations") {
        navigate(ROUTES.SETTINGS_INTEGRATIONS, { replace: true });
      }
      searchParams.delete("github");
      setSearchParams(searchParams, { replace: true });
      void queryClient.invalidateQueries({ queryKey: integrationQueryKey });
    }
  }, [navigate, queryClient, searchParams, section, setSearchParams]);

  const profileDirty = nameField.trim() !== (user?.name ?? "").trim();

  const {
    data: integrationData,
    isLoading: integrationLoading,
    isError: integrationError,
  } = useQuery({
    queryKey: integrationQueryKey,
    queryFn: githubService.getIntegration,
  });

  const integration = integrationData?.integration;
  const connected = integration?.connected === true;

  const { data: reposData, isLoading: reposLoading } = useQuery({
    queryKey: reposQueryKey,
    queryFn: () => githubService.listRepositories(20),
    enabled: connected,
  });

  const connectMutation = useMutation({
    mutationFn: githubService.getInstallUrl,
    onSuccess: ({ url }) => {
      setActionError(null);
      window.location.href = url;
    },
    onError: (err) => {
      const message = getApiErrorMessage(err, "Could not start GitHub install");
      setActionError(message);
      toastApiError(err, "Could not start GitHub install");
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: githubService.disconnectGitHub,
    onSuccess: () => {
      setActionError(null);
      toastSuccess("GitHub disconnected.");
      void queryClient.invalidateQueries({ queryKey: integrationQueryKey });
      void queryClient.removeQueries({ queryKey: reposQueryKey });
    },
    onError: (err) => {
      const message = getApiErrorMessage(err, "Failed to disconnect GitHub");
      setActionError(message);
      toastApiError(err, "Failed to disconnect GitHub");
    },
  });

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    const parsed = updateProfileSchema.safeParse({ name: nameField });
    if (!parsed.success) {
      setProfileError(parsed.error.errors[0]?.message ?? "Invalid name");
      return;
    }

    try {
      await updateProfile(parsed.data);
      setProfileSuccess("Profile updated.");
      toastSuccess("Profile updated.");
    } catch (err) {
      const message = getApiErrorMessage(err, "Failed to update profile");
      setProfileError(message);
      toastApiError(err, message);
    }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordFieldErrors({});

    const parsed = changePasswordSchema.safeParse(passwordForm);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      parsed.error.errors.forEach((issue) => {
        if (issue.path[0]) {
          errors[String(issue.path[0])] = issue.message;
        }
      });
      setPasswordFieldErrors(errors);
      return;
    }

    setPasswordSaving(true);
    try {
      await authService.changePassword(parsed.data);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
      await logout();
      navigate(ROUTES.LOGIN, {
        replace: true,
        state: { message: "Password updated. Sign in with your new password." },
      });
    } catch (err) {
      const message = getApiErrorMessage(err, "Failed to update password");
      setPasswordError(message);
      toastApiError(err, message);
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <>
      <Header
        title="Settings"
        description="Manage your profile and connections used for deployments."
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-auto">
        {banner && (
          <div
            className={cn(
              "border-b border-primary/20 bg-primary/5 py-3 text-sm text-foreground",
              pagePaddingX,
            )}
          >
            {banner}
          </div>
        )}

        <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(220px,260px)_1fr]">
          <aside
            className={cn(
              "border-b border-border/80 py-4 lg:border-b-0 lg:border-r lg:py-6",
              pagePaddingX,
            )}
          >
                <p className="mb-3 hidden px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground lg:block">
                  Settings
                </p>
                <nav aria-label="Settings sections">
                  <ul className="flex gap-1 overflow-x-auto pb-0.5 lg:flex-col lg:gap-0.5 lg:overflow-visible">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const active = section === item.id;
                      return (
                        <li key={item.id} className="shrink-0 lg:shrink">
                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                item.id === "integrations"
                                  ? ROUTES.SETTINGS_INTEGRATIONS
                                  : ROUTES.SETTINGS_PROFILE,
                              )
                            }
                            className={cn(
                              "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors lg:px-3",
                              active
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                            )}
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            {item.label}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </nav>
          </aside>

          <div className={cn("min-w-0 py-5 sm:py-6 lg:py-8", pagePaddingX)}>
            {actionError && section === "integrations" && (
              <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {actionError}
              </div>
            )}

            {section === "profile" && (
              <PageSections>
                <PageSection>
                  <PageSectionHeader
                    title="Profile"
                    description="Your display name in DeployHub. Email changes are not supported yet."
                  />
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                        {initials(nameField || user?.name, user?.email)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">
                          {nameField || user?.name || "—"}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">{user?.email ?? "—"}</p>
                        {user?.createdAt && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Member since {formatDateTime(user.createdAt)}
                          </p>
                        )}
                      </div>
                  </div>

                  <form onSubmit={(e) => void handleProfileSubmit(e)} className="space-y-4">
                    <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-2">
                      <FormField id="profile-name" label="Display name" error={profileError ?? undefined}>
                        <Input
                          id="profile-name"
                          value={nameField}
                          onChange={(e) => {
                            setNameField(e.target.value);
                            setProfileSuccess(null);
                          }}
                        />
                      </FormField>
                      <FormField
                        id="profile-email"
                        label="Email"
                        hint="Sign-in email is fixed for this account."
                      >
                        <Input id="profile-email" value={user?.email ?? ""} disabled />
                      </FormField>
                    </div>

                    {profileSuccess && !profileDirty && (
                      <p className="text-sm text-emerald-700">{profileSuccess}</p>
                    )}

                    <div className="flex flex-wrap gap-2 pt-2">
                      {profileDirty && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setNameField(user?.name ?? "");
                            setProfileError(null);
                            setProfileSuccess(null);
                          }}
                        >
                          Cancel
                        </Button>
                      )}
                      <Button type="submit" size="sm" disabled={!profileDirty || profileSaving}>
                        {profileSaving ? (
                          <>
                            <ButtonSpinner className="mr-2" />
                            Saving…
                          </>
                        ) : (
                          "Save changes"
                        )}
                      </Button>
                    </div>
                  </form>
                </PageSection>

                <PageSection>
                  <PageSectionHeader
                    title="Password"
                    description="Update your sign-in password. You must enter your current password to save a new one."
                  />
                  <form onSubmit={(e) => void handlePasswordSubmit(e)} className="space-y-4">
                    <div className="grid max-w-4xl gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      <FormField
                        id="current-password"
                        label="Current password"
                        error={passwordFieldErrors.currentPassword}
                      >
                        <Input
                          id="current-password"
                          type="password"
                          autoComplete="current-password"
                          value={passwordForm.currentPassword}
                          onChange={(e) =>
                            setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                          }
                        />
                      </FormField>
                      <FormField
                        id="settings-new-password"
                        label="New password"
                        error={passwordFieldErrors.newPassword}
                      >
                        <Input
                          id="settings-new-password"
                          type="password"
                          autoComplete="new-password"
                          value={passwordForm.newPassword}
                          onChange={(e) =>
                            setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                          }
                        />
                      </FormField>
                      <FormField
                        id="settings-confirm-password"
                        label="Confirm new password"
                        error={passwordFieldErrors.confirmNewPassword}
                      >
                        <Input
                          id="settings-confirm-password"
                          type="password"
                          autoComplete="new-password"
                          value={passwordForm.confirmNewPassword}
                          onChange={(e) =>
                            setPasswordForm({
                              ...passwordForm,
                              confirmNewPassword: e.target.value,
                            })
                          }
                        />
                      </FormField>
                    </div>

                    {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}

                    <p className="text-xs text-muted-foreground">
                      Don&apos;t know your current password?{" "}
                      <Link
                        to={ROUTES.FORGOT_PASSWORD}
                        className="font-medium text-primary hover:underline"
                      >
                        Reset via email
                      </Link>
                    </p>

                    <div className="flex flex-wrap gap-2 pt-2">
                      {passwordDirty && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setPasswordForm({
                              currentPassword: "",
                              newPassword: "",
                              confirmNewPassword: "",
                            });
                            setPasswordFieldErrors({});
                            setPasswordError(null);
                          }}
                        >
                          Cancel
                        </Button>
                      )}
                      <Button type="submit" size="sm" disabled={!passwordDirty || passwordSaving}>
                        {passwordSaving ? (
                          <>
                            <ButtonSpinner className="mr-2" />
                            Updating…
                          </>
                        ) : (
                          "Update password"
                        )}
                      </Button>
                    </div>
                  </form>
                </PageSection>
              </PageSections>
            )}

            {section === "integrations" && (
              <PageSection>
                <PageSectionHeader
                  title={
                    <span className="inline-flex items-center gap-2">
                      <Github className="h-4 w-4" />
                      GitHub App
                    </span>
                  }
                  description="Required to clone private repositories during deploys and to receive push webhooks for auto deploy."
                  actions={
                    connected ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                        Connected
                      </span>
                    ) : (
                      !integrationLoading && (
                        <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                          Not connected
                        </span>
                      )
                    )
                  }
                />

                    {integrationLoading && (
                      <SectionLoadingState label="Loading GitHub integration…" />
                    )}
                    {integrationError && (
                      <p className="text-sm text-destructive">Could not load GitHub status.</p>
                    )}
                    {!integrationLoading && !connected && (
                      <EmptyState
                        icon={Github}
                        title="Connect GitHub"
                        description="Install the DeployHub GitHub App on your account or organization, then return here."
                        action={
                          <Button
                            size="sm"
                            disabled={connectMutation.isPending}
                            onClick={() => connectMutation.mutate()}
                          >
                            {connectMutation.isPending ? (
                              <>
                                <ButtonSpinner className="mr-2" />
                                Redirecting…
                              </>
                            ) : (
                              "Connect GitHub"
                            )}
                          </Button>
                        }
                      />
                    )}
                    {connected && integration && (
                      <>
                        <dl className="grid gap-4 rounded-lg border bg-muted/10 p-4 text-sm sm:grid-cols-2 xl:grid-cols-4">
                          <div>
                            <dt className="text-xs text-muted-foreground">Account</dt>
                            <dd className="font-medium">{integration.accountLogin}</dd>
                          </div>
                          <div>
                            <dt className="text-xs text-muted-foreground">Type</dt>
                            <dd className="font-medium">{integration.accountType}</dd>
                          </div>
                          <div>
                            <dt className="text-xs text-muted-foreground">Installation ID</dt>
                            <dd className="font-mono text-xs">{integration.installationId}</dd>
                          </div>
                          {integration.connectedAt && (
                            <div>
                              <dt className="text-xs text-muted-foreground">Connected</dt>
                              <dd>{formatDateTime(integration.connectedAt)}</dd>
                            </div>
                          )}
                        </dl>

                        <div>
                          <p className="mb-2 text-sm font-medium">Repository access (sample)</p>
                          {reposLoading && (
                            <SectionLoadingState label="Loading repositories…" className="py-4" />
                          )}
                          {!reposLoading && reposData?.repositories.length === 0 && (
                            <p className="text-sm text-muted-foreground">
                              No repositories returned — check GitHub App permissions.
                            </p>
                          )}
                          {reposData && reposData.repositories.length > 0 && (
                            <div className="overflow-hidden rounded-lg border">
                              <ul className="max-h-64 divide-y overflow-y-auto text-sm xl:max-h-80">
                                {reposData.repositories.map((repo) => (
                                  <li
                                    key={repo.id}
                                    className="flex items-center justify-between gap-4 bg-card px-4 py-2.5 hover:bg-muted/30"
                                  >
                                    <span className="min-w-0 truncate font-mono text-xs">
                                      {repo.fullName}
                                    </span>
                                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                      {repo.defaultBranch}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-destructive/40 text-destructive hover:bg-destructive/10"
                            disabled={disconnectMutation.isPending}
                            onClick={() => {
                              void (async () => {
                                const confirmed = await confirm({
                                  title: "Disconnect GitHub",
                                  description:
                                    "DeployHub will stop cloning this account’s repositories. Deploys cannot run until you reconnect.",
                                  confirmLabel: "Disconnect",
                                });
                                if (confirmed) {
                                  disconnectMutation.mutate();
                                }
                              })();
                            }}
                          >
                            {disconnectMutation.isPending ? "Disconnecting…" : "Disconnect"}
                          </Button>
                        </div>
                      </>
                    )}
              </PageSection>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
