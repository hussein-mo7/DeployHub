import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { PageContent } from "@/components/layout/PageContent";
import { CreateServerForm } from "@/components/servers/CreateServerForm";
import { ROUTES, serverSetupPath } from "@/constants/routes";
import { getApiErrorMessage } from "@/lib/api-error";
import * as serversService from "@/services/servers.service";
import type { ServerSetupInfo } from "@/types/servers.types";

export type ServerSetupNavigationState = {
  setup: ServerSetupInfo;
};

export function NewServerPage() {
  const navigate = useNavigate();
  const [createError, setCreateError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: serversService.createServer,
    onSuccess: (result) => {
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
        title="Add server"
        description="Name your VPS target — agent install is the next step."
        breadcrumbs={[
          { label: "Servers", to: ROUTES.SERVERS },
          { label: "New" },
        ]}
      />

      <div className="min-h-0 flex-1 overflow-auto">
        <PageContent className="max-w-xl">
          <CreateServerForm
            onSubmit={async (values) => {
              setCreateError(null);
              await createMutation.mutateAsync(values);
            }}
            onCancel={() => navigate(ROUTES.SERVERS)}
            isSubmitting={createMutation.isPending}
            error={createError}
          />
        </PageContent>
      </div>
    </>
  );
}
