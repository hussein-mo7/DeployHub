import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiErrorMessage } from "@/lib/api-error";
import * as projectsService from "@/services/projects.service";

interface ServicePortEditorProps {
  projectId: string;
  serviceId: string;
  serviceName: string;
  port: number | null;
}

export function ServicePortEditor({
  projectId,
  serviceId,
  serviceName,
  port,
}: ServicePortEditorProps) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState(port != null ? String(port) : "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDraft(port != null ? String(port) : "");
  }, [port]);

  const mutation = useMutation({
    mutationFn: () => {
      const trimmed = draft.trim();
      if (!trimmed) {
        return projectsService.updateService(projectId, serviceId, { port: null });
      }
      const parsed = Number.parseInt(trimmed, 10);
      if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
        throw new Error("Port must be between 1 and 65535");
      }
      return projectsService.updateService(projectId, serviceId, { port: parsed });
    },
    onSuccess: () => {
      setError(null);
      setSaved(true);
      void queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
      setTimeout(() => setSaved(false), 2500);
    },
    onError: (err) => {
      if (err instanceof Error && err.message.includes("Port must")) {
        setError(err.message);
        return;
      }
      setError(getApiErrorMessage(err, "Failed to update port"));
    },
  });

  return (
    <div className="mt-3 space-y-2 rounded-md border border-dashed p-3">
      <Label htmlFor={`service-port-${serviceId}`} className="text-xs">
        Host port for {serviceName}
      </Label>
      <p className="text-xs text-muted-foreground">
        Maps container port to your machine (e.g. 3000 for Next.js). Redeploy after changing.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          id={`service-port-${serviceId}`}
          type="number"
          min={1}
          max={65535}
          placeholder="3000"
          className="h-8 max-w-[120px] text-sm"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setSaved(false);
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? "Saving…" : "Save port"}
        </Button>
        {saved && <span className="text-xs text-emerald-600 dark:text-emerald-400">Saved</span>}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
