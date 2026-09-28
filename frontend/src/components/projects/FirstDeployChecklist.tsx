import { Link } from "react-router-dom";
import { Check, Circle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ChecklistStep } from "@/lib/first-deploy-checklist";

interface FirstDeployChecklistProps {
  title?: string;
  description?: string;
  steps: ChecklistStep[];
  className?: string;
}

export function FirstDeployChecklist({
  title = "First deploy checklist",
  description = "Follow these steps once to go from zero to a live deployment.",
  steps,
  className,
}: FirstDeployChecklistProps) {
  const completed = steps.filter((step) => step.done).length;

  return (
    <Card className={cn("border-primary/25 shadow-none", className)}>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <span className="inline-flex rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {completed} / {steps.length} done
          </span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${steps.length ? (completed / steps.length) * 100 : 0}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {steps.map((step) => (
          <div
            key={step.id}
            className={cn(
              "flex gap-3 rounded-lg border px-3 py-2.5",
              step.done ? "border-border/60 bg-muted/20" : "border-border bg-card",
            )}
          >
            <div
              className={cn(
                "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                step.done
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted-foreground/40 text-muted-foreground",
              )}
            >
              {step.done ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-3 w-3" />}
            </div>
            <div className="min-w-0 flex-1">
              {step.href && !step.done ? (
                <Link
                  to={step.href}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {step.title}
                </Link>
              ) : (
                <p className="text-sm font-medium text-foreground">{step.title}</p>
              )}
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
