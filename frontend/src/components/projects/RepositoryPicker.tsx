import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Github, Lock, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { InlineListLoadingSkeleton } from "@/components/ui/loading-state";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import * as githubService from "@/services/github.service";
import type { GitHubRepositorySummary } from "@/types/github.types";

interface RepositoryPickerProps {
  selectedFullName: string | null;
  onSelect: (repo: GitHubRepositorySummary) => void;
}

export function RepositoryPicker({ selectedFullName, onSelect }: RepositoryPickerProps) {
  const [search, setSearch] = useState("");

  const { data: integrationData, isLoading: integrationLoading } = useQuery({
    queryKey: ["github", "integration"],
    queryFn: githubService.getIntegration,
  });
  const connected = integrationData?.integration.connected === true;

  const { data: reposData, isLoading: reposLoading, isError } = useQuery({
    queryKey: ["github", "repos", 100],
    queryFn: () => githubService.listRepositories(100),
    enabled: connected,
  });

  const repos = useMemo(() => {
    const all = reposData?.repositories ?? [];
    const term = search.trim().toLowerCase();
    return term ? all.filter((repo) => repo.fullName.toLowerCase().includes(term)) : all;
  }, [reposData?.repositories, search]);

  if (integrationLoading) {
    return <InlineListLoadingSkeleton rows={4} />;
  }

  if (!connected) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed bg-muted/20 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <Github className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">Connect GitHub to pick a repository</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Or enter the owner and name manually below.
            </p>
          </div>
        </div>
        <Link
          to={ROUTES.SETTINGS_INTEGRATIONS}
          className="text-sm font-medium text-primary hover:underline"
        >
          Connect GitHub
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="relative border-b">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label="Search repositories"
          placeholder="Search repositories…"
          className="h-11 rounded-none border-0 pl-9 focus-visible:ring-0 focus-visible:ring-offset-0"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="max-h-72 overflow-y-auto" role="listbox" aria-label="Repositories">
        {reposLoading && <InlineListLoadingSkeleton rows={4} className="p-3" />}
        {isError && (
          <p className="px-4 py-6 text-center text-sm text-destructive">Could not load repositories.</p>
        )}
        {!reposLoading && !isError && repos.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            No repositories match. Check the GitHub App has access to it.
          </p>
        )}
        {repos.map((repo) => {
          const selected = repo.fullName === selectedFullName;
          return (
            <button
              key={repo.id}
              type="button"
              role="option"
              aria-selected={selected}
              onClick={() => onSelect(repo)}
              className={cn(
                "flex w-full items-center justify-between gap-3 border-b px-4 py-3 text-left text-sm transition-colors last:border-0",
                selected ? "bg-primary/[0.06]" : "hover:bg-muted/40",
              )}
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <Github className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate font-medium text-foreground">{repo.fullName}</span>
                {repo.private && <Lock className="h-3 w-3 shrink-0 text-muted-foreground" />}
              </span>
              <span className="flex shrink-0 items-center gap-3">
                <span className="hidden font-mono text-xs text-muted-foreground sm:inline">
                  {repo.defaultBranch}
                </span>
                <span
                  className={cn(
                    "flex h-4 w-4 items-center justify-center rounded-full border-2",
                    selected ? "border-primary" : "border-muted-foreground/40",
                  )}
                >
                  {selected && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
