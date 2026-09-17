import { useSearchParams } from "react-router-dom";
import { useState } from "react";
import { Loader2, Mail } from "lucide-react";
import {
  AuthAlert,
  AuthFooterLink,
  AuthLayout,
  AuthPageHeader,
} from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import * as authService from "@/services/auth.service";

export function VerifyEmailSentPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleResend = async () => {
    if (!email) {
      setError("Email address is missing. Return to sign in and try registering again.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      const result = await authService.resendVerification(email);
      setMessage(result.message);
    } catch {
      setError("Could not resend verification email. Please try again in a moment.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Mail className="h-6 w-6" />
      </div>

      <AuthPageHeader
        title="Check your inbox"
        description={
          email
            ? `We sent a verification link to ${email}. Open it in this browser, then sign in.`
            : "We sent a verification link to your email. Open it to activate your account."
        }
      />

      <div className="space-y-4">
        {message && <AuthAlert variant="success">{message}</AuthAlert>}
        {error && <AuthAlert variant="error">{error}</AuthAlert>}

        <Button
          variant="outline"
          className="w-full"
          size="lg"
          onClick={() => void handleResend()}
          disabled={isLoading || !email}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending…
            </>
          ) : (
            "Resend verification email"
          )}
        </Button>
      </div>

      <AuthFooterLink prompt="Already verified?" linkText="Sign in" to={ROUTES.LOGIN} />
    </AuthLayout>
  );
}
