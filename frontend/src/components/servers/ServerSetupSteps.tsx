import { Stepper, type StepStatus } from "@/components/ui/stepper";

/** Shared progress bar for the add-server → install → ready flow. */
export function ServerSetupSteps({
  current,
  className,
}: {
  /** 0 = naming, 1 = installing agent, 2 = online and ready. */
  current: 0 | 1 | 2;
  className?: string;
}) {
  const status = (index: number): StepStatus =>
    index < current || current === 2 ? "complete" : index === current ? "current" : "upcoming";

  return (
    <Stepper
      className={className}
      steps={[
        { id: "name", label: "Name server", description: "Register the VPS", status: status(0) },
        { id: "install", label: "Install agent", description: "SSH or manual", status: status(1) },
        { id: "ready", label: "Ready to deploy", description: "Agent online", status: status(2) },
      ]}
    />
  );
}
