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

export function DeploymentsPage() {
  return <PlaceholderPage title="Deployments" description="View deployment history and live logs." />;
}

export function SettingsPage() {
  return <PlaceholderPage title="Settings" description="Account and integration settings." />;
}
