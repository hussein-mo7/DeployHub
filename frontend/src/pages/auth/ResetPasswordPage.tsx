import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState, type FormEvent } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import {
  AuthAlert,
  AuthLayout,
  AuthPageHeader,
} from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROUTES } from "@/constants/routes";
import { getApiErrorMessage } from "@/lib/api-error";
import { resetPasswordSchema } from "@/lib/validations/auth.schema";
import * as authService from "@/services/auth.service";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";

  const [form, setForm] = useState({ newPassword: "", confirmNewPassword: "" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!token) {
      setError("This reset link is invalid. Request a new one from the sign-in page.");
      return;
    }

    const parsed = resetPasswordSchema.safeParse({ token, ...form });
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      parsed.error.errors.forEach((issue) => {
        if (issue.path[0]) {
          errors[String(issue.path[0])] = issue.message;
        }
      });
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await authService.resetPassword(parsed.data);
      setSuccess(result.message);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not reset password. Request a new link."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <KeyRound className="h-6 w-6" />
      </div>

      <AuthPageHeader
        title="Choose a new password"
        description={
          token
            ? "Enter a new password for your account."
            : "This link is missing a token. Request a new reset email from sign in."
        }
      />

      {success ? (
        <div className="space-y-4">
          <AuthAlert variant="success">{success}</AuthAlert>
          <Button className="w-full" size="lg" onClick={() => navigate(ROUTES.LOGIN)}>
            Continue to sign in
          </Button>
        </div>
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
          {error && <AuthAlert variant="error">{error}</AuthAlert>}

          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            />
            {fieldErrors.newPassword && (
              <p className="text-xs text-destructive">{fieldErrors.newPassword}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-new-password">Confirm new password</Label>
            <Input
              id="confirm-new-password"
              type="password"
              autoComplete="new-password"
              value={form.confirmNewPassword}
              onChange={(e) => setForm({ ...form, confirmNewPassword: e.target.value })}
            />
            {fieldErrors.confirmNewPassword && (
              <p className="text-xs text-destructive">{fieldErrors.confirmNewPassword}</p>
            )}
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting || !token}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating…
              </>
            ) : (
              "Update password"
            )}
          </Button>
        </form>
      )}

      {!success && (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          <Link to={ROUTES.FORGOT_PASSWORD} className="font-medium text-primary hover:underline">
            Request a new link
          </Link>
          {" · "}
          <Link to={ROUTES.LOGIN} className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      )}
    </AuthLayout>
  );
}
