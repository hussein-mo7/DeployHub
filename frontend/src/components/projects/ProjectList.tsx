import { Link } from "react-router-dom";
import { ChevronRight, FolderKanban, Plus } from "lucide-react";
import { EmptyState } from "@/components/layout/EmptyState";
import { Button } from "@/components/ui/button";
import { projectDetailPath } from "@/constants/routes";
import type { ProjectSummary } from "@/types/projects.types";

interface ProjectListProps {
  projects: ProjectSummary[];
  onCreateProject?: () => void;
}

export function ProjectList({ projects, onCreateProject }: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <EmptyState
        icon={FolderKanban}
        title="No projects yet"
        description="Link a GitHub repository, add services, and configure production or staging environments."
        action={
          onCreateProject ? (
            <Button onClick={onCreateProject}>
              <Plus className="h-4 w-4" />
              Create your first project
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <>
      <ul className="space-y-3 md:hidden">
        {projects.map((project) => (
          <li key={project.id}>
            <Link
              to={projectDetailPath(project.id)}
              className="flex items-center justify-between gap-3 rounded-lg border bg-card p-4 shadow-sm transition-colors hover:bg-muted/30"
            >
              <div className="min-w-0">
                <p className="font-medium text-foreground">{project.name}</p>
                <p className="truncate font-mono text-xs text-muted-foreground">
                  {project.repoFullName}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {project.serviceCount} service{project.serviceCount === 1 ? "" : "s"} ·{" "}
                  {project.environmentCount} env
                  {project.environmentCount === 1 ? "" : "s"}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-hidden rounded-lg border bg-card shadow-sm md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Project</th>
              <th className="px-4 py-3 font-medium">Repository</th>
              <th className="hidden px-4 py-3 font-medium lg:table-cell">Description</th>
              <th className="px-4 py-3 font-medium">Services</th>
              <th className="px-4 py-3 font-medium">Environments</th>
              <th className="w-10 px-2 py-3" aria-hidden />
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr key={project.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3">
                  <Link
                    to={projectDetailPath(project.id)}
                    className="font-medium text-foreground hover:text-primary hover:underline"
                  >
                    {project.name}
                  </Link>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                  {project.repoFullName}
                </td>
                <td className="hidden max-w-xs truncate px-4 py-3 text-muted-foreground lg:table-cell">
                  {project.description ?? "—"}
                </td>
                <td className="px-4 py-3 tabular-nums text-muted-foreground">
                  {project.serviceCount}
                </td>
                <td className="px-4 py-3 tabular-nums text-muted-foreground">
                  {project.environmentCount}
                </td>
                <td className="px-2 py-3">
                  <Link
                    to={projectDetailPath(project.id)}
                    className="inline-flex text-muted-foreground hover:text-foreground"
                    aria-label={`Open ${project.name}`}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
