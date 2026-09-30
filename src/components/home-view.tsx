import { ArrowRight, Landmark, MapPinned, Shuffle } from "lucide-react";
import { EuropeMap } from "@/components/europe-map";
import { NavPills, Shell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import type { QuizMode } from "@/lib/quiz";
import { useApp } from "@/store/app";

const CARDS: {
  mode: QuizMode;
  title: string;
  text: string;
  icon: typeof MapPinned;
}[] = [
  {
    mode: "click-country",
    title: "Landen",
    text: "Klik het gevraagde land op de kaart.",
    icon: MapPinned,
  },
  {
    mode: "name-capital",
    title: "Hoofdsteden",
    text: "Welke hoofdstad hoort bij dit land?",
    icon: Landmark,
  },
  {
    mode: "mix",
    title: "Mix",
    text: "Landen en hoofdsteden door elkaar.",
    icon: Shuffle,
  },
];

export function HomeView() {
  const go = useApp((s) => s.go);
  const startQuiz = useApp((s) => s.startQuiz);
  const setSetup = useApp((s) => s.setSetup);
  const quizzes = useApp((s) => s.progress.quizzes);
  const best = useApp((s) => s.progress.bestScore);

  return (
    <Shell
      action={<NavPills />}
    >
      <main className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 pb-16 sm:px-6">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] overflow-hidden opacity-50">
          <EuropeMap decorative interactive={false} className="h-full scale-110" />
        </div>

        <section className="mt-6 max-w-xl">
          <p className="text-sm font-medium tracking-wide text-primary uppercase">
            Topografie
          </p>
          <h1 className="mt-2 font-display text-4xl leading-[1.1] font-medium tracking-[-0.03em] sm:text-5xl">
            Europa, tot je de kaart kent.
          </h1>
          <p className="mt-4 max-w-md text-muted">
            Oefen landen en hoofdsteden op een echte kaart. Kies een regio,
            speel een ronde, en zie waar je nog winst kunt halen.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button
              size="lg"
              onClick={() => {
                setSetup({ mode: "click-country", scope: "all", length: 10 });
                go("setup");
              }}
            >
              Start oefening
              <ArrowRight className="size-4" />
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => startQuiz({ mode: "click-country", scope: "benelux", length: 10 })}
            >
              Eerst Benelux
            </Button>
          </div>
          {(quizzes > 0 || best > 0) && (
            <p className="mt-4 text-sm text-subtle tabular-nums">
              {quizzes} {quizzes === 1 ? "ronde" : "rondes"} · beste score {best}%
            </p>
          )}
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          {CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.mode}
                type="button"
                onClick={() => {
                  setSetup({ mode: card.mode });
                  go("setup");
                }}
                className="group rounded-[var(--radius-xl)] bg-bg-elevated p-5 text-left shadow-[var(--shadow-border)] transition-[box-shadow,transform] duration-[var(--motion-fast)] ease-[var(--ease-out)] hover:shadow-[var(--shadow-border-hover)]"
              >
                <span className="flex size-10 items-center justify-center rounded-[var(--radius-md)] bg-surface text-primary">
                  <Icon className="size-5" strokeWidth={1.75} />
                </span>
                <h2 className="mt-4 font-display text-xl font-medium tracking-tight">
                  {card.title}
                </h2>
                <p className="mt-1 text-sm text-muted">{card.text}</p>
                <p className="mt-4 text-sm font-medium text-primary">
                  Kies instellingen
                </p>
              </button>
            );
          })}
        </section>
      </main>
    </Shell>
  );
}
