import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <>
      <Header title={title} description={description} />
      <div className="flex flex-1 items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Coming in a future phase</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This section will be implemented in the next development phase.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export function ServersPage() {
  return <PlaceholderPage title="Servers" description="Manage your Linux VPS servers and agents." />;
}

export function ProjectsPage() {
  return <PlaceholderPage title="Projects" description="Create and configure deployable projects." />;
}

export function DeploymentsPage() {
  return <PlaceholderPage title="Deployments" description="View deployment history and live logs." />;
}

export function SettingsPage() {
  return <PlaceholderPage title="Settings" description="Account and integration settings." />;
}

export function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Authentication will be added in Phase 2.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

export function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create account</CardTitle>
          <CardDescription>Registration will be added in Phase 2.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
