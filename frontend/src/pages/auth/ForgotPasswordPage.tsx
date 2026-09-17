import { Link } from "react-router-dom";
import { useState, type FormEvent } from "react";
import { Loader2, Mail } from "lucide-react";
import {
  AuthAlert,
  AuthFooterLink,
  AuthLayout,
  AuthPageHeader,
} from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROUTES } from "@/constants/routes";
import { getApiErrorMessage } from "@/lib/api-error";
import { forgotPasswordSchema } from "@/lib/validations/auth.schema";
import * as authService from "@/services/auth.service";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFieldError(null);
    setRequestError(null);
    setSuccessMessage(null);

    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setFieldError(parsed.error.errors[0]?.message ?? "Invalid email");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await authService.forgotPassword(parsed.data.email);
      setSuccessMessage(result.message);
    } catch (err) {
      setRequestError(getApiErrorMessage(err, "Could not send reset email"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Mail className="h-6 w-6" />
      </div>

      <AuthPageHeader
        title="Forgot password?"
        description="Enter your account email. If it exists, we will send a link to choose a new password."
      />

      {successMessage ? (
        <div className="space-y-4">
          <AuthAlert variant="success">{successMessage}</AuthAlert>
          <Button className="w-full" size="lg" asChild>
            <Link to={ROUTES.LOGIN}>Back to sign in</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
          {requestError && <AuthAlert variant="error">{requestError}</AuthAlert>}

          <div className="space-y-2">
            <Label htmlFor="forgot-email">Email</Label>
            <Input
              id="forgot-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {fieldError && <p className="text-xs text-destructive">{fieldError}</p>}
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending…
              </>
            ) : (
              "Send reset link"
            )}
          </Button>
        </form>
      )}

      <AuthFooterLink prompt="Remember your password?" linkText="Sign in" to={ROUTES.LOGIN} />
    </AuthLayout>
  );
}
