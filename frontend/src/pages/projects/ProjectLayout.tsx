import { Link, NavLink, Outlet, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { PageContent } from "@/components/layout/PageContent";
import { projectQueryKey, type ProjectOutletContext } from "@/components/projects/project-context";
import { Button } from "@/components/ui/button";
import { PageLoadingState } from "@/components/ui/loading-state";
import { ROUTES, projectSectionPath, type ProjectSection } from "@/constants/routes";
import { getApiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import * as projectsService from "@/services/projects.service";

const tabs: Array<{ label: string; section?: ProjectSection; keepEnv?: boolean }> = [
  { label: "Overview" },
  { label: "Deployments", section: "deployments", keepEnv: true },
  { label: "Variables", section: "variables", keepEnv: true },
  { label: "Services", section: "services" },
  { label: "Settings", section: "settings" },
];

export function ProjectLayout() {
  const { id = "" } = useParams();
  const [searchParams] = useSearchParams();
  const envParam = searchParams.get("env") ?? undefined;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: projectQueryKey(id),
    queryFn: () => projectsService.getProject(id),
    enabled: Boolean(id),
  });

  const project = data?.project;

  if (isLoading) {
    return (
      <>
        <Header title="Project" breadcrumbs={[{ label: "Projects", to: ROUTES.PROJECTS }]} />
        <PageContent>
          <PageLoadingState label="Loading project" description="Fetching services and environments…" />
        </PageContent>
      </>
    );
  }

  if (isError || !project) {
    return (
      <>
        <Header
          title="Project not found"
          breadcrumbs={[{ label: "Projects", to: ROUTES.PROJECTS }, { label: "Not found" }]}
        />
        <PageContent>
          <p className="text-sm text-destructive">{getApiErrorMessage(error, "Project not found")}</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link to={ROUTES.PROJECTS}>Back to projects</Link>
          </Button>
        </PageContent>
      </>
    );
  }

  const context: ProjectOutletContext = { project };

  return (
    <>
      <Header
        title={project.name}
        description={project.description ?? undefined}
        breadcrumbs={[{ label: "Projects", to: ROUTES.PROJECTS }, { label: project.name }]}
        actions={
          <a
            href={`https://github.com/${project.repoFullName}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground sm:px-3"
          >
            <span className="hidden max-w-[140px] truncate font-mono sm:inline sm:max-w-[180px] lg:max-w-none">
              {project.repoFullName}
            </span>
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
          </a>
        }
        tabs={
          <nav
            className="-mb-px flex gap-1 overflow-x-auto [scrollbar-width:none]"
            aria-label="Project sections"
          >
            {tabs.map((tab) => (
              <NavLink
                key={tab.label}
                to={projectSectionPath(project.id, tab.section, tab.keepEnv ? envParam : undefined)}
                end={!tab.section}
                className={({ isActive }) =>
                  cn(
                    "whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>
        }
      />

      <div className="min-h-0 flex-1 overflow-auto">
        <PageContent>
          <Outlet context={context} />
        </PageContent>
      </div>
    </>
  );
}
