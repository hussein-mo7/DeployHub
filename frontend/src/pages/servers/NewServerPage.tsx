import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, KeyRound, Server, ShieldCheck } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { PageContent } from "@/components/layout/PageContent";
import {
  WizardAside,
  WizardPanel,
  WizardPanelBody,
  WizardPanelHeader,
} from "@/components/layout/WizardPanel";
import { CreateServerForm } from "@/components/servers/CreateServerForm";
import { ServerSetupSteps } from "@/components/servers/ServerSetupSteps";
import { ROUTES, serverSetupPath } from "@/constants/routes";
import { getApiErrorMessage } from "@/lib/api-error";
import * as serversService from "@/services/servers.service";
import type { ServerSetupInfo } from "@/types/servers.types";

export type ServerSetupNavigationState = {
  setup: ServerSetupInfo;
};

const requirements = [
  "Ubuntu 22.04+ or Debian 12 VPS",
  "SSH access as root or a sudo user",
  "Outbound HTTPS to your DeployHub API",
  "About 1 GB free RAM for image builds",
];

export function NewServerPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [createError, setCreateError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: serversService.createServer,
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ["servers"] });
      const state: ServerSetupNavigationState = {
        setup: {
          registrationToken: result.registrationToken,
          installCommand: result.installCommand,
          expiresAt: result.expiresAt,
        },
      };
      navigate(serverSetupPath(result.server.id), { state, replace: true });
    },
    onError: (err) => {
      setCreateError(getApiErrorMessage(err, "Failed to create server"));
    },
  });

  return (
    <>
      <Header
        title="Add a server"
        description="Connect a Linux VPS as a deploy target. It takes about two minutes."
        breadcrumbs={[{ label: "Servers", to: ROUTES.SERVERS }, { label: "New server" }]}
      />

      <div className="min-h-0 flex-1 overflow-auto">
        <PageContent className="mx-auto max-w-5xl">
          <ServerSetupSteps current={0} className="mx-auto max-w-2xl" />

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <WizardPanel>
              <WizardPanelHeader
                title="Name your server"
                description="Only a name is needed now. You’ll install the agent on the next step."
                icon={
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Server className="h-5 w-5" />
                  </div>
                }
              />
              <WizardPanelBody>
                <CreateServerForm
                  onSubmit={async (values) => {
                    setCreateError(null);
                    await createMutation.mutateAsync(values);
                  }}
                  onCancel={() => navigate(ROUTES.SERVERS)}
                  isSubmitting={createMutation.isPending}
                  error={createError}
                />
              </WizardPanelBody>
            </WizardPanel>

            <aside className="space-y-4">
              <WizardAside title="Before you start">
                <div className="space-y-2.5">
                  {requirements.map((item) => (
                    <div key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </WizardAside>

              <WizardAside>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      <span className="font-medium text-foreground">SSH install is one-time.</span>{" "}
                      Your key or password is used for a single session and never stored.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      <span className="font-medium text-foreground">One server per VPS.</span>{" "}
                      Re-installing with a new token on the same machine creates duplicates.
                    </p>
                  </div>
                </div>
              </WizardAside>
            </aside>
          </div>
        </PageContent>
      </div>
    </>
  );
}
