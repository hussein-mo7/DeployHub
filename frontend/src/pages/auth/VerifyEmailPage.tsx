import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";
import * as authService from "@/services/auth.service";

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!token) {
      setError("Invalid verification link. Please request a new one.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await authService.verifyEmail(token);
      setSuccess(result.message);
    } catch (err) {
      setError(getErrorMessage(err, "Verification failed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <MailCheck className="h-5 w-5" />
          </div>
          <CardTitle className="text-2xl">Verify your email</CardTitle>
          <CardDescription>
            Click the button below to confirm your email address. This extra step helps keep your
            account secure.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          {success ? (
            <>
              <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-foreground">
                {success}
              </div>
              <Button className="w-full" onClick={() => navigate(ROUTES.LOGIN)}>
                Go to sign in
              </Button>
            </>
          ) : (
            <Button className="w-full" onClick={() => void handleVerify()} disabled={isLoading || !token}>
              {isLoading ? "Verifying..." : "Verify email"}
            </Button>
          )}

          {!success && (
            <p className="text-center text-sm text-muted-foreground">
              Wrong email?{" "}
              <Link to={ROUTES.LOGIN} className="font-medium text-primary hover:underline">
                Back to sign in
              </Link>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response &&
    error.response.data &&
    typeof error.response.data === "object" &&
    "error" in error.response.data &&
    error.response.data.error &&
    typeof error.response.data.error === "object" &&
    "message" in error.response.data.error &&
    typeof error.response.data.error.message === "string"
  ) {
    return error.response.data.error.message;
  }
  return fallback;
}
