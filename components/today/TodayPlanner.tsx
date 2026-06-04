"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PomodoroTimer } from "@/components/today/PomodoroTimer";

interface Habit {
  id: string;
  name: string;
  icon: string | null;
}

interface TodayPlannerProps {
  initialGoals: string[];
  initialMood: number | null;
  initialNotes: string;
  habits: Habit[];
  completedHabitIds: string[];
}

export function TodayPlanner({
  initialGoals,
  initialMood,
  initialNotes,
  habits,
  completedHabitIds,
}: TodayPlannerProps) {
  const router = useRouter();
  const [goals, setGoals] = useState<string[]>(
    initialGoals.length ? initialGoals : ["", "", ""]
  );
  const [mood, setMood] = useState(initialMood ?? 3);
  const [notes, setNotes] = useState(initialNotes);
  const [done, setDone] = useState(new Set(completedHabitIds));
  const [newHabit, setNewHabit] = useState("");

  async function savePlan() {
    await fetch("/api/daily-plans", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        top_3_goals: goals.filter(Boolean),
        mood_score: mood,
        notes,
      }),
    });
    router.refresh();
  }

  async function toggleHabit(habitId: string) {
    const next = !done.has(habitId);
    setDone((prev) => {
      const s = new Set(prev);
      if (next) s.add(habitId);
      else s.delete(habitId);
      return s;
    });
    await fetch("/api/habits", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ habit_id: habitId, completed: next }),
    });
  }

  async function addHabit() {
    if (!newHabit.trim()) return;
    await fetch("/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newHabit.trim() }),
    });
    setNewHabit("");
    router.refresh();
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top 3 Ziele</CardTitle>
          <CardDescription>Fokus für heute</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Input
              key={i}
              placeholder={`Ziel ${i + 1}`}
              value={goals[i] ?? ""}
              onChange={(e) => {
                const next = [...goals];
                next[i] = e.target.value;
                setGoals(next);
              }}
            />
          ))}
          <div>
            <Label className="text-xs">Stimmung ({mood}/5)</Label>
            <input
              type="range"
              min={1}
              max={5}
              value={mood}
              onChange={(e) => setMood(Number(e.target.value))}
              className="mt-1 w-full"
            />
          </div>
          <Input
            placeholder="Notizen…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <Button onClick={savePlan}>Speichern</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Habits</CardTitle>
          <CardDescription>Tägliche Gewohnheiten</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {habits.map((h) => (
            <label
              key={h.id}
              className="flex cursor-pointer items-center gap-2 rounded-lg border p-2"
            >
              <input
                type="checkbox"
                checked={done.has(h.id)}
                onChange={() => toggleHabit(h.id)}
              />
              <span>
                {h.icon ?? "✓"} {h.name}
              </span>
            </label>
          ))}
          <div className="flex gap-2 pt-2">
            <Input
              placeholder="Neuer Habit…"
              value={newHabit}
              onChange={(e) => setNewHabit(e.target.value)}
            />
            <Button variant="outline" onClick={addHabit}>
              +
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="lg:col-span-2">
        <PomodoroTimer />
      </div>
    </div>
  );
}
