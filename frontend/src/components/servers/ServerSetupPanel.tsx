import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ServerSetupInfo } from "@/types/servers.types";

interface ServerSetupPanelProps {
  title?: string;
  setup: ServerSetupInfo;
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex gap-2">
        <pre className="flex-1 overflow-x-auto rounded-md border bg-muted/50 p-3 text-xs leading-relaxed">
          {value}
        </pre>
        <Button type="button" variant="outline" size="icon" onClick={() => void handleCopy()}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

export function ServerSetupPanel({
  title = "Agent setup",
  setup,
}: ServerSetupPanelProps) {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          Copy the install command to your VPS, or run the agent locally for development. Token
          expires {new Date(setup.expiresAt).toLocaleString()}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <CopyField label="Install command" value={setup.installCommand} />
        <CopyField label="Registration token" value={setup.registrationToken} />
        <p className="text-xs text-muted-foreground">
          For local testing, set <code className="rounded bg-muted px-1">AGENT_TOKEN</code> in{" "}
          <code className="rounded bg-muted px-1">agent/.env</code> after registering the agent via
          API.
        </p>
      </CardContent>
    </Card>
  );
}
