const STORAGE_KEY = "topo-europa-progress-v1";

export type CountryStat = {
  seen: number;
  correct: number;
};

export type ProgressState = {
  stats: Record<string, CountryStat>;
  bestScore: number;
  quizzes: number;
};

const EMPTY: ProgressState = { stats: {}, bestScore: 0, quizzes: 0 };

export function loadProgress(): ProgressState {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as ProgressState;
    if (!parsed || typeof parsed !== "object") return EMPTY;
    return {
      stats: parsed.stats ?? {},
      bestScore: parsed.bestScore ?? 0,
      quizzes: parsed.quizzes ?? 0,
    };
  } catch {
    return EMPTY;
  }
}

export function saveProgress(state: ProgressState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function recordQuiz(
  state: ProgressState,
  results: { id: string; correct: boolean }[],
  percent: number,
): ProgressState {
  const stats = { ...state.stats };
  for (const result of results) {
    const prev = stats[result.id] ?? { seen: 0, correct: 0 };
    stats[result.id] = {
      seen: prev.seen + 1,
      correct: prev.correct + (result.correct ? 1 : 0),
    };
  }
  return {
    stats,
    bestScore: Math.max(state.bestScore, percent),
    quizzes: state.quizzes + 1,
  };
}

export function accuracy(stat: CountryStat | undefined): number {
  if (!stat || stat.seen === 0) return 1;
  return stat.correct / stat.seen;
}

export function weakestIds(
  stats: Record<string, CountryStat>,
  limit = 12,
): string[] {
  return Object.entries(stats)
    .filter(([, s]) => s.seen >= 1 && s.correct / s.seen < 0.8)
    .sort((a, b) => a[1].correct / a[1].seen - b[1].correct / b[1].seen)
    .slice(0, limit)
    .map(([id]) => id);
}

export function resetProgress() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
