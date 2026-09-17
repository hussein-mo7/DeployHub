import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Container, GitBranch, Rocket, Server } from "lucide-react";
import { cn } from "@/lib/utils";

const highlights = [
  {
    icon: Server,
    title: "Your VPS, your apps",
    description: "Install a lightweight agent on Linux servers you control.",
  },
  {
    icon: Container,
    title: "Docker-first",
    description: "Dockerfile, Compose, or pre-built images — one control panel.",
  },
  {
    icon: GitBranch,
    title: "GitHub-native",
    description: "Connect repos, deploy branches, auto-deploy on push.",
  },
  {
    icon: Rocket,
    title: "Observable deploys",
    description: "Live logs, health checks, and rollback when you need it.",
  },
] as const;

interface AuthLayoutProps {
  children: ReactNode;
  /** Optional narrow max width for very short forms */
  className?: string;
}

export function AuthLayout({ children, className }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className="relative hidden overflow-hidden border-r border-border bg-card lg:flex lg:w-[44%] xl:w-[40%] xl:max-w-xl"
        aria-hidden={false}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/30" />
        <div className="relative flex w-full flex-col justify-between p-10 xl:p-12">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground shadow-sm">
                D
              </div>
              <div>
                <p className="text-lg font-semibold tracking-tight text-foreground">DeployHub</p>
                <p className="text-xs text-muted-foreground">Self-hosted deployments</p>
              </div>
            </div>
          </div>

          <div className="space-y-8 py-8">
            <div>
              <h1 className="text-2xl font-semibold leading-tight tracking-tight text-foreground xl:text-3xl">
                Ship to your infrastructure
              </h1>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                A control plane for Docker on your VPS — without handing your servers to a black-box
                platform.
              </p>
            </div>

            <ul className="space-y-5">
              {highlights.map(({ icon: Icon, title, description }) => (
                <li key={title} className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border/80 bg-background/80 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{title}</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-muted-foreground">
            DeployHub · Control plane + agent · MVP
          </p>
        </div>
      </aside>

      <main className="flex flex-1 flex-col justify-center px-6 py-10 sm:px-10 lg:px-14">
        <div className={cn("mx-auto w-full max-w-[420px]", className)}>
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
              D
            </div>
            <span className="font-semibold tracking-tight">DeployHub</span>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

interface AuthPageHeaderProps {
  title: string;
  description: string;
}

export function AuthPageHeader({ title, description }: AuthPageHeaderProps) {
  return (
    <div className="mb-8 space-y-2">
      <h2 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
      <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}

export function AuthAlert({
  variant,
  children,
}: {
  variant: "error" | "success" | "info";
  children: ReactNode;
}) {
  const styles = {
    error: "border-destructive/30 bg-destructive/10 text-destructive",
    success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-800",
    info: "border-border bg-muted/50 text-foreground",
  }[variant];

  return (
    <div className={cn("rounded-lg border px-3 py-2.5 text-sm leading-relaxed", styles)}>
      {children}
    </div>
  );
}

export function AuthFooterLink({
  prompt,
  linkText,
  to,
}: {
  prompt: string;
  linkText: string;
  to: string;
}) {
  return (
    <p className="mt-8 text-center text-sm text-muted-foreground">
      {prompt}{" "}
      <Link to={to} className="font-medium text-primary hover:underline">
        {linkText}
      </Link>
    </p>
  );
}
