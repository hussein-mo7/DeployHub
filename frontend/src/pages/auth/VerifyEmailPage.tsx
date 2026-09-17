import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import {
  AuthAlert,
  AuthLayout,
  AuthPageHeader,
} from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { getApiErrorMessage } from "@/lib/api-error";
import * as authService from "@/services/auth.service";

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";
  const attemptedRef = useRef(false);

  const [isLoading, setIsLoading] = useState(Boolean(token));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const runVerify = async (verificationToken: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await authService.verifyEmail(verificationToken);
      setSuccess(result.message);
    } catch (err) {
      setError(getApiErrorMessage(err, "Verification failed. Request a new link."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!token || attemptedRef.current) {
      return;
    }
    attemptedRef.current = true;
    void runVerify(token);
  }, [token]);

  const handleManualVerify = () => {
    if (!token) {
      setError("Invalid verification link. Please request a new one.");
      return;
    }
    void runVerify(token);
  };

  return (
    <AuthLayout>
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <MailCheck className="h-6 w-6" />
      </div>

      <AuthPageHeader
        title="Verify your email"
        description={
          token
            ? "Confirming your address…"
            : "This link is missing a token. Use the link from your email or request a new one."
        }
      />

      {isLoading && !success && !error && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Verifying your email…
        </div>
      )}

      {error && <AuthAlert variant="error">{error}</AuthAlert>}

      {success && (
        <div className="space-y-4">
          <AuthAlert variant="success">{success}</AuthAlert>
          <Button className="w-full" size="lg" onClick={() => navigate(ROUTES.LOGIN)}>
            Continue to sign in
          </Button>
        </div>
      )}

      {!success && !isLoading && (
        <Button className="w-full" size="lg" onClick={handleManualVerify} disabled={!token}>
          Try again
        </Button>
      )}

      {!success && (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          <Link to={ROUTES.LOGIN} className="font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      )}
    </AuthLayout>
  );
}
