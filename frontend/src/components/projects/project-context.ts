import { useOutletContext, useSearchParams } from "react-router-dom";
import type { EnvironmentSummary, ProjectDetail } from "@/types/projects.types";

export interface ProjectOutletContext {
  project: ProjectDetail;
}

export function useProject(): ProjectDetail {
  return useOutletContext<ProjectOutletContext>().project;
}

export const projectQueryKey = (id: string) => ["projects", id] as const;

/** Environment chosen via `?env=`; falls back to the first environment. */
export function useSelectedEnvironment(project: ProjectDetail): {
  environment: EnvironmentSummary | undefined;
  selectEnvironment: (environmentId: string) => void;
} {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get("env");
  const environment =
    project.environments.find((env) => env.id === requested) ?? project.environments[0];

  const selectEnvironment = (environmentId: string) => {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.set("env", environmentId);
        return next;
      },
      { replace: true },
    );
  };

  return { environment, selectEnvironment };
}
