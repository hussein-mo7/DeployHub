import { existsSync, readFileSync } from "fs";
import path from "path";

export function resolveBootstrapScriptPath(): string {
  const candidates = [
    path.join(process.cwd(), "..", "scripts", "vps-bootstrap.sh"),
    path.join(process.cwd(), "scripts", "vps-bootstrap.sh"),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error("vps-bootstrap.sh not found (expected under repo scripts/)");
}

export function readBootstrapScript(): string {
  return readFileSync(resolveBootstrapScriptPath(), "utf8");
}

/** Single-quote safe for bash env assignment. */
export function shellSingleQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}
