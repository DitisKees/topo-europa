import { ArrowLeft, BookOpen, Compass, Map } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useApp, type Screen } from "@/store/app";

export function Shell({
  children,
  back,
  title,
  action,
}: {
  children: ReactNode;
  back?: Screen;
  title?: string;
  action?: ReactNode;
}) {
  const go = useApp((s) => s.go);
  return (
    <div className="flex min-h-dvh flex-col bg-bg text-fg">
      <header className="flex h-14 items-center gap-2 px-3 sm:px-5">
        {back ? (
          <Button
            variant="ghost"
            size="icon"
            className="size-10"
            aria-label="Terug"
            onClick={() => go(back)}
          >
            <ArrowLeft className="size-5" />
          </Button>
        ) : (
          <span className="flex size-10 items-center justify-center text-primary">
            <Compass className="size-5" strokeWidth={1.75} />
          </span>
        )}
        <p className="font-display text-lg font-medium tracking-tight">
          {title ?? "Topo Europa"}
        </p>
        <div className="ml-auto flex items-center gap-1">{action}</div>
      </header>
      {children}
    </div>
  );
}

export function NavPills() {
  const go = useApp((s) => s.go);
  const screen = useApp((s) => s.screen);
  const items: { id: Screen; label: string; icon: typeof Map }[] = [
    { id: "home", label: "Oefenen", icon: Map },
    { id: "atlas", label: "Atlas", icon: Compass },
    { id: "progress", label: "Voortgang", icon: BookOpen },
  ];
  return (
    <nav className="flex gap-1 rounded-[var(--radius-lg)] bg-surface p-1">
      {items.map((item) => {
        const Icon = item.icon;
        const active = screen === item.id || (item.id === "home" && screen === "setup");
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => go(item.id)}
            className={cn(
              "flex h-10 items-center gap-2 rounded-[var(--radius-md)] px-3 text-sm font-medium",
              active ? "bg-bg-elevated text-fg shadow-[var(--shadow-border)]" : "text-muted hover:text-fg",
            )}
          >
            <Icon className="size-4" strokeWidth={1.75} />
            <span className="hidden sm:inline">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
