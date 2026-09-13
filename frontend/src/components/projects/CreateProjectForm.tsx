import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createProjectSchema } from "@/lib/validations/projects.schema";

interface CreateProjectFormProps {
  onSubmit: (values: {
    name: string;
    description?: string;
    repoOwner: string;
    repoName: string;
  }) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  error: string | null;
}

export function CreateProjectForm({
  onSubmit,
  onCancel,
  isSubmitting,
  error,
}: CreateProjectFormProps) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    repoOwner: "",
    repoName: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const payload = {
      name: form.name,
      repoOwner: form.repoOwner,
      repoName: form.repoName,
      ...(form.description.trim() ? { description: form.description.trim() } : {}),
    };

    const result = createProjectSchema.safeParse(payload);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) errors[String(err.path[0])] = err.message;
      });
      setFieldErrors(errors);
      return;
    }

    await onSubmit(result.data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create project</CardTitle>
        <CardDescription>
          Link a GitHub repository to configure services and deployment environments.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="project-name">Name</Label>
            <Input
              id="project-name"
              placeholder="Portfolio"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            {fieldErrors.name && <p className="text-xs text-destructive">{fieldErrors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-description">Description (optional)</Label>
            <Input
              id="project-description"
              placeholder="Next.js portfolio with MongoDB Atlas"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            {fieldErrors.description && (
              <p className="text-xs text-destructive">{fieldErrors.description}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="repo-owner">Repository owner</Label>
              <Input
                id="repo-owner"
                placeholder="your-github-user"
                value={form.repoOwner}
                onChange={(e) => setForm({ ...form, repoOwner: e.target.value })}
              />
              {fieldErrors.repoOwner && (
                <p className="text-xs text-destructive">{fieldErrors.repoOwner}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="repo-name">Repository name</Label>
              <Input
                id="repo-name"
                placeholder="portfolio"
                value={form.repoName}
                onChange={(e) => setForm({ ...form, repoName: e.target.value })}
              />
              {fieldErrors.repoName && (
                <p className="text-xs text-destructive">{fieldErrors.repoName}</p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create project"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
