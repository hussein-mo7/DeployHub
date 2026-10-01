import { useMemo, useRef, useState } from "react";
import { Eye, EyeOff, FileUp, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  dedupeParsedEntries,
  parseDotenvContent,
  type ParsedEnvEntry,
} from "@/lib/parse-dotenv";
import type { EnvVariableDraft } from "@/types/projects.types";

const MAX_KEYS = 100;

interface EnvironmentVariablesBulkImportProps {
  existingKeys: string[];
  onMerge: (rows: Array<{ key: string; value: string; isSecret: boolean }>) => void;
  onCancel: () => void;
}

export function EnvironmentVariablesBulkImport({
  existingKeys,
  onMerge,
  onCancel,
}: EnvironmentVariablesBulkImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [raw, setRaw] = useState("");
  const [preview, setPreview] = useState<ParsedEnvEntry[] | null>(null);
  const [secretFlags, setSecretFlags] = useState<Record<string, boolean>>({});
  const [markAllSecret, setMarkAllSecret] = useState(false);
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});
  const [parseError, setParseError] = useState<string | null>(null);

  const existingKeySet = useMemo(() => new Set(existingKeys.map((k) => k.trim())), [existingKeys]);

  const runParse = () => {
    setParseError(null);
    if (!raw.trim()) {
      setParseError("Paste your .env content or upload a file first.");
      setPreview(null);
      return;
    }

    const parsed = parseDotenvContent(raw);
    const valid = dedupeParsedEntries(parsed);
    if (valid.length === 0) {
      setParseError("No valid KEY=value lines found.");
      setPreview(null);
      return;
    }
    if (valid.length > MAX_KEYS) {
      setParseError(`Too many variables (${valid.length}). Maximum is ${MAX_KEYS} per save.`);
      setPreview(null);
      return;
    }

    const flags: Record<string, boolean> = {};
    for (const row of valid) {
      flags[row.key] = markAllSecret || row.isSecret;
    }
    setSecretFlags(flags);
    setRevealedKeys({});
    setPreview(valid);
  };

  const toggleRevealKey = (key: string) => {
    setRevealedKeys((current) => ({ ...current, [key]: !current[key] }));
  };

  const previewRows = preview ?? [];
  const hasBlockingIssues = previewRows.some((row) =>
    row.issues.some((issue) => issue !== "Duplicate key in paste"),
  );

  const handleFile = (file: File | undefined) => {
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setRaw(typeof reader.result === "string" ? reader.result : "");
      setPreview(null);
      setParseError(null);
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (!preview || hasBlockingIssues) {
      return;
    }
    onMerge(
      preview.map((row) => ({
        key: row.key,
        value: row.value,
        isSecret: secretFlags[row.key] ?? row.isSecret,
      })),
    );
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Paste exported environment variables (Render, Railway, or a local{" "}
        <code className="rounded bg-muted px-1 font-mono text-xs">.env</code> file). Lines like{" "}
        <code className="font-mono text-xs">KEY=value</code>, optional{" "}
        <code className="font-mono text-xs">export</code>, quotes, and{" "}
        <code className="font-mono text-xs"># comments</code> are supported. Nothing is saved until
        you import and click Save in the editor.
      </p>

      <textarea
        className="min-h-[160px] w-full rounded-md border bg-background p-3 font-mono text-xs leading-relaxed"
        placeholder={`DATABASE_URL=postgres://...\nAPI_KEY="sk-live-..."\n# comments ignored`}
        value={raw}
        onChange={(e) => {
          setRaw(e.target.value);
          setPreview(null);
          setParseError(null);
        }}
        spellCheck={false}
      />

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".env,text/plain"
          className="hidden"
          onChange={(e) => {
            handleFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
          <Upload className="h-4 w-4" />
          Upload .env
        </Button>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={markAllSecret}
            onChange={(e) => setMarkAllSecret(e.target.checked)}
          />
          Mark all as secret (overrides auto-detect)
        </label>
      </div>

      {parseError && (
        <p className="text-sm text-destructive">{parseError}</p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={runParse}>
          Parse & preview
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Back to editor
        </Button>
      </div>

      {preview && previewRows.length > 0 && (
        <div className="space-y-3 rounded-lg border bg-card p-3">
          <p className="text-sm font-medium text-foreground">
            Preview — {previewRows.length} variable{previewRows.length === 1 ? "" : "s"}
          </p>
          <p className="text-xs text-muted-foreground">
            Values stay in your browser until you import and save. Use the eye icon to verify
            pasted values. Secret keys (passwords, tokens, API keys) are checked by default.
          </p>
          <div className="max-h-64 overflow-auto rounded-md border">
            <table className="w-full min-w-[420px] text-xs">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                  <th className="px-2 py-2 font-medium">Key</th>
                  <th className="px-2 py-2 font-medium">Value</th>
                  <th className="px-2 py-2 font-medium">Notes</th>
                  <th className="px-2 py-2 font-medium">Secret</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row) => {
                  const overwrite = existingKeySet.has(row.key);
                  const revealed = revealedKeys[row.key] === true;
                  const displayValue = !row.value
                    ? "(empty)"
                    : revealed
                      ? row.value
                      : "••••••••";
                  return (
                    <tr key={row.key} className="border-b last:border-0">
                      <td className="px-2 py-2 font-mono">{row.key}</td>
                      <td className="max-w-[240px] px-2 py-2">
                        <div className="flex items-center gap-1">
                          <span
                            className="min-w-0 flex-1 truncate font-mono text-muted-foreground"
                            title={revealed ? row.value : undefined}
                          >
                            {displayValue}
                          </span>
                          {row.value ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0"
                              aria-label={revealed ? "Hide value" : "Reveal value"}
                              onClick={() => toggleRevealKey(row.key)}
                            >
                              {revealed ? (
                                <EyeOff className="h-3.5 w-3.5" />
                              ) : (
                                <Eye className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex flex-col gap-0.5">
                          {row.issues.map((issue) => (
                            <span key={issue} className="text-destructive">
                              {issue}
                            </span>
                          ))}
                          {overwrite && (
                            <span className="text-amber-700 dark:text-amber-400">Overwrites existing</span>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="checkbox"
                          checked={secretFlags[row.key] ?? row.isSecret}
                          onChange={(e) =>
                            setSecretFlags((current) => ({
                              ...current,
                              [row.key]: e.target.checked,
                            }))
                          }
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled={hasBlockingIssues}
              onClick={handleImport}
            >
              <FileUp className="h-4 w-4" />
              Import into editor
            </Button>
            {hasBlockingIssues && (
              <p className="text-xs text-destructive">Fix invalid keys before importing.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function mergeEnvImportIntoDrafts(
  current: EnvVariableDraft[],
  imported: Array<{ key: string; value: string; isSecret: boolean }>,
): EnvVariableDraft[] {
  const map = new Map<string, EnvVariableDraft>();

  for (const row of current) {
    const key = row.key.trim();
    if (key) {
      map.set(key, row);
    }
  }

  for (const item of imported) {
    const key = item.key.trim();
    const existing = map.get(key);
    if (existing) {
      map.set(key, {
        ...existing,
        value: item.value,
        isSecret: item.isSecret,
        hasStoredSecret: false,
      });
    } else {
      map.set(key, {
        key,
        value: item.value,
        isSecret: item.isSecret,
      });
    }
  }

  const merged = Array.from(map.values());
  return merged.length > 0 ? merged : [{ key: "", value: "", isSecret: false }];
}
