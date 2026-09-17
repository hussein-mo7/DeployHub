import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
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
import { loginSchema } from "@/lib/validations/auth.schema";
import { useAuthStore, getAuthErrorCode } from "@/stores/auth.store";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const flashMessage = (location.state as { message?: string } | null)?.message;
  const { login, isLoading, error, clearError } = useAuthStore();
  const [form, setForm] = useState({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    setFieldErrors({});

    const result = loginSchema.safeParse(form);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) errors[String(err.path[0])] = err.message;
      });
      setFieldErrors(errors);
      return;
    }

    try {
      await login(result.data);
      navigate(ROUTES.DASHBOARD);
    } catch (err) {
      if (getAuthErrorCode(err) === "EMAIL_NOT_VERIFIED") {
        navigate(`${ROUTES.VERIFY_EMAIL_SENT}?email=${encodeURIComponent(result.data.email)}`);
      }
    }
  };

  return (
    <AuthLayout>
      <AuthPageHeader
        title="Welcome back"
        description="Sign in to manage servers, projects, and deployments."
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        {flashMessage && <AuthAlert variant="success">{flashMessage}</AuthAlert>}
        {error && <AuthAlert variant="error">{error}</AuthAlert>}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          {fieldErrors.email && <p className="text-xs text-destructive">{fieldErrors.email}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="password">Password</Label>
            <Link
              to={ROUTES.FORGOT_PASSWORD}
              className="text-xs font-medium text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          {fieldErrors.password && (
            <p className="text-xs text-destructive">{fieldErrors.password}</p>
          )}
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>

      <AuthFooterLink
        prompt="Don't have an account?"
        linkText="Create one"
        to={ROUTES.REGISTER}
      />
    </AuthLayout>
  );
}
