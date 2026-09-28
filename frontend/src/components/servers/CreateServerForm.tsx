import { useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormErrorBanner, FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { ButtonSpinner } from "@/components/ui/loading-state";
import { zodFieldErrors } from "@/lib/form-errors";
import { createServerSchema } from "@/lib/validations/servers.schema";

interface CreateServerFormProps {
  onSubmit: (values: { name: string; description?: string }) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  error: string | null;
}

export function CreateServerForm({ onSubmit, onCancel, isSubmitting, error }: CreateServerFormProps) {
  const [form, setForm] = useState({ name: "", description: "" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const result = createServerSchema.safeParse({
      name: form.name,
      ...(form.description.trim() ? { description: form.description.trim() } : {}),
    });
    if (!result.success) {
      setFieldErrors(zodFieldErrors(result.error));
      return;
    }

    await onSubmit(result.data);
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
      <FormErrorBanner message={error} />

      <FormField
        id="server-name"
        label="Server name"
        hint="How this VPS appears in DeployHub, e.g. “Production EU” or “Staging”."
        error={fieldErrors.name}
      >
        <Input
          id="server-name"
          autoFocus
          placeholder="Production VPS"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </FormField>

      <FormField
        id="server-description"
        label="Description"
        optional
        hint="Provider, region, or anything that helps you recognise it later."
        error={fieldErrors.description}
      >
        <Input
          id="server-description"
          placeholder="Hetzner CX22 · Falkenstein"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </FormField>

      <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <ButtonSpinner className="mr-2" />
              Creating…
            </>
          ) : (
            <>
              Continue to install
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
