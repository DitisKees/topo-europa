import { COUNTRY_BY_ID } from "@/data/countries";
import { Button } from "@/components/ui/button";
import { Shell } from "@/components/shell";
import { scoreFromAnswers, useApp } from "@/store/app";

function formatTime(ms: number) {
  const sec = Math.round(ms / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m <= 0) return `${s}s`;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export function ResultsView() {
  const answers = useApp((s) => s.answers);
  const elapsedMs = useApp((s) => s.elapsedMs);
  const retrySame = useApp((s) => s.retrySame);
  const retryMissed = useApp((s) => s.retryMissed);
  const go = useApp((s) => s.go);
  const { correct, total, percent } = scoreFromAnswers(answers);
  const missed = answers.filter((a) => !a.correct);

  const headline =
    percent === 100 ? "Foutloos." : percent >= 80 ? "Sterke ronde." : percent >= 50 ? "Op weg." : "Nog even oefenen.";

  return (
    <Shell back="home" title="Resultaat">
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-4 pb-16 sm:px-6">
        <section>
          <p className="font-display text-4xl font-medium tracking-tight">{headline}</p>
          <p className="mt-3 text-muted">
            <span className="tabular-nums text-fg">{correct}</span> van{" "}
            <span className="tabular-nums text-fg">{total}</span> goed
            {elapsedMs > 0 ? ` · ${formatTime(elapsedMs)}` : ""}
          </p>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-surface">
            <div
              className="h-full bg-primary"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-subtle tabular-nums">{percent}%</p>
        </section>

        {missed.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-medium tracking-wide text-muted uppercase">
              Nog oefenen
            </h2>
            <ul className="divide-y divide-border rounded-[var(--radius-lg)] bg-bg-elevated shadow-[var(--shadow-border)]">
              {missed.map((item, i) => {
                const country = COUNTRY_BY_ID[item.id];
                if (!country) return null;
                return (
                  <li key={`${item.id}-${i}`} className="flex items-baseline justify-between gap-3 px-4 py-3">
                    <span className="font-medium">{country.name}</span>
                    <span className="text-sm text-muted">{country.capital}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button className="flex-1" onClick={retrySame}>
            Opnieuw
          </Button>
          {missed.length > 0 && (
            <Button className="flex-1" variant="secondary" onClick={retryMissed}>
              Alleen fouten
            </Button>
          )}
          <Button className="flex-1" variant="ghost" onClick={() => go("setup")}>
            Andere ronde
          </Button>
        </div>
      </main>
    </Shell>
  );
}
