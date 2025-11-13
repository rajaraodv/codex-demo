import MoodBoard from "@/components/mood-board";
import { listMoods } from "@/lib/moods";
import type { MoodEntry } from "@/lib/moods";

export const dynamic = "force-dynamic";

export default async function Home() {
  let initialMoods: MoodEntry[] = [];
  let dbError: string | null = null;

  try {
    initialMoods = await listMoods();
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Database connection not configured";
    dbError = `${message}. Set DATABASE_URL to load entries.`;
  }

  const mostRecent = initialMoods[0];

  return (
    <main className="min-h-dvh bg-gradient-to-b from-indigo-50 via-white to-white">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-0">
        <header className="mb-12 flex flex-col gap-6 rounded-3xl border border-indigo-100 bg-white/80 p-8 shadow-sm backdrop-blur">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
              Mood tracker
            </p>
            <h1 className="mt-3 text-4xl font-semibold text-zinc-900 sm:text-5xl">
              Capture the highs, lows, and everything in between.
            </h1>
            <p className="mt-4 text-lg text-zinc-600">
              Log a quick emoji, mood, and note for each day. Over time you will
              see which habits and events move your energy up or down.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex-1 rounded-3xl border border-zinc-100 bg-zinc-50/70 p-4">
              <p className="text-xs uppercase tracking-widest text-zinc-500">
                Saved entries
              </p>
              <p className="mt-2 text-3xl font-semibold text-zinc-900">
                {initialMoods.length}
              </p>
            </div>
            <div className="flex-1 rounded-3xl border border-zinc-100 bg-zinc-50/70 p-4">
              <p className="text-xs uppercase tracking-widest text-zinc-500">
                Last logged mood
              </p>
              <p className="mt-2 text-3xl font-semibold text-zinc-900">
                {mostRecent ? `${mostRecent.emoji} ${mostRecent.mood}` : "—"}
              </p>
            </div>
          </div>
        </header>

        <MoodBoard initialMoods={initialMoods} dbError={dbError} />
      </div>
    </main>
  );
}
