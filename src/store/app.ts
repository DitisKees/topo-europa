import { create } from "zustand";
import {
  loadProgress,
  recordQuiz,
  resetProgress,
  saveProgress,
  weakestIds,
  type ProgressState,
} from "@/lib/progress";
import { matchesAnswer } from "@/lib/normalize";
import {
  buildQuestions,
  countryById,
  type InputMode,
  type Question,
  type QuizLength,
  type QuizMode,
} from "@/lib/quiz";
import type { ScopeId } from "@/data/countries";

export type Screen = "home" | "setup" | "quiz" | "results" | "atlas" | "progress";

export type Verdict = "idle" | "correct" | "wrong";

type AppState = {
  screen: Screen;
  mode: QuizMode;
  scope: ScopeId;
  length: QuizLength;
  inputMode: InputMode;
  questions: Question[];
  index: number;
  verdict: Verdict;
  selectedId: string | null;
  pickedLabel: string | null;
  typedValue: string;
  answers: { id: string; correct: boolean }[];
  startedAt: number | null;
  elapsedMs: number;
  progress: ProgressState;
  atlasId: string | null;
  go: (screen: Screen) => void;
  setSetup: (
    partial: Partial<Pick<AppState, "mode" | "scope" | "length" | "inputMode">>,
  ) => void;
  startQuiz: (
    overrides?: Partial<Pick<AppState, "mode" | "scope" | "length" | "inputMode">>,
  ) => void;
  choose: (id: string) => void;
  submitChoice: (label: string) => void;
  submitTyped: () => void;
  setTyped: (value: string) => void;
  next: () => void;
  retryMissed: () => void;
  retrySame: () => void;
  setAtlas: (id: string | null) => void;
  resetStats: () => void;
};

function finishIfComplete(
  state: AppState,
  answers: { id: string; correct: boolean }[],
) {
  const elapsedMs = state.startedAt ? Date.now() - state.startedAt : 0;
  const percent = Math.round(
    (answers.filter((a) => a.correct).length / Math.max(answers.length, 1)) * 100,
  );
  const progress = recordQuiz(state.progress, answers, percent);
  saveProgress(progress);
  return { screen: "results" as const, elapsedMs, progress, answers };
}

function resetQuestion() {
  return {
    verdict: "idle" as const,
    selectedId: null,
    pickedLabel: null,
    typedValue: "",
  };
}

export const useApp = create<AppState>((set, get) => ({
  screen: "home",
  mode: "click-country",
  scope: "all",
  length: 10,
  inputMode: "choice",
  questions: [],
  index: 0,
  verdict: "idle",
  selectedId: null,
  pickedLabel: null,
  typedValue: "",
  answers: [],
  startedAt: null,
  elapsedMs: 0,
  progress: { stats: {}, bestScore: 0, quizzes: 0 },
  atlasId: null,
  go: (screen) => set({ screen }),
  setSetup: (partial) => set(partial),
  startQuiz: (overrides) => {
    const current = get();
    const mode = overrides?.mode ?? current.mode;
    const scope = overrides?.scope ?? current.scope;
    const length = overrides?.length ?? current.length;
    const inputMode = overrides?.inputMode ?? current.inputMode;
    const questions = buildQuestions({
      mode,
      scope,
      length,
      inputMode,
      weakIds: weakestIds(current.progress.stats),
    });
    set({
      mode,
      scope,
      length,
      inputMode,
      questions,
      index: 0,
      ...resetQuestion(),
      answers: [],
      startedAt: Date.now(),
      elapsedMs: 0,
      screen: "quiz",
    });
  },
  choose: (id) => {
    const state = get();
    if (state.verdict !== "idle") return;
    const question = state.questions[state.index];
    if (!question) return;
    const correct = id === question.countryId;
    const answers = [...state.answers, { id: question.countryId, correct }];
    set({
      verdict: correct ? "correct" : "wrong",
      selectedId: id,
      answers,
    });
  },
  submitChoice: (label) => {
    const state = get();
    if (state.verdict !== "idle") return;
    const question = state.questions[state.index];
    if (!question) return;
    const country = countryById(question.countryId);
    const correct = matchesAnswer(label, country.capital, country.capitalAliases);
    const answers = [...state.answers, { id: question.countryId, correct }];
    set({
      verdict: correct ? "correct" : "wrong",
      selectedId: question.countryId,
      pickedLabel: label,
      answers,
    });
  },
  setTyped: (typedValue) => set({ typedValue }),
  submitTyped: () => {
    const state = get();
    if (state.verdict !== "idle") return;
    const question = state.questions[state.index];
    if (!question) return;
    const country = countryById(question.countryId);
    const correct = matchesAnswer(
      state.typedValue,
      country.capital,
      country.capitalAliases,
    );
    const answers = [...state.answers, { id: question.countryId, correct }];
    set({
      verdict: correct ? "correct" : "wrong",
      selectedId: question.countryId,
      pickedLabel: state.typedValue,
      answers,
    });
  },
  next: () => {
    const state = get();
    const nextIndex = state.index + 1;
    if (nextIndex >= state.questions.length) {
      set(finishIfComplete(state, state.answers));
      return;
    }
    set({
      index: nextIndex,
      ...resetQuestion(),
    });
  },
  retryMissed: () => {
    const state = get();
    const missed = state.answers.filter((a) => !a.correct).map((a) => a.id);
    if (missed.length === 0) {
      state.startQuiz();
      return;
    }
    const questions = buildQuestions({
      mode: state.mode,
      scope: "weak",
      length: "all",
      inputMode: state.inputMode,
      weakIds: missed,
    });
    set({
      questions: questions.length > 0 ? questions : state.questions,
      index: 0,
      ...resetQuestion(),
      answers: [],
      startedAt: Date.now(),
      elapsedMs: 0,
      screen: "quiz",
    });
  },
  retrySame: () => get().startQuiz(),
  setAtlas: (atlasId) => set({ atlasId, screen: "atlas" }),
  resetStats: () => {
    resetProgress();
    set({ progress: { stats: {}, bestScore: 0, quizzes: 0 } });
  },
}));

export function scoreFromAnswers(answers: { correct: boolean }[]) {
  const correct = answers.filter((a) => a.correct).length;
  return {
    correct,
    total: answers.length,
    percent: answers.length ? Math.round((correct / answers.length) * 100) : 0,
  };
}
