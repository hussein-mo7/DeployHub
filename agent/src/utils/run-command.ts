import { spawn } from "node:child_process";

export type RunCommandOptions = {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  onLine?: (line: string) => void;
  /** When set, stderr lines must pass this filter to be forwarded to onLine. */
  stderrLineFilter?: (line: string) => boolean;
};

export async function runCommand(
  command: string,
  args: string[],
  options: RunCommandOptions = {},
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    let lastFatalLine: string | undefined;

    const forwardLine = (line: string, stream: "stdout" | "stderr") => {
      const trimmed = line.trim();
      if (!trimmed) {
        return;
      }
      if (trimmed.startsWith("fatal:")) {
        lastFatalLine = trimmed;
      }
      if (stream === "stderr" && options.stderrLineFilter && !options.stderrLineFilter(trimmed)) {
        return;
      }
      options.onLine?.(trimmed);
    };

    const child = spawn(command, args, {
      cwd: options.cwd,
      env: { ...process.env, ...options.env },
      // shell:true on Windows breaks args (URLs/tokens) and causes git "Too many arguments"
      shell: false,
      windowsHide: true,
    });

    const handleData =
      (stream: "stdout" | "stderr") =>
      (chunk: Buffer): void => {
        chunk
          .toString()
          .split(/\r?\n/)
          .forEach((line) => forwardLine(line, stream));
      };

    child.stdout.on("data", handleData("stdout"));
    child.stderr.on("data", handleData("stderr"));

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        const detail = lastFatalLine ?? `${command} exited with code ${code}`;
        reject(new Error(detail));
      }
    });
  });
}

/** Skip git's multi-line usage text when clone fails; keep real errors. */
export function gitCloneStderrFilter(line: string): boolean {
  if (line.startsWith("fatal:")) {
    return true;
  }
  if (/^usage:\s/i.test(line)) {
    return false;
  }
  if (/^\s*(-{1,2}[\w-]|--\[[\w-]+\])/.test(line)) {
    return false;
  }
  if (/^Cloning into|^remote:|^Receiving objects|^Resolving deltas|^Updating files/i.test(line)) {
    return true;
  }
  if (/^\d+%|^\s+\d+\/\d+/i.test(line)) {
    return true;
  }
  return false;
}
