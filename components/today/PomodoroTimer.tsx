"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const WORK_SEC = 25 * 60;
const BREAK_SEC = 5 * 60;

export function PomodoroTimer() {
  const [seconds, setSeconds] = useState(WORK_SEC);
  const [running, setRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          setRunning(false);
          if (!isBreak) {
            setIsBreak(true);
            return BREAK_SEC;
          }
          setIsBreak(false);
          return WORK_SEC;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, isBreak]);

  const m = Math.floor(seconds / 60);
  const s = seconds % 60;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pomodoro</CardTitle>
        <CardDescription>
          {isBreak ? "Pause" : "Fokus"} · 25 / 5 Min
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <p className="text-5xl font-bold tabular-nums">
          {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
        </p>
        <div className="flex gap-2">
          <Button onClick={() => setRunning(!running)}>
            {running ? "Pause" : "Start"}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setRunning(false);
              setIsBreak(false);
              setSeconds(WORK_SEC);
            }}
          >
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
