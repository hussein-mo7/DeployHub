import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, FolderGit2, GitBranch, Rocket, Server } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { PageContent } from "@/components/layout/PageContent";
import {
  WizardAside,
  WizardPanel,
  WizardPanelBody,
  WizardPanelFooter,
  WizardPanelHeader,
} from "@/components/layout/WizardPanel";
import {
  EnvironmentFields,
  defaultEnvironmentDraft,
  type EnvironmentDraft,
} from "@/components/projects/EnvironmentFields";
import { RepositoryPicker } from "@/components/projects/RepositoryPicker";
import {
  ServiceBuildFields,
  defaultServiceDraft,
  serviceDraftToPayload,
  type ServiceDraft,
} from "@/components/projects/ServiceBuildFields";
import { Button } from "@/components/ui/button";
import { FormErrorBanner, FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { ButtonSpinner } from "@/components/ui/loading-state";
import { Stepper, stepsFromIndex } from "@/components/ui/stepper";
import { ROUTES, projectSectionPath } from "@/constants/routes";
import { getApiErrorMessage } from "@/lib/api-error";
import { zodFieldErrors } from "@/lib/form-errors";
import { toastApiError, toastError, toastSuccess } from "@/lib/toast";
import {
  createEnvironmentSchema,
  createProjectSchema,
  createServiceSchema,
} from "@/lib/validations/projects.schema";
import * as githubService from "@/services/github.service";
import * as projectsService from "@/services/projects.service";
import * as serversService from "@/services/servers.service";
import type { GitHubRepositorySummary } from "@/types/github.types";

const wizardSteps = [
  { id: "repo", label: "Repository", description: "Source code" },
  { id: "build", label: "Build", description: "How it runs" },
  { id: "environment", label: "Environment", description: "Where it runs" },
];

interface ProjectDraft {
  name: string;
  description: string;
  repoOwner: string;
  repoName: string;
}

export function NewProjectPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(0);
  const [project, setProject] = useState<ProjectDraft>({
    name: "",
    description: "",
    repoOwner: "",
    repoName: "",
  });
  const [defaultBranch, setDefaultBranch] = useState("main");
  const [service, setService] = useState<ServiceDraft>(defaultServiceDraft());
  const [includeService, setIncludeService] = useState(true);
  const [environment, setEnvironment] = useState<EnvironmentDraft | null>(null);
  const [includeEnvironment, setIncludeEnvironment] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [progressLabel, setProgressLabel] = useState<string | null>(null);

  const { data: serversData } = useQuery({
    queryKey: ["servers"],
    queryFn: serversService.listServers,
  });
  const servers = serversData?.servers ?? [];

  const repoSelected = Boolean(project.repoOwner && project.repoName);
  const { data: branchesData } = useQuery({
    queryKey: ["github", "branches", project.repoOwner, project.repoName],
    queryFn: () => githubService.listBranches(project.repoOwner, project.repoName),
    enabled: repoSelected && step === 2,
    retry: false,
  });

  const environmentDraft = environment ?? defaultEnvironmentDraft(servers, defaultBranch);
  const selectedServer = servers.find((server) => server.id === environmentDraft.serverId);

  const handleRepoSelect = (repo: GitHubRepositorySummary) => {
    const [owner, name] = repo.fullName.split("/");
    setProject((current) => ({
      ...current,
      repoOwner: owner ?? "",
      repoName: name ?? repo.name,
      name: current.name.trim() ? current.name : repo.name,
    }));
    setDefaultBranch(repo.defaultBranch);
    setEnvironment((current) => (current ? { ...current, branch: repo.defaultBranch } : current));
    setErrors({});
  };

  const projectPayload = () => ({
    name: project.name,
    repoOwner: project.repoOwner,
    repoName: project.repoName,
    ...(project.description.trim() ? { description: project.description.trim() } : {}),
  });

  const goNext = () => {
    setErrors({});
    if (step === 0) {
      const result = createProjectSchema.safeParse(projectPayload());
      if (!result.success) {
        setErrors(zodFieldErrors(result.error));
        return;
      }
    }
    if (step === 1) {
      const result = createServiceSchema.safeParse(serviceDraftToPayload(service));
      if (!result.success) {
        setErrors(zodFieldErrors(result.error));
        return;
      }
      setIncludeService(true);
    }
    setStep((current) => Math.min(current + 1, wizardSteps.length - 1));
  };

  const skipStep = () => {
    setErrors({});
    if (step === 1) {
      setIncludeService(false);
      setStep(2);
    }
  };

  const handleCreate = async (withEnvironment: boolean) => {
    setErrors({});
    setSubmitError(null);
    setIncludeEnvironment(withEnvironment);

    const projectResult = createProjectSchema.safeParse(projectPayload());
    if (!projectResult.success) {
      setStep(0);
      setErrors(zodFieldErrors(projectResult.error));
      return;
    }

    const serviceResult = includeService
      ? createServiceSchema.safeParse(serviceDraftToPayload(service))
      : null;
    if (serviceResult && !serviceResult.success) {
      setStep(1);
      setErrors(zodFieldErrors(serviceResult.error));
      return;
    }

    const environmentResult = withEnvironment
      ? createEnvironmentSchema.safeParse(environmentDraft)
      : null;
    if (environmentResult && !environmentResult.success) {
      setErrors(zodFieldErrors(environmentResult.error));
      return;
    }

    let projectId: string;
    try {
      setProgressLabel("Creating project…");
      const created = await projectsService.createProject(projectResult.data);
      projectId = created.project.id;
    } catch (err) {
      setProgressLabel(null);
      setSubmitError(getApiErrorMessage(err, "Failed to create project"));
      toastApiError(err, "Failed to create project");
      return;
    }

    void queryClient.invalidateQueries({ queryKey: ["projects"] });

    if (serviceResult?.success) {
      try {
        setProgressLabel("Adding service…");
        await projectsService.createService(projectId, serviceResult.data);
      } catch (err) {
        setProgressLabel(null);
        toastError(getApiErrorMessage(err, "Project created, but the service could not be added."));
        navigate(projectSectionPath(projectId, "services/new"));
        return;
      }
    }

    let environmentId: string | undefined;
    if (environmentResult?.success) {
      try {
        setProgressLabel("Creating environment…");
        const created = await projectsService.createEnvironment(projectId, environmentResult.data);
        environmentId = created.environment.id;
      } catch (err) {
        setProgressLabel(null);
        toastError(
          getApiErrorMessage(err, "Project created, but the environment could not be added."),
        );
        navigate(projectSectionPath(projectId, "environments/new"));
        return;
      }
    }

    setProgressLabel(null);
    toastSuccess(
      environmentId
        ? "Project ready — add variables if needed, then deploy."
        : "Project created.",
    );
    navigate(projectSectionPath(projectId));
  };

  const isSubmitting = progressLabel !== null;

  return (
    <>
      <Header
        title="New project"
        description="Connect a repository, choose how it builds, and pick where it runs."
        breadcrumbs={[{ label: "Projects", to: ROUTES.PROJECTS }, { label: "New project" }]}
      />

      <div className="min-h-0 flex-1 overflow-auto">
        <PageContent className="mx-auto max-w-5xl">
          <Stepper
            className="mx-auto max-w-2xl"
            steps={stepsFromIndex(wizardSteps, step)}
            onStepClick={isSubmitting ? undefined : (index) => setStep(index)}
          />

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
            <WizardPanel>
              {step === 0 && (
                <>
                  <WizardPanelHeader
                    title="Choose a repository"
                    description="DeployHub clones this repo on every deploy using the GitHub App."
                  />
                  <WizardPanelBody>
                    <RepositoryPicker
                      selectedFullName={
                        repoSelected ? `${project.repoOwner}/${project.repoName}` : null
                      }
                      onSelect={handleRepoSelect}
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField id="repo-owner" label="Repository owner" error={errors.repoOwner}>
                        <Input
                          id="repo-owner"
                          placeholder="your-github-user"
                          value={project.repoOwner}
                          onChange={(e) => setProject({ ...project, repoOwner: e.target.value })}
                        />
                      </FormField>
                      <FormField id="repo-name" label="Repository name" error={errors.repoName}>
                        <Input
                          id="repo-name"
                          placeholder="portfolio"
                          value={project.repoName}
                          onChange={(e) => setProject({ ...project, repoName: e.target.value })}
                        />
                      </FormField>
                    </div>

                    <div className="grid gap-4 border-t pt-5 sm:grid-cols-2">
                      <FormField id="project-name" label="Project name" error={errors.name}>
                        <Input
                          id="project-name"
                          placeholder="Portfolio"
                          value={project.name}
                          onChange={(e) => setProject({ ...project, name: e.target.value })}
                        />
                      </FormField>
                      <FormField
                        id="project-description"
                        label="Description"
                        optional
                        error={errors.description}
                      >
                        <Input
                          id="project-description"
                          placeholder="Next.js portfolio site"
                          value={project.description}
                          onChange={(e) => setProject({ ...project, description: e.target.value })}
                        />
                      </FormField>
                    </div>
                  </WizardPanelBody>
                </>
              )}

              {step === 1 && (
                <>
                  <WizardPanelHeader
                    title="Configure the build"
                    description="Tell DeployHub how to turn this repo into a running container. You can add more services later."
                  />
                  <WizardPanelBody>
                    <ServiceBuildFields
                      value={service}
                      onChange={setService}
                      errors={errors}
                      idPrefix="wizard-service"
                    />
                  </WizardPanelBody>
                </>
              )}

              {step === 2 && (
                <>
                  <WizardPanelHeader
                    title="Pick where it runs"
                    description="An environment binds a branch to a server. Start with Production — add Staging any time."
                  />
                  <WizardPanelBody>
                    <EnvironmentFields
                      value={environmentDraft}
                      onChange={setEnvironment}
                      errors={errors}
                      servers={servers}
                      branchSuggestions={branchesData?.branches.map((branch) => branch.name)}
                      idPrefix="wizard-environment"
                    />
                  </WizardPanelBody>
                </>
              )}

              <WizardPanelFooter>
                <div>
                  {step > 0 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={isSubmitting}
                      onClick={() => setStep((current) => current - 1)}
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </Button>
                  ) : (
                    <Button type="button" variant="ghost" onClick={() => navigate(ROUTES.PROJECTS)}>
                      Cancel
                    </Button>
                  )}
                </div>
                <div className="flex flex-col-reverse gap-2 sm:flex-row">
                  {step === 1 && (
                    <Button type="button" variant="outline" onClick={skipStep}>
                      Skip for now
                    </Button>
                  )}
                  {step === 2 && (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSubmitting}
                      onClick={() => void handleCreate(false)}
                    >
                      {isSubmitting && !includeEnvironment ? (
                        <>
                          <ButtonSpinner className="mr-2" />
                          {progressLabel}
                        </>
                      ) : (
                        "Skip & create"
                      )}
                    </Button>
                  )}
                  {step < 2 ? (
                    <Button type="button" onClick={goNext}>
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      disabled={isSubmitting || servers.length === 0}
                      onClick={() => void handleCreate(true)}
                    >
                      {isSubmitting && includeEnvironment ? (
                        <>
                          <ButtonSpinner className="mr-2" />
                          {progressLabel}
                        </>
                      ) : (
                        <>
                          <Rocket className="h-4 w-4" />
                          Create project
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </WizardPanelFooter>
              {submitError && (
                <div className="px-6 pb-4">
                  <FormErrorBanner message={submitError} />
                </div>
              )}
            </WizardPanel>

            <WizardAside title="Summary" className="lg:sticky lg:top-4">
              <div className="space-y-4 text-sm">
                  <SummaryRow
                    icon={FolderGit2}
                    label="Repository"
                    value={repoSelected ? `${project.repoOwner}/${project.repoName}` : null}
                  />
                  <SummaryRow
                    icon={Rocket}
                    label="Build"
                    value={
                      step < 1
                        ? null
                        : includeService
                          ? `${service.name || "service"} · ${service.deploymentMethod.toLowerCase()}`
                          : "Skipped"
                    }
                  />
                  <SummaryRow
                    icon={Server}
                    label="Server"
                    value={step < 2 ? null : (selectedServer?.name ?? "Not selected")}
                  />
                  <SummaryRow
                    icon={GitBranch}
                    label="Branch"
                    value={step < 2 ? null : environmentDraft.branch}
                    mono
                  />
              </div>
            </WizardAside>
          </div>
        </PageContent>
      </div>
    </>
  );
}

function SummaryRow({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: typeof Server;
  label: string;
  value: string | null;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p
          className={
            value
              ? `truncate text-sm font-medium text-foreground ${mono ? "font-mono text-xs" : ""}`
              : "text-sm text-muted-foreground/60"
          }
        >
          {value ?? "—"}
        </p>
      </div>
    </div>
  );
}
