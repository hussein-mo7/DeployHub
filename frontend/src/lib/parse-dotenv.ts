/** Matches backend / Zod env key rules. */
export const ENV_VAR_KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

export interface ParsedEnvEntry {
  key: string;
  value: string;
  lineNumber: number;
  isSecret: boolean;
  issues: string[];
}

export function looksSensitiveEnvKey(key: string): boolean {
  const upper = key.toUpperCase();
  return (
    /(SECRET|PASSWORD|TOKEN|PRIVATE|CREDENTIAL|AUTH)/.test(upper) ||
    upper.endsWith("_KEY") ||
    upper.includes("API_KEY")
  );
}

function unquoteValue(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.length >= 2) {
    const first = trimmed[0];
    const last = trimmed[trimmed.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      const inner = trimmed.slice(1, -1);
      if (first === '"') {
        return inner.replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
      }
      return inner;
    }
  }
  return trimmed;
}

/**
 * Parse pasted `.env` text (one KEY=value per line). Comments and blank lines are skipped.
 */
export function parseDotenvContent(content: string): ParsedEnvEntry[] {
  const lines = content.split(/\r?\n/);
  const entries: ParsedEnvEntry[] = [];
  const keyOccurrences = new Map<string, number>();

  for (let index = 0; index < lines.length; index += 1) {
    const lineNumber = index + 1;
    let line = lines[index].trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    if (line.startsWith("export ")) {
      line = line.slice("export ".length).trim();
    }

    const equalsIndex = line.indexOf("=");
    if (equalsIndex <= 0) {
      entries.push({
        key: "",
        value: "",
        lineNumber,
        isSecret: false,
        issues: ["Expected KEY=value"],
      });
      continue;
    }

    const key = line.slice(0, equalsIndex).trim();
    const value = unquoteValue(line.slice(equalsIndex + 1));
    const issues: string[] = [];

    if (!ENV_VAR_KEY_PATTERN.test(key)) {
      issues.push("Invalid key name");
    }

    keyOccurrences.set(key, (keyOccurrences.get(key) ?? 0) + 1);

    entries.push({
      key,
      value,
      lineNumber,
      isSecret: looksSensitiveEnvKey(key),
      issues,
    });
  }

  for (const entry of entries) {
    if (entry.key && (keyOccurrences.get(entry.key) ?? 0) > 1) {
      if (!entry.issues.includes("Duplicate key in paste")) {
        entry.issues.push("Duplicate key in paste");
      }
    }
  }

  return entries;
}

/** Keep the last occurrence when the same key appears multiple times in a paste. */
export function dedupeParsedEntries(entries: ParsedEnvEntry[]): ParsedEnvEntry[] {
  const byKey = new Map<string, ParsedEnvEntry>();
  for (const entry of entries) {
    if (!entry.key || entry.issues.includes("Invalid key name")) {
      continue;
    }
    byKey.set(entry.key, entry);
  }
  return Array.from(byKey.values());
}
