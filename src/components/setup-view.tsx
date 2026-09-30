import type { ReactNode } from "react";
import { SCOPES } from "@/data/countries";
import { MODES, type InputMode, type QuizLength } from "@/lib/quiz";
import { Button } from "@/components/ui/button";
import { Shell } from "@/components/shell";
import { cn } from "@/lib/utils";
import { useApp } from "@/store/app";

const LENGTHS: { id: QuizLength; label: string }[] = [
  { id: 10, label: "10 vragen" },
  { id: 20, label: "20 vragen" },
  { id: "all", label: "Alles" },
];

const INPUTS: { id: InputMode; label: string; blurb: string }[] = [
  { id: "choice", label: "Meerkeuze", blurb: "Kies uit vier hoofdsteden" },
  { id: "type", label: "Zelf typen", blurb: "Schrijf de hoofdstad" },
];

export function SetupView() {
  const mode = useApp((s) => s.mode);
  const scope = useApp((s) => s.scope);
  const length = useApp((s) => s.length);
  const inputMode = useApp((s) => s.inputMode);
  const setSetup = useApp((s) => s.setSetup);
  const startQuiz = useApp((s) => s.startQuiz);
  const weakCount = useApp(
    (s) =>
      Object.values(s.progress.stats).filter((st) => st.seen && st.correct / st.seen < 0.8)
        .length,
  );

  const showInput = mode === "name-capital" || mode === "mix";

  return (
    <Shell back="home" title="Nieuwe ronde">
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 pb-28 sm:px-6">
        <Field label="Onderdeel">
          <div className="grid gap-2 sm:grid-cols-2">
            {MODES.map((item) => (
              <Choice
                key={item.id}
                active={mode === item.id}
                title={item.label}
                text={item.blurb}
                onClick={() => setSetup({ mode: item.id })}
              />
            ))}
          </div>
        </Field>

        <Field label="Gebied">
          <div className="flex flex-wrap gap-2">
            {SCOPES.map((item) => {
              if (item.id === "weak" && weakCount === 0) return null;
              return (
                <Chip
                  key={item.id}
                  active={scope === item.id}
                  onClick={() => setSetup({ scope: item.id })}
                >
                  {item.label}
                  {item.id === "weak" ? ` (${weakCount})` : ""}
                </Chip>
              );
            })}
          </div>
        </Field>

        <Field label="Lengte">
          <div className="flex flex-wrap gap-2">
            {LENGTHS.map((item) => (
              <Chip
                key={String(item.id)}
                active={length === item.id}
                onClick={() => setSetup({ length: item.id })}
              >
                {item.label}
              </Chip>
            ))}
          </div>
        </Field>

        {showInput && (
          <Field label="Antwoorden">
            <div className="grid gap-2 sm:grid-cols-2">
              {INPUTS.map((item) => (
                <Choice
                  key={item.id}
                  active={inputMode === item.id}
                  title={item.label}
                  text={item.blurb}
                  onClick={() => setSetup({ inputMode: item.id })}
                />
              ))}
            </div>
          </Field>
        )}
      </main>

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-bg/95 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl">
          <Button className="w-full" size="lg" onClick={() => startQuiz()}>
            Start
          </Button>
        </div>
      </div>
    </Shell>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-medium tracking-wide text-muted uppercase">{label}</h2>
      {children}
    </section>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-11 rounded-full px-4 text-sm font-medium shadow-[var(--shadow-border)]",
        active ? "bg-primary text-primary-fg" : "bg-bg-elevated text-fg hover:shadow-[var(--shadow-border-hover)]",
      )}
    >
      {children}
    </button>
  );
}

function Choice({
  active,
  title,
  text,
  onClick,
}: {
  active: boolean;
  title: string;
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-[var(--radius-lg)] p-4 text-left shadow-[var(--shadow-border)]",
        active ? "bg-primary text-primary-fg" : "bg-bg-elevated hover:shadow-[var(--shadow-border-hover)]",
      )}
    >
      <p className="font-medium">{title}</p>
      <p className={cn("mt-0.5 text-sm", active ? "text-primary-fg/80" : "text-muted")}>{text}</p>
    </button>
  );
}
