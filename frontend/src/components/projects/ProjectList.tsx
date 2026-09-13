import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { projectDetailPath } from "@/constants/routes";
import type { ProjectSummary } from "@/types/projects.types";

interface ProjectListProps {
  projects: ProjectSummary[];
}

export function ProjectList({ projects }: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No projects yet</CardTitle>
          <CardDescription>
            Create a project to link a GitHub repo and configure how it deploys.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {projects.map((project) => (
        <Link key={project.id} to={projectDetailPath(project.id)}>
          <Card className="transition-colors hover:bg-muted/30">
            <CardContent className="flex items-center justify-between gap-4 p-5">
              <div className="min-w-0 space-y-1">
                <h3 className="font-medium">{project.name}</h3>
                <p className="truncate text-sm text-muted-foreground">{project.repoFullName}</p>
                {project.description && (
                  <p className="truncate text-sm text-muted-foreground">{project.description}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {project.serviceCount} service{project.serviceCount === 1 ? "" : "s"} ·{" "}
                  {project.environmentCount} environment
                  {project.environmentCount === 1 ? "" : "s"}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
