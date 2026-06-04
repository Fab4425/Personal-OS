import { DashboardHeader } from "@/components/layout/dashboard-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PageShellProps {
  title: string;
  description?: string;
  userEmail?: string | null;
  moduleName: string;
  comingSoon?: string;
  children?: React.ReactNode;
}

export function PageShell({
  title,
  description,
  userEmail,
  moduleName,
  comingSoon,
  children,
}: PageShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader
        title={title}
        description={description}
        userEmail={userEmail}
      />
      <main className="flex-1 space-y-6 p-4 pb-[max(6rem,env(safe-area-inset-bottom))] md:p-6 md:pb-6">
        {children ?? (
          <Card>
            <CardHeader>
              <CardTitle>{moduleName}</CardTitle>
              <CardDescription>
                {comingSoon ??
                  "Dieses Modul wird in Phase 2–3 implementiert."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Die Navigation und das Layout stehen. Als Nächstes: Daten-Sync
                und UI-Komponenten gemäß PLANNING.md.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
