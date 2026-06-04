"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: "idea" | "active" | "paused" | "done";
  progress_percent: number | null;
  github_url: string | null;
  stack: string[] | null;
}

const columns: { key: Project["status"]; label: string }[] = [
  { key: "idea", label: "Idee" },
  { key: "active", label: "Aktiv" },
  { key: "paused", label: "Pausiert" },
  { key: "done", label: "Fertig" },
];

export function ProjectKanban({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function addProject() {
    if (!name.trim()) return;
    setLoading(true);
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setName("");
    setLoading(false);
    router.refresh();
  }

  async function moveProject(id: string, status: Project["status"]) {
    await fetch("/api/projects", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Neues Projekt…"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button onClick={addProject} disabled={loading}>
          Hinzufügen
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {columns.map((col) => (
          <div key={col.key} className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground">
              {col.label}
            </h3>
            <div className="min-h-[120px] space-y-2 rounded-lg border border-dashed p-2">
              {projects
                .filter((p) => p.status === col.key)
                .map((p) => (
                  <Card key={p.id} className="shadow-sm">
                    <CardHeader className="p-3 pb-1">
                      <CardTitle className="text-sm">{p.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 p-3 pt-0">
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-primary"
                          style={{
                            width: `${p.progress_percent ?? 0}%`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {p.progress_percent ?? 0}%
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {columns
                          .filter((c) => c.key !== p.status)
                          .map((c) => (
                            <button
                              key={c.key}
                              type="button"
                              className={cn(
                                "rounded border px-1.5 py-0.5 text-[10px] hover:bg-muted"
                              )}
                              onClick={() => moveProject(p.id, c.key)}
                            >
                              → {c.label}
                            </button>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
