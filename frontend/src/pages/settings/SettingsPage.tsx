import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Github, Loader2, User } from "lucide-react";
import { EmptyState } from "@/components/layout/EmptyState";
import { Header } from "@/components/layout/Header";
import { PageContent } from "@/components/layout/PageContent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatDateTime } from "@/lib/format-date";
import { changePasswordSchema, updateProfileSchema } from "@/lib/validations/auth.schema";
import { ROUTES } from "@/constants/routes";
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

function initials(name?: string | null, email?: string | null): string {
  const source = name?.trim() || email?.trim() || "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function SettingsPage() {
  const navigate = useNavigate();
  const { user, updateProfile, logout, isLoading: profileSaving } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [section, setSection] = useState<SettingsSection>("profile");
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
      setSection("integrations");
      searchParams.delete("github");
      setSearchParams(searchParams, { replace: true });
      void queryClient.invalidateQueries({ queryKey: integrationQueryKey });
    }
  }, [queryClient, searchParams, setSearchParams]);

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
      setActionError(getApiErrorMessage(err, "Could not start GitHub install"));
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: githubService.disconnectGitHub,
    onSuccess: () => {
      setActionError(null);
      void queryClient.invalidateQueries({ queryKey: integrationQueryKey });
      void queryClient.removeQueries({ queryKey: reposQueryKey });
    },
    onError: (err) => {
      setActionError(getApiErrorMessage(err, "Failed to disconnect GitHub"));
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
    } catch (err) {
      setProfileError(getApiErrorMessage(err, "Failed to update profile"));
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
      setPasswordError(getApiErrorMessage(err, "Failed to update password"));
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

      <div className="min-h-0 flex-1 overflow-auto">
        <PageContent>
          {banner && (
            <div className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground">
              {banner}
            </div>
          )}

          <div className="w-full overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="grid lg:grid-cols-[minmax(200px,260px)_1fr]">
              <aside className="border-b bg-muted/15 px-3 py-4 lg:border-b-0 lg:border-r lg:px-4 lg:py-5">
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
                            onClick={() => setSection(item.id)}
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

              <div className="min-w-0 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
                {actionError && section === "integrations" && (
                  <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {actionError}
                  </div>
                )}

                {section === "profile" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-base font-semibold text-foreground">Profile</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Your display name in DeployHub. Email changes are not supported yet.
                      </p>
                    </div>

                    <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center">
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
                      <div className="grid gap-4 sm:grid-cols-2 lg:max-w-3xl">
                        <div className="space-y-2">
                          <Label htmlFor="profile-name">Display name</Label>
                          <Input
                            id="profile-name"
                            value={nameField}
                            onChange={(e) => {
                              setNameField(e.target.value);
                              setProfileSuccess(null);
                            }}
                          />
                          {profileError && (
                            <p className="text-xs text-destructive">{profileError}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="profile-email">Email</Label>
                          <Input
                            id="profile-email"
                            value={user?.email ?? ""}
                            disabled
                            className="bg-muted/50"
                          />
                          <p className="text-xs text-muted-foreground">
                            Sign-in email is fixed for this account.
                          </p>
                        </div>
                      </div>

                      {profileSuccess && !profileDirty && (
                        <p className="text-sm text-emerald-700">{profileSuccess}</p>
                      )}

                      <div className="flex flex-wrap gap-2 border-t border-border pt-4">
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
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Saving…
                            </>
                          ) : (
                            "Save changes"
                          )}
                        </Button>
                      </div>
                    </form>

                    <div className="space-y-4 border-t border-border pt-8">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">Password</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Update your sign-in password. You must enter your current password to save a
                          new one.
                        </p>
                      </div>

                      <form onSubmit={(e) => void handlePasswordSubmit(e)} className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                          <div className="space-y-2">
                            <Label htmlFor="current-password">Current password</Label>
                            <Input
                              id="current-password"
                              type="password"
                              autoComplete="current-password"
                              value={passwordForm.currentPassword}
                              onChange={(e) =>
                                setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                              }
                            />
                            {passwordFieldErrors.currentPassword && (
                              <p className="text-xs text-destructive">
                                {passwordFieldErrors.currentPassword}
                              </p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="settings-new-password">New password</Label>
                            <Input
                              id="settings-new-password"
                              type="password"
                              autoComplete="new-password"
                              value={passwordForm.newPassword}
                              onChange={(e) =>
                                setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                              }
                            />
                            {passwordFieldErrors.newPassword && (
                              <p className="text-xs text-destructive">
                                {passwordFieldErrors.newPassword}
                              </p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="settings-confirm-password">Confirm new password</Label>
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
                            {passwordFieldErrors.confirmNewPassword && (
                              <p className="text-xs text-destructive">
                                {passwordFieldErrors.confirmNewPassword}
                              </p>
                            )}
                          </div>
                        </div>

                        {passwordError && (
                          <p className="text-sm text-destructive">{passwordError}</p>
                        )}

                        <p className="text-xs text-muted-foreground">
                          Don&apos;t know your current password?{" "}
                          <Link
                            to={ROUTES.FORGOT_PASSWORD}
                            className="font-medium text-primary hover:underline"
                          >
                            Reset via email
                          </Link>
                        </p>

                        <div className="flex flex-wrap gap-2 border-t border-border pt-4">
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
                          <Button
                            type="submit"
                            size="sm"
                            disabled={!passwordDirty || passwordSaving}
                          >
                            {passwordSaving ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Updating…
                              </>
                            ) : (
                              "Update password"
                            )}
                          </Button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {section === "integrations" && (
                  <div className="space-y-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                          <Github className="h-4 w-4" />
                          GitHub App
                        </h2>
                        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                          Required to clone private repositories during deploys and to receive push
                          webhooks for auto deploy.
                        </p>
                      </div>
                      {connected ? (
                        <span className="inline-flex w-fit shrink-0 items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                          Connected
                        </span>
                      ) : (
                        !integrationLoading && (
                          <span className="inline-flex w-fit shrink-0 items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                            Not connected
                          </span>
                        )
                      )}
                    </div>

                    {integrationLoading && (
                      <p className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading integration…
                      </p>
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
                                <Loader2 className="h-4 w-4 animate-spin" />
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
                            <p className="text-sm text-muted-foreground">Loading repositories…</p>
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
                              if (
                                window.confirm(
                                  "Disconnect GitHub? Deploys cannot clone until you reconnect.",
                                )
                              ) {
                                disconnectMutation.mutate();
                              }
                            }}
                          >
                            {disconnectMutation.isPending ? "Disconnecting…" : "Disconnect"}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </PageContent>
      </div>
    </>
  );
}
