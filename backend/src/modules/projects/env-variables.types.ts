export interface EnvironmentVariableSummary {
  id: string;
  environmentId: string;
  key: string;
  value: string | null;
  maskedValue: string | null;
  isSecret: boolean;
  hasValue: boolean;
  createdAt: string;
  updatedAt: string;
}
