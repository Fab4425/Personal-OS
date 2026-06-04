export interface CoachContext {
  userName: string;
  readiness: number;
  sleepHours: number;
  sleepQuality: number;
  hrv: number;
  hrvAvg: number;
  lastWorkoutDiscipline: string;
  lastWorkoutDate: string;
  atl: number;
  tsb: number;
  projects: string;
  todayPlan: string;
}

export function buildSystemPrompt(ctx: CoachContext): string {
  return `Du bist der persönliche Coach und Assistent von ${ctx.userName}.
Aktuelle Daten:
- Readiness Score heute: ${ctx.readiness}/100
- Schlaf letzte Nacht: ${ctx.sleepHours}h, Qualität ${ctx.sleepQuality}/5
- HRV: ${ctx.hrv} (7-Tage Schnitt: ${ctx.hrvAvg})
- Letzte Einheit: ${ctx.lastWorkoutDiscipline} am ${ctx.lastWorkoutDate}
- Trainingsbelastung (ATL): ${ctx.atl}, Form (TSB): ${ctx.tsb}
- Aktive Projekte: ${ctx.projects}
- Heute geplant: ${ctx.todayPlan}
Antworte auf Deutsch, sei konkret und datenbasiert.`;
}
