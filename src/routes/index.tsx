import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AtlasView } from "@/components/atlas-view";
import { HomeView } from "@/components/home-view";
import { ProgressView } from "@/components/progress-view";
import { QuizView } from "@/components/quiz-view";
import { ResultsView } from "@/components/results-view";
import { SetupView } from "@/components/setup-view";
import { loadProgress } from "@/lib/progress";
import { useApp } from "@/store/app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const screen = useApp((s) => s.screen);

  useEffect(() => {
    useApp.setState({ progress: loadProgress() });
  }, []);

  switch (screen) {
    case "setup":
      return <SetupView />;
    case "quiz":
      return <QuizView />;
    case "results":
      return <ResultsView />;
    case "atlas":
      return <AtlasView />;
    case "progress":
      return <ProgressView />;
    default:
      return <HomeView />;
  }
}
