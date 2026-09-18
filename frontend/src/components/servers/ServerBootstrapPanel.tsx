import { useEffect, useRef, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  joinServerBootstrapRoom,
  leaveServerBootstrapRoom,
  type BootstrapLogEvent,
  type BootstrapStatusEvent,
} from "@/lib/bootstrap-socket";
import { getUserSocket } from "@/lib/deployment-socket";
import {
  serverBootstrapKeySchema,
  serverBootstrapPasswordSchema,
  type ServerBootstrapForm,
} from "@/lib/validations/server-bootstrap.schema";
import * as configService from "@/services/config.service";
import * as serversService from "@/services/servers.service";

const publicConfigQueryKey = ["config", "public"] as const;

interface ServerBootstrapPanelProps {
  serverId: string;
  disabled?: boolean;
  initialHost?: string | null;
  initialPort?: number;
  initialUser?: string | null;
  onComplete?: () => void;
}

export function ServerBootstrapPanel({
  serverId,
  disabled,
  initialHost,
  initialPort = 22,
  initialUser,
  onComplete,
}: ServerBootstrapPanelProps) {
  const [authType, setAuthType] = useState<"privateKey" | "password">("privateKey");
  const [host, setHost] = useState(initialHost ?? "");
  const [port, setPort] = useState(String(initialPort));
  const [username, setUsername] = useState(initialUser ?? "root");
  const [privateKey, setPrivateKey] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<BootstrapLogEvent[]>([]);
  const logRef = useRef<HTMLDivElement>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const { data: publicConfig } = useQuery({
    queryKey: publicConfigQueryKey,
    queryFn: configService.getPublicConfig,
  });

  const dockerInstallReady = publicConfig?.agentInstallMode === "docker";
  const formDisabled = disabled || running || !dockerInstallReady;

  useEffect(() => {
    joinServerBootstrapRoom(serverId);
    const socket = getUserSocket();

    const onLog = (event: BootstrapLogEvent) => {
      setLogs((prev) => [...prev, event]);
    };

    const onStatus = (event: BootstrapStatusEvent) => {
      if (event.status === "running") {
        setRunning(true);
        return;
      }
      setRunning(false);
      if (event.status === "success") {
        onCompleteRef.current?.();
      }
      if (event.status === "failed" && event.errorMessage) {
        setSubmitError(event.errorMessage);
      }
    };

    socket.on("server:bootstrap:log", onLog);
    socket.on("server:bootstrap:status", onStatus);

    return () => {
      socket.off("server:bootstrap:log", onLog);
      socket.off("server:bootstrap:status", onStatus);
      leaveServerBootstrapRoom(serverId);
    };
  }, [serverId]);

  useEffect(() => {
    const el = logRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [logs]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setFieldErrors({});
    setLogs([]);

    const payload: ServerBootstrapForm =
      authType === "privateKey"
        ? {
            authType: "privateKey",
            host,
            port: Number(port) || 22,
            username,
            privateKey,
            consent: consent as true,
          }
        : {
            authType: "password",
            host,
            port: Number(port) || 22,
            username,
            password,
            consent: consent as true,
          };

    const parsed =
      authType === "privateKey"
        ? serverBootstrapKeySchema.safeParse(payload)
        : serverBootstrapPasswordSchema.safeParse(payload);

    if (!parsed.success) {
      const errors: Record<string, string> = {};
      parsed.error.errors.forEach((err) => {
        if (err.path[0]) errors[String(err.path[0])] = err.message;
      });
      setFieldErrors(errors);
      return;
    }

    setRunning(true);
    try {
      await serversService.bootstrapServer(serverId, parsed.data);
    } catch (err) {
      setRunning(false);
      setSubmitError(getApiErrorMessage(err, "Failed to start bootstrap"));
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Terminal className="h-4 w-4" />
          Install agent via SSH
        </CardTitle>
        <CardDescription>
          One-time connection to install Docker and the DeployHub agent. SSH credentials are not
          stored.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {publicConfig && !dockerInstallReady && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-foreground">
            SSH bootstrap needs <code className="text-xs">AGENT_DOCKER_IMAGE</code> on the control
            plane. Set it in backend env and restart API + worker — see docs/GHCR-AGENT.md.
          </div>
        )}

        {submitError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {submitError}
          </div>
        )}

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="bootstrap-host">Host</Label>
              <Input
                id="bootstrap-host"
                placeholder="203.0.113.10"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                disabled={formDisabled}
              />
              {fieldErrors.host && (
                <p className="text-xs text-destructive">{fieldErrors.host}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="bootstrap-port">Port</Label>
              <Input
                id="bootstrap-port"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                disabled={formDisabled}
              />
              {fieldErrors.port && (
                <p className="text-xs text-destructive">{fieldErrors.port}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bootstrap-user">SSH user</Label>
            <Input
              id="bootstrap-user"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={formDisabled}
            />
            {fieldErrors.username && (
              <p className="text-xs text-destructive">{fieldErrors.username}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={authType === "privateKey" ? "default" : "outline"}
              onClick={() => setAuthType("privateKey")}
              disabled={formDisabled}
            >
              Private key
            </Button>
            <Button
              type="button"
              size="sm"
              variant={authType === "password" ? "default" : "outline"}
              onClick={() => setAuthType("password")}
              disabled={formDisabled}
            >
              Password
            </Button>
          </div>

          {authType === "privateKey" ? (
            <div className="space-y-2">
              <Label htmlFor="bootstrap-key">Private key</Label>
              <textarea
                id="bootstrap-key"
                className="min-h-[120px] w-full rounded-md border bg-background p-3 font-mono text-xs"
                placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                disabled={formDisabled}
              />
              {fieldErrors.privateKey && (
                <p className="text-xs text-destructive">{fieldErrors.privateKey}</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="bootstrap-password">Password</Label>
              <Input
                id="bootstrap-password"
                type="password"
                autoComplete="off"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={formDisabled}
              />
              {fieldErrors.password && (
                <p className="text-xs text-destructive">{fieldErrors.password}</p>
              )}
            </div>
          )}

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              disabled={formDisabled}
            />
            <span>
              I authorize a one-time SSH session to install the agent. DeployHub will not save my
              key or password.
            </span>
          </label>
          {fieldErrors.consent && (
            <p className="text-xs text-destructive">{fieldErrors.consent}</p>
          )}

          <Button type="submit" disabled={formDisabled}>
            {running ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Installing…
              </>
            ) : (
              "Connect and install agent"
            )}
          </Button>
        </form>

        {logs.length > 0 && (
          <div
            ref={logRef}
            className="max-h-64 overflow-y-auto rounded-md border bg-muted/40 p-3 font-mono text-xs leading-relaxed"
          >
            {logs.map((entry, index) => (
              <div key={`${entry.timestamp}-${index}`} className="whitespace-pre-wrap break-all">
                {entry.line}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
