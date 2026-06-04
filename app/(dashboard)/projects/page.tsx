import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/layout/page-shell";
import { ProjectKanban, type Project } from "@/components/projects/ProjectKanban";

export default async function ProjectsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: projects } = await supabase
    .from("dev_projects")
    .select("*")
    .eq("user_id", user!.id)
    .order("updated_at", { ascending: false });

  return (
    <PageShell
      title="Projekte"
      description="Kanban · Dev-Projekte"
      userEmail={user?.email}
      moduleName="Projekt Tracker"
    >
      <ProjectKanban projects={(projects ?? []) as Project[]} />
    </PageShell>
  );
}
