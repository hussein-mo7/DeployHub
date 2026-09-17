import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Copy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format-date";
import * as configService from "@/services/config.service";
import type { ServerSetupInfo } from "@/types/servers.types";

const publicConfigQueryKey = ["config", "public"] as const;

interface ServerSetupPanelProps {
  title?: string;
  setup: ServerSetupInfo;
  onDismiss?: () => void;
}

function CopyField({ label, value, hint }: { label: string; value: string; hint?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">{label}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <pre className="max-h-48 flex-1 overflow-x-auto rounded-md border bg-background p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap break-all">
          {value}
        </pre>
        <Button
          type="button"
          variant="outline"
          className="shrink-0 sm:w-auto"
          onClick={() => void handleCopy()}
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function buildVpsAfterRegister(agentDockerImage: string | null): string {
  if (agentDockerImage) {
    return `# Step 1 (install.sh) registers and, with AGENT_DOCKER_IMAGE set, should already:
#   docker pull ${agentDockerImage}
#   docker run -d --name deployhub-agent --restart unless-stopped \\
#     -v /var/run/docker.sock:/var/run/docker.sock \\
#     --env-file /etc/deployhub/agent.env \\
#     ${agentDockerImage}

sudo cat /etc/deployhub/agent.env
docker ps --filter name=deployhub-agent

# If the container is missing, run install.sh again or run docker manually with the image above.`;
  }

  return `# Control plane has no AGENT_DOCKER_IMAGE — set it in backend/.env (see docs/AGENT-SETUP.md)

sudo cat /etc/deployhub/agent.env

# After CI publishes the image:
# docker pull ghcr.io/YOU/deployhub-agent:latest
# docker run -d --name deployhub-agent --restart unless-stopped \\
#   -v /var/run/docker.sock:/var/run/docker.sock \\
#   --env-file /etc/deployhub/agent.env ghcr.io/YOU/deployhub-agent:latest`;
}

function buildWindowsRegisterCommand(registrationToken: string, publicApiUrl: string): string {
  return `$body = @{ registrationToken = "${registrationToken}" } | ConvertTo-Json

Invoke-RestMethod -Method POST -Uri "${publicApiUrl}/api/agents/register" -ContentType "application/json" -Body $body

# Copy agentToken from the response into agent/.env as AGENT_TOKEN=
# Then from repo root: npm run dev:agent`;
}

export function ServerSetupPanel({
  title = "Agent setup",
  setup,
  onDismiss,
}: ServerSetupPanelProps) {
  const [guide, setGuide] = useState<"vps" | "windows">("vps");
  const { data: publicConfig } = useQuery({
    queryKey: publicConfigQueryKey,
    queryFn: configService.getPublicConfig,
    staleTime: 60_000,
  });

  const dockerAuto = publicConfig?.agentInstallMode === "docker";
  const step1Hint = dockerAuto
    ? "Registers, writes agent.env, then docker pull + docker run the agent image automatically."
    : "Registers and writes /etc/deployhub/agent.env. Set AGENT_DOCKER_IMAGE on the API for automatic docker run.";

  return (
    <Card className="border-primary/25 bg-primary/5 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-2">
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription className="leading-relaxed">
            Register this VPS, then install and run <strong className="font-medium text-foreground">only the DeployHub agent</strong>{" "}
            (not the full project). The install curl writes{" "}
            <code className="rounded bg-muted px-1 font-mono">/etc/deployhub/agent.env</code> — you still start the agent process (steps below). Token expires{" "}
            <span className="font-medium text-foreground">{formatDateTime(setup.expiresAt)}</span>.
          </CardDescription>
          <p className="text-xs text-muted-foreground">
            Operator guide in the repo:{" "}
            <code className="rounded bg-muted px-1 font-mono">docs/AGENT-SETUP.md</code>
          </p>
        </div>
        {onDismiss && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground"
            aria-label="Dismiss setup instructions"
            onClick={onDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={guide === "vps" ? "default" : "outline"}
            onClick={() => setGuide("vps")}
          >
            Linux VPS
          </Button>
          <Button
            type="button"
            size="sm"
            variant={guide === "windows" ? "default" : "outline"}
            onClick={() => setGuide("windows")}
          >
            Windows (local dev)
          </Button>
        </div>

        {guide === "vps" ? (
          <ol className="list-decimal space-y-4 pl-5 text-sm text-muted-foreground marker:font-medium marker:text-foreground">
            <li className="pl-1">
              <CopyField
                label="Run on VPS (SSH)"
                hint={step1Hint}
                value={setup.installCommand}
              />
            </li>
            <li className="pl-1">
              <CopyField
                label="Verify on VPS"
                hint="Requires Docker + Git. Status becomes ONLINE when the agent container connects."
                value={buildVpsAfterRegister(publicConfig?.agentDockerImage ?? null)}
              />
            </li>
          </ol>
        ) : (
          <ol className="list-decimal space-y-4 pl-5 text-sm text-muted-foreground marker:font-medium marker:text-foreground">
            <li className="pl-1">
              <CopyField
                label="Register in PowerShell (backend on localhost:3001)"
                hint="Use agentToken from the response — not the registration token."
                value={buildWindowsRegisterCommand(
                  setup.registrationToken,
                  publicConfig?.publicApiUrl ?? "http://localhost:3001",
                )}
              />
            </li>
            <li className="pl-1">
              <p className="text-sm text-foreground">
                Put <code className="rounded bg-muted px-1 font-mono">agentToken</code> in{" "}
                <code className="rounded bg-muted px-1 font-mono">agent/.env</code> as{" "}
                <code className="rounded bg-muted px-1 font-mono">AGENT_TOKEN</code>, then run{" "}
                <code className="rounded bg-muted px-1 font-mono">npm run dev:agent</code> from the
                repo root.
              </p>
            </li>
          </ol>
        )}

        <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-foreground">
          Shown once after create or regenerate. If you close this panel, use{" "}
          <strong>New install token</strong> on the server page to get a new registration token.
        </p>
      </CardContent>
    </Card>
  );
}
