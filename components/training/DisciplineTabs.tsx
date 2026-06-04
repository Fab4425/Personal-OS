"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkoutFeed } from "@/components/training/workout-feed";

export interface WorkoutItem {
  id: string;
  discipline: string;
  source: string;
  date: string;
  duration_sec: number | null;
  distance_m: number | null;
}

const disciplines = [
  { key: "all", label: "Alle" },
  { key: "swim", label: "Schwimmen" },
  { key: "bike", label: "Rad" },
  { key: "run", label: "Laufen" },
  { key: "gym", label: "Gym" },
] as const;

interface DisciplineTabsProps {
  workouts: WorkoutItem[];
}

export function DisciplineTabs({ workouts }: DisciplineTabsProps) {
  return (
    <Tabs defaultValue="all">
      <TabsList className="flex h-auto flex-wrap">
        {disciplines.map((d) => (
          <TabsTrigger key={d.key} value={d.key}>
            {d.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {disciplines.map((d) => (
        <TabsContent key={d.key} value={d.key}>
          <WorkoutFeed
            workouts={
              d.key === "all"
                ? workouts
                : workouts.filter((w) => w.discipline === d.key)
            }
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}
