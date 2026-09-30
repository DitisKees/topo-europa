import { useEffect } from "react";
import { Check, X } from "lucide-react";
import { EuropeMap } from "@/components/europe-map";
import { Button } from "@/components/ui/button";
import { countryById } from "@/lib/quiz";
import { cn } from "@/lib/utils";
import { useApp } from "@/store/app";

export function QuizView() {
  const questions = useApp((s) => s.questions);
  const index = useApp((s) => s.index);
  const verdict = useApp((s) => s.verdict);
  const selectedId = useApp((s) => s.selectedId);
  const pickedLabel = useApp((s) => s.pickedLabel);
  const typedValue = useApp((s) => s.typedValue);
  const answers = useApp((s) => s.answers);
  const choose = useApp((s) => s.choose);
  const submitChoice = useApp((s) => s.submitChoice);
  const next = useApp((s) => s.next);
  const setTyped = useApp((s) => s.setTyped);
  const submitTyped = useApp((s) => s.submitTyped);
  const go = useApp((s) => s.go);

  const question = questions[index];

  useEffect(() => {
    if (verdict === "idle") return;
    const wait = verdict === "correct" ? 1500 : 2400;
    const id = window.setTimeout(() => next(), wait);
    return () => window.clearTimeout(id);
  }, [verdict, index, next]);

  if (!question) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg">
        <Button onClick={() => go("setup")}>Geen vragen — kies opnieuw</Button>
      </div>
    );
  }

  const target = countryById(question.countryId);
  const showCapitals = question.kind === "click-capital" || verdict !== "idle";
  const capitalInteractive = question.kind === "click-capital" && verdict === "idle";
  const mapInteractive = question.kind === "click-country" && verdict === "idle";

  const countryState = (id: string) => {
    if (verdict === "idle") {
      if (question.kind === "name-capital" && id === question.countryId) return "selected" as const;
      return "idle" as const;
    }
    if (id === question.countryId) return "correct" as const;
    if (selectedId && id === selectedId && selectedId !== question.countryId) return "wrong" as const;
    return "dim" as const;
  };

  const correctSoFar = answers.filter((a) => a.correct).length;
  const answered = verdict === "idle" ? 0 : 1;
  const progressPct = ((index + answered) / questions.length) * 100;

  return (
    <div className="flex min-h-dvh flex-col bg-bg lg:flex-row">
      <div className="relative min-h-[46dvh] flex-1 lg:min-h-dvh">
        <EuropeMap
          interactive={mapInteractive || capitalInteractive}
          showCapitals={showCapitals}
          capitalInteractive={capitalInteractive}
          countryState={countryState}
          onCountry={(id) => {
            if (question.kind === "click-country") choose(id);
          }}
          onCapital={(id) => {
            if (question.kind === "click-capital") choose(id);
          }}
          showTooltip={false}
        />
        <div className="absolute inset-x-0 top-0 h-1 bg-surface">
          <div
            className="h-full bg-primary transition-[width] duration-[var(--motion-fast)] ease-[var(--ease-out)]"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <aside className="flex w-full flex-col gap-4 border-t border-border bg-bg-elevated px-4 py-4 lg:h-dvh lg:w-[380px] lg:border-t-0 lg:border-l lg:px-6 lg:py-6">
        <div className="flex items-center justify-between text-sm text-muted tabular-nums">
          <span>
            {index + 1} / {questions.length}
          </span>
          <span>{correctSoFar} goed</span>
        </div>

        <div>
          <p className="font-display text-2xl leading-tight font-medium tracking-tight">
            {question.prompt}
          </p>
          {question.kind === "click-country" && verdict === "idle" && (
            <p className="mt-2 text-sm text-muted">Tik het land op de kaart. Sleep om te verschuiven, knijp of scroll om te zoomen.</p>
          )}
          {question.kind === "click-capital" && verdict === "idle" && (
            <p className="mt-2 text-sm text-muted">Tik de stip van de hoofdstad.</p>
          )}
        </div>

        {question.kind === "name-capital" && question.choices && (
          <div className="grid gap-2">
            {question.choices.map((choice) => {
              const isAnswer = choice === target.capital;
              const isPicked = pickedLabel === choice;
              return (
                <button
                  key={choice}
                  type="button"
                  disabled={verdict !== "idle"}
                  onClick={() => submitChoice(choice)}
                  className={cn(
                    "min-h-12 rounded-[var(--radius-md)] px-4 py-3 text-left text-sm font-medium shadow-[var(--shadow-border)]",
                    verdict === "idle" && "bg-bg hover:shadow-[var(--shadow-border-hover)]",
                    verdict !== "idle" && isAnswer && "bg-correct-soft text-correct",
                    verdict !== "idle" && isPicked && !isAnswer && "bg-wrong-soft text-wrong",
                    verdict !== "idle" && !isAnswer && !isPicked && "opacity-45",
                  )}
                >
                  {choice}
                </button>
              );
            })}
          </div>
        )}

        {question.kind === "name-capital" && !question.choices && (
          <form
            className="flex flex-col gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              submitTyped();
            }}
          >
            <label className="sr-only" htmlFor="capital-input">
              Hoofdstad
            </label>
            <input
              id="capital-input"
              value={typedValue}
              onChange={(e) => setTyped(e.target.value)}
              disabled={verdict !== "idle"}
              autoComplete="off"
              autoCapitalize="words"
              placeholder="Hoofdstad"
              className="h-12 rounded-[var(--radius-md)] bg-bg px-4 text-base shadow-[var(--shadow-border)] outline-none focus:outline-2 focus:outline-offset-2 focus:outline-primary"
            />
            <Button type="submit" disabled={verdict !== "idle" || !typedValue.trim()}>
              Controleren
            </Button>
          </form>
        )}

        {verdict !== "idle" && (
          <div
            className={cn(
              "flex items-start gap-3 rounded-[var(--radius-lg)] p-4",
              verdict === "correct" ? "bg-correct-soft text-correct" : "bg-wrong-soft text-wrong",
            )}
          >
            {verdict === "correct" ? (
              <Check className="mt-0.5 size-5 shrink-0" />
            ) : (
              <X className="mt-0.5 size-5 shrink-0" />
            )}
            <div>
              <p className="font-medium">{verdict === "correct" ? "Goed" : "Het juiste antwoord"}</p>
              <p className="text-sm opacity-90">
                {target.name}: {target.capital}
              </p>
            </div>
          </div>
        )}

        <div className="mt-auto flex gap-2 pt-2">
          <Button variant="ghost" className="flex-1" onClick={() => go("home")}>
            Stoppen
          </Button>
          {verdict !== "idle" && (
            <Button className="flex-1" onClick={next}>
              {index + 1 >= questions.length ? "Resultaat" : "Volgende"}
            </Button>
          )}
        </div>
      </aside>
    </div>
  );
}
