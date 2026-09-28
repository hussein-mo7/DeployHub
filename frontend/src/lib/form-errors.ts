import type { ZodError } from "zod";

/** First error message per top-level field, for inline form hints. */
export function zodFieldErrors(error: ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.errors) {
    const field = issue.path[0];
    if (field !== undefined && errors[String(field)] === undefined) {
      errors[String(field)] = issue.message;
    }
  }
  return errors;
}
