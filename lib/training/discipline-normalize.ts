/** Basis-Sportarten für Kombinationen (swim+run, bike+gym, …) */
export const BASE_DISCIPLINES = ["swim", "bike", "run", "gym"] as const;

export type BaseDiscipline = (typeof BASE_DISCIPLINES)[number];

export const SPECIAL_DISCIPLINES = ["race", "brick", "rest"] as const;

const TOKEN_ALIASES: Record<string, string> = {
  swim: "swim",
  swimming: "swim",
  schwimmen: "swim",
  bike: "bike",
  cycling: "bike",
  rad: "bike",
  run: "run",
  running: "run",
  lauf: "run",
  gym: "gym",
  strength: "gym",
  kraft: "gym",
  race: "race",
  wettkampf: "race",
  brick: "brick",
  zweikampf: "brick",
  rest: "rest",
  ruhe: "rest",
  ruhetag: "rest",
  off: "rest",
};

function isBaseDiscipline(value: string): value is BaseDiscipline {
  return (BASE_DISCIPLINES as readonly string[]).includes(value);
}

function isSpecialDiscipline(value: string): boolean {
  return (SPECIAL_DISCIPLINES as readonly string[]).includes(value);
}

function tokenizeDiscipline(raw: string): string[] {
  return raw
    .trim()
    .toLowerCase()
    .split(/[\s*+&/,]+|_+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

/** Normalisiert z. B. swim+run → swim_run, run*gym → run_gym, brick → brick */
export function normalizeDiscipline(raw: string): string | null {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return null;

  const tokens = tokenizeDiscipline(trimmed);
  if (tokens.length === 0) return null;

  const mapped = tokens.map((t) => TOKEN_ALIASES[t] ?? t);

  if (mapped.length === 1) {
    const single = mapped[0];
    if (isBaseDiscipline(single) || isSpecialDiscipline(single)) return single;
    return null;
  }

  const bases = mapped.filter(isBaseDiscipline);
  const specials = mapped.filter(isSpecialDiscipline);

  if (specials.length > 0 || bases.length !== mapped.length) return null;
  if (bases.length === 0) return null;

  const unique = Array.from(new Set(bases)).sort();
  return unique.join("_");
}

/** Zerlegt Kombi-Disziplinen in benötigte Garmin-Basisarten */
export function disciplineParts(discipline: string): BaseDiscipline[] {
  if (discipline === "brick") return ["bike", "run"];
  if (isSpecialDiscipline(discipline)) return [];
  if (!discipline.includes("_")) {
    return isBaseDiscipline(discipline) ? [discipline] : [];
  }
  return discipline
    .split("_")
    .filter(isBaseDiscipline)
    .sort() as BaseDiscipline[];
}

export function isComboDiscipline(discipline: string): boolean {
  return discipline === "brick" || disciplineParts(discipline).length > 1;
}

export function formatDisciplineLabel(discipline: string): string {
  const labels: Record<string, string> = {
    swim: "Schwimmen",
    bike: "Rad",
    run: "Laufen",
    gym: "Kraft",
    race: "Wettkampf",
    brick: "Brick",
    rest: "Ruhe",
  };
  if (labels[discipline]) return labels[discipline];
  if (discipline.includes("_")) {
    return discipline
      .split("_")
      .map((p) => labels[p] ?? p)
      .join("+");
  }
  return discipline;
}
