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
  const uniqueDaysTracked = new Set(
    initialMoods.map((entry) => entry.entryDate)
  ).size;

  return (
    <main className="min-h-dvh bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900 text-white">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <header className="mb-12 rounded-[36px] border border-white/10 bg-gradient-to-br from-slate-950/90 via-slate-900/50 to-indigo-900/40 p-10 shadow-[0_25px_120px_rgba(15,23,42,0.45)]">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-indigo-200">
                Daily mood journal
              </p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight text-white sm:text-5xl">
                A calmer, cleaner way to keep tabs on how you feel.
              </h1>
              <p className="mt-4 text-lg text-slate-200">
                Drop in a quick emoji, mood, and a short note in seconds. Over time a gentle timeline appears that highlights the habits that lift or drain your energy.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 backdrop-blur">
              <span
                className="inline-flex h-2 w-2 rounded-full bg-emerald-400"
                aria-hidden="true"
              />
              Logging feels effortless when everything lives in one tidy place.
            </div>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                Saved entries
              </p>
              <p className="mt-3 text-4xl font-semibold text-white">
                {initialMoods.length}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                Last logged mood
              </p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {mostRecent ? `${mostRecent.emoji} ${mostRecent.mood}` : "—"}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                Days tracked
              </p>
              <p className="mt-3 text-4xl font-semibold text-white">
                {uniqueDaysTracked}
              </p>
            </div>
          </div>
        </header>

        <MoodBoard initialMoods={initialMoods} dbError={dbError} />
      </div>
    </main>
  );
}
