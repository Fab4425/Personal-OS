"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AcademicAverageChart } from "@/components/academic/AcademicAverageChart";
import type { AcademicSubjectRow, GradeHistoryPoint } from "@/lib/academic/subjects";
import {
  classAverage,
  countGradedSubjects,
  formatGrade,
  subjectOverallGrade,
} from "@/lib/academic/grades";

interface AcademicGradesBoardProps {
  subjects: AcademicSubjectRow[];
  history: GradeHistoryPoint[];
}

function gradeFieldValue(grade: number | null): string {
  if (grade == null) return "";
  return String(grade);
}

export function AcademicGradesBoard({
  subjects: initialSubjects,
  history,
}: AcademicGradesBoardProps) {
  const router = useRouter();
  const [subjects, setSubjects] = useState(initialSubjects);
  const [savingId, setSavingId] = useState<string | null>(null);

  const average = useMemo(() => classAverage(subjects), [subjects]);
  const gradedCount = useMemo(() => countGradedSubjects(subjects), [subjects]);

  async function saveGrade(
    id: string,
    field: "oral_grade" | "written_grade",
    value: string
  ) {
    setSavingId(id);
    const payload =
      value.trim() === ""
        ? { id, [field]: null }
        : { id, [field]: value };

    const res = await fetch("/api/academic/subjects", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSavingId(null);

    if (!res.ok) return;

    const parsed =
      value.trim() === "" ? null : Number(value.replace(",", "."));
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              [field]:
                value.trim() === ""
                  ? null
                  : Number.isNaN(parsed)
                    ? s[field]
                    : parsed,
            }
          : s
      )
    );
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notendurchschnitt</CardTitle>
            <CardDescription>
              {gradedCount} von {subjects.length} Fächern mit Note
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold tabular-nums">
              {average != null ? formatGrade(average) : "—"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Deutsche Skala 1 (sehr gut) bis 6 (ungenügend)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gesamtnote</CardTitle>
            <CardDescription>
              Pro Fach: Mittel aus mündlich und schriftlich
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Fehlt eine der beiden Noten, zählt nur die eingetragene.
          </CardContent>
        </Card>
      </div>

      <AcademicAverageChart data={history} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fächer</CardTitle>
          <CardDescription>Noten zwischen 1 und 6 (z. B. 2 oder 2,5)</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Fach</th>
                <th className="pb-2 pr-2 font-medium w-24">Mündlich</th>
                <th className="pb-2 pr-2 font-medium w-24">Schriftlich</th>
                <th className="pb-2 font-medium w-20 text-right">Gesamt</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((s) => {
                const overall = subjectOverallGrade(
                  s.oral_grade,
                  s.written_grade
                );
                const busy = savingId === s.id;
                return (
                  <tr key={s.id} className="border-b border-border/60">
                    <td className="py-2.5 pr-4 font-medium">{s.name}</td>
                    <td className="py-2 pr-2">
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder="—"
                        className="h-8 w-20"
                        key={`${s.id}-o-${s.oral_grade}`}
                        defaultValue={gradeFieldValue(s.oral_grade)}
                        disabled={busy}
                        onBlur={(e) => {
                          const next = e.target.value;
                          const prev = gradeFieldValue(s.oral_grade);
                          if (next !== prev) {
                            void saveGrade(s.id, "oral_grade", next);
                          }
                        }}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder="—"
                        className="h-8 w-20"
                        key={`${s.id}-w-${s.written_grade}`}
                        defaultValue={gradeFieldValue(s.written_grade)}
                        disabled={busy}
                        onBlur={(e) => {
                          const next = e.target.value;
                          const prev = gradeFieldValue(s.written_grade);
                          if (next !== prev) {
                            void saveGrade(s.id, "written_grade", next);
                          }
                        }}
                      />
                    </td>
                    <td className="py-2 text-right tabular-nums font-semibold">
                      {overall != null ? formatGrade(overall) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
