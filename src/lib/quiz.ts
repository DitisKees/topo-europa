import {
  COUNTRIES,
  COUNTRY_BY_ID,
  countriesInScope,
  type Country,
  type ScopeId,
} from "@/data/countries";

export type QuizMode = "click-country" | "name-capital" | "click-capital" | "mix";
export type InputMode = "choice" | "type";
export type QuizLength = 10 | 20 | "all";

export type QuestionKind = "click-country" | "name-capital" | "click-capital";

export type Question = {
  kind: QuestionKind;
  countryId: string;
  prompt: string;
  choices?: string[];
};

export const MODES: { id: QuizMode; label: string; blurb: string }[] = [
  {
    id: "click-country",
    label: "Landen op de kaart",
    blurb: "Klik het gevraagde land",
  },
  {
    id: "name-capital",
    label: "Hoofdsteden",
    blurb: "Noem de hoofdstad bij het land",
  },
  {
    id: "click-capital",
    label: "Hoofdsteden op de kaart",
    blurb: "Klik de juiste hoofdstad",
  },
  {
    id: "mix",
    label: "Mix",
    blurb: "Landen en hoofdsteden door elkaar",
  },
];

function shuffle<T>(list: T[]): T[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j] as T;
    copy[j] = tmp as T;
  }
  return copy;
}

function pickKind(mode: QuizMode): QuestionKind {
  if (mode !== "mix") return mode;
  const roll = Math.random();
  if (roll < 0.45) return "click-country";
  if (roll < 0.8) return "name-capital";
  return "click-capital";
}

function capitalChoices(country: Country, pool: Country[]): string[] {
  const others = shuffle(
    pool.filter((c) => c.id !== country.id && c.capital !== country.capital),
  );
  const sameRegion = others.filter((c) => c.region === country.region);
  const distractors = [
    ...sameRegion.slice(0, 2),
    ...others.filter((c) => c.region !== country.region),
  ]
    .slice(0, 3)
    .map((c) => c.capital);
  return shuffle([country.capital, ...distractors]);
}

export function buildQuestions(opts: {
  mode: QuizMode;
  scope: ScopeId;
  length: QuizLength;
  inputMode: InputMode;
  weakIds?: string[];
}): Question[] {
  const pool = countriesInScope(opts.scope, opts.weakIds);
  if (pool.length === 0) return [];
  const ordered = shuffle(pool);
  const take =
    opts.length === "all" ? ordered : ordered.slice(0, Math.min(opts.length, ordered.length));

  return take.map((country) => {
    const kind = pickKind(opts.mode);
    if (kind === "click-country") {
      const article = country.article ? `${country.article} ` : "";
      return {
        kind,
        countryId: country.id,
        prompt: `Klik op ${article}${country.name}`,
      };
    }
    if (kind === "click-capital") {
      return {
        kind,
        countryId: country.id,
        prompt: `Klik op de hoofdstad van ${country.article ? `${country.article} ` : ""}${country.name}`,
      };
    }
    return {
      kind: "name-capital",
      countryId: country.id,
      prompt: `Wat is de hoofdstad van ${country.article ? `${country.article} ` : ""}${country.name}?`,
      choices: opts.inputMode === "choice" ? capitalChoices(country, pool) : undefined,
    };
  });
}

export function countryById(id: string): Country {
  const found = COUNTRY_BY_ID[id];
  if (!found) {
    return COUNTRIES[0] as Country;
  }
  return found;
}
