import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/layout/page-shell";
import { IntegrationsPanel } from "@/components/integrations/integrations-panel";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <PageShell
      title="Einstellungen"
      description="Integrationen · Sync · OAuth"
      userEmail={user?.email}
      moduleName="Integrationen"
    >
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">Lade Einstellungen…</p>
        }
      >
        <IntegrationsPanel />
      </Suspense>
    </PageShell>
  );
}
