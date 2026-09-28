import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type StepStatus = "complete" | "current" | "upcoming";

export interface StepperStep {
  id: string;
  label: string;
  description?: string;
  status: StepStatus;
}

interface StepperProps {
  steps: StepperStep[];
  /** Completed steps become clickable when provided (wizard back-navigation). */
  onStepClick?: (index: number) => void;
  className?: string;
}

export function Stepper({ steps, onStepClick, className }: StepperProps) {
  return (
    <ol className={cn("flex w-full items-start", className)} aria-label="Progress">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const clickable = Boolean(onStepClick) && step.status === "complete";

        const marker = (
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors",
              step.status === "complete" && "border-primary bg-primary text-primary-foreground",
              step.status === "current" &&
                "border-primary bg-background text-primary shadow-[0_0_0_4px] shadow-primary/10",
              step.status === "upcoming" && "border-border bg-background text-muted-foreground",
            )}
          >
            {step.status === "complete" ? <Check className="h-4 w-4" /> : index + 1}
          </span>
        );

        const text = (
          <span className="mt-2 hidden min-w-0 flex-col items-center text-center sm:flex">
            <span
              className={cn(
                "text-xs font-medium",
                step.status === "upcoming" ? "text-muted-foreground" : "text-foreground",
              )}
            >
              {step.label}
            </span>
            {step.description ? (
              <span className="mt-0.5 max-w-[160px] text-[11px] leading-snug text-muted-foreground">
                {step.description}
              </span>
            ) : null}
          </span>
        );

        return (
          <li
            key={step.id}
            className="relative flex flex-1 flex-col items-center"
            aria-current={step.status === "current" ? "step" : undefined}
          >
            {!isLast && (
              <span
                aria-hidden
                className={cn(
                  "absolute left-[calc(50%+20px)] right-[calc(-50%+20px)] top-4 h-0.5 rounded-full",
                  step.status === "complete" ? "bg-primary" : "bg-border",
                )}
              />
            )}
            {clickable ? (
              <button
                type="button"
                className="flex flex-col items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => onStepClick?.(index)}
              >
                {marker}
                {text}
              </button>
            ) : (
              <div className="flex flex-col items-center">
                {marker}
                {text}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** Build stepper statuses from a zero-based current index. */
export function stepsFromIndex(
  steps: Array<Omit<StepperStep, "status">>,
  currentIndex: number,
): StepperStep[] {
  return steps.map((step, index) => ({
    ...step,
    status: index < currentIndex ? "complete" : index === currentIndex ? "current" : "upcoming",
  }));
}
