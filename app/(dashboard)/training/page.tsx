import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/layout/page-shell";
import { TrainingDashboard } from "@/components/training/TrainingDashboard";
import { TrainingDashboardSkeleton } from "@/components/training/TrainingDashboardSkeleton";

export default async function TrainingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <PageShell
      title="Training"
      description="Belastung · Readiness · Schlaf"
      userEmail={user?.email}
      moduleName="Training"
    >
      <Suspense fallback={<TrainingDashboardSkeleton />}>
        <TrainingDashboard />
      </Suspense>
    </PageShell>
  );
}
