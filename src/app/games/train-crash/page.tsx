import type { Metadata } from "next";
import TrainCrashGame from "@/components/games/train-crash-game";

export const metadata: Metadata = {
  title: "🚂 Train Crash Game — Nanu's World",
  description: "Watch unlimited trains zoom on tracks, derail, and crash into each other! A fun interactive game for kids.",
};

export default function TrainCrashPage() {
  return (
    <main className="min-h-screen px-4 py-8 md:py-12">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-3">
          <div className="text-5xl">🚂💥🚃</div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight fun-gradient">
            Train Crash!
          </h1>
          <p className="text-lg text-purple-500 max-w-xl mx-auto">
            Watch trains zoom around the tracks, derail, and crash into each other! 
            Click anywhere to add more trains! 🎉
          </p>
        </div>
        <TrainCrashGame />
      </div>
    </main>
  );
}
