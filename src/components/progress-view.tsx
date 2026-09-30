import { COUNTRIES } from "@/data/countries";
import { accuracy } from "@/lib/progress";
import { Button } from "@/components/ui/button";
import { NavPills, Shell } from "@/components/shell";
import { useApp } from "@/store/app";

export function ProgressView() {
  const progress = useApp((s) => s.progress);
  const resetStats = useApp((s) => s.resetStats);
  const startQuiz = useApp((s) => s.startQuiz);
  const rows = COUNTRIES.map((country) => {
    const stat = progress.stats[country.id];
    return {
      country,
      stat,
      acc: accuracy(stat),
      seen: stat?.seen ?? 0,
    };
  }).sort((a, b) => {
    if (a.seen === 0 && b.seen === 0) return a.country.name.localeCompare(b.country.name, "nl");
    if (a.seen === 0) return 1;
    if (b.seen === 0) return -1;
    return a.acc - b.acc;
  });

  const practiced = rows.filter((r) => r.seen > 0);
  const mastered = practiced.filter((r) => r.acc >= 0.8).length;

  return (
    <Shell title="Voortgang" action={<NavPills />}>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 pb-16 sm:px-6">
        <section className="grid grid-cols-3 gap-2">
          <Stat label="Rondes" value={String(progress.quizzes)} />
          <Stat label="Beste" value={`${progress.bestScore}%`} />
          <Stat label="Bekend" value={`${mastered}/${COUNTRIES.length}`} />
        </section>

        {practiced.length === 0 ? (
          <p className="text-muted">Speel een ronde om hier je landen te zien.</p>
        ) : (
          <ul className="overflow-hidden rounded-[var(--radius-lg)] bg-bg-elevated shadow-[var(--shadow-border)]">
            {rows
              .filter((r) => r.seen > 0)
              .map((row) => (
                <li
                  key={row.country.id}
                  className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0"
                >
                  <span className="flex-1 font-medium">{row.country.name}</span>
                  <span className="w-24 text-right text-sm text-muted tabular-nums">
                    {row.stat?.correct}/{row.seen}
                  </span>
                  <span className="w-14 text-right text-sm tabular-nums">
                    {Math.round(row.acc * 100)}%
                  </span>
                </li>
              ))}
          </ul>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            onClick={() => startQuiz({ mode: "mix", scope: practiced.length ? "weak" : "all", length: 10 })}
          >
            Oefen zwakke punten
          </Button>
          <Button variant="ghost" onClick={resetStats}>
            Wis voortgang
          </Button>
        </div>
      </main>
    </Shell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-lg)] bg-bg-elevated px-3 py-4 shadow-[var(--shadow-border)]">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl font-medium tabular-nums">{value}</p>
    </div>
  );
}
