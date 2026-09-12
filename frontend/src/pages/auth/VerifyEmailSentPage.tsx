import { Link, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
      setError("Email address is missing.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      const result = await authService.resendVerification(email);
      setMessage(result.message);
    } catch {
      setError("Could not resend verification email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Mail className="h-5 w-5" />
          </div>
          <CardTitle className="text-2xl">Check your email</CardTitle>
          <CardDescription>
            We sent a verification link{email ? ` to ${email}` : ""}. Open the link, then click
            the verify button to activate your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
              {message}
            </div>
          )}
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button variant="outline" className="w-full" onClick={() => void handleResend()} disabled={isLoading}>
            {isLoading ? "Sending..." : "Resend verification email"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already verified?{" "}
            <Link to={ROUTES.LOGIN} className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
