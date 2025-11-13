"use client";

import { useMemo, useState } from "react";
import type { MoodEntry } from "@/lib/moods";

type Props = {
  initialMoods: MoodEntry[];
  dbError?: string | null;
};

type FormState = {
  emoji: string;
  mood: string;
  label: string;
  entryDate: string;
};

type StatusState = {
  type: "success" | "error";
  message: string;
} | null;

const emojiChoices = [
  "😄",
  "😊",
  "🙂",
  "😐",
  "😴",
  "😢",
  "😡",
  "🤯",
  "🤒",
  "🤩",
];

const buildDefaultForm = (): FormState => ({
  emoji: "😄",
  mood: "",
  label: "",
  entryDate: new Date().toISOString().slice(0, 10),
});

export default function MoodBoard({ initialMoods, dbError }: Props) {
  const [moods, setMoods] = useState(initialMoods);
  const [form, setForm] = useState<FormState>(() => buildDefaultForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusState>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sortedMoods = useMemo(
    () =>
      [...moods].sort((a, b) =>
        new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime()
      ),
    [moods]
  );

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(value));

  const updateField = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setForm(buildDefaultForm());
    setEditingId(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (dbError) return;

    setIsSubmitting(true);
    setStatus(null);

    const endpoint = editingId ? `/api/moods/${editingId}` : "/api/moods";
    const method = editingId ? "PUT" : "POST";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Something went wrong");
      }

      const updatedEntry: MoodEntry = payload.data;

      setMoods((prev) => {
        if (editingId) {
          return prev.map((item) =>
            item.id === editingId ? updatedEntry : item
          );
        }

        return [updatedEntry, ...prev];
      });

      resetForm();
      setStatus({
        type: "success",
        message: editingId ? "Entry updated" : "Entry added",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to save the entry";
      setStatus({ type: "error", message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (entry: MoodEntry) => {
    setEditingId(entry.id);
    setForm({
      emoji: entry.emoji,
      mood: entry.mood,
      label: entry.label,
      entryDate: entry.entryDate,
    });
  };

  const handleDelete = async (id: string) => {
    if (dbError) return;

    const shouldDelete = window.confirm("Delete this entry?");
    if (!shouldDelete) return;

    try {
      const response = await fetch(`/api/moods/${id}`, {
        method: "DELETE",
      });

      const payload = await response.json();

      if (!response.ok || payload.error) {
        throw new Error(payload.error ?? "Unable to delete the entry");
      }

      setMoods((prev) => prev.filter((item) => item.id !== id));
      if (editingId === id) {
        resetForm();
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to delete the entry";
      setStatus({ type: "error", message });
    }
  };

  const actionLabel = editingId ? "Update entry" : "Add entry";

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
      <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 text-white shadow-2xl backdrop-blur">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Quick log
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              How are you feeling today?
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Capture a tiny snapshot in seconds. Tap an entry to revisit or edit later.
            </p>
          </div>
          <span className="text-4xl" role="img" aria-hidden="true">
            {form.emoji}
          </span>
        </div>

        {dbError && (
          <p className="mb-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            {dbError}
          </p>
        )}

        {status && (
          <p
            className={`mb-4 rounded-2xl px-4 py-3 text-sm ${
              status.type === "success"
                ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
                : "border border-rose-500/30 bg-rose-500/10 text-rose-100"
            }`}
          >
            {status.message}
          </p>
        )}

        <form
          className="grid gap-4 md:grid-cols-[120px_1fr]"
          onSubmit={handleSubmit}
        >
          <div className="flex gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-white/5 p-2">
            {emojiChoices.map((emoji) => (
              <button
                type="button"
                key={emoji}
                className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl transition ${
                  form.emoji === emoji
                    ? "bg-white text-slate-900 shadow"
                    : "hover:bg-white/10"
                }`}
                onClick={() => updateField("emoji", emoji)}
                aria-label={`Use ${emoji} for this entry`}
                disabled={Boolean(dbError) || isSubmitting}
              >
                <span role="img" aria-hidden="true">
                  {emoji}
                </span>
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-200">
                Mood
                <input
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-base text-white placeholder:text-slate-400 focus:border-white focus:outline-none"
                  placeholder="Productive, cozy, restless..."
                  value={form.mood}
                  onChange={(event) => updateField("mood", event.target.value)}
                  disabled={Boolean(dbError) || isSubmitting}
                  required
                />
              </label>
              <label className="text-sm font-medium text-slate-200">
                Date
                <input
                  type="date"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-base text-white placeholder:text-slate-400 focus:border-white focus:outline-none"
                  value={form.entryDate}
                  onChange={(event) => updateField("entryDate", event.target.value)}
                  disabled={Boolean(dbError) || isSubmitting}
                  required
                />
              </label>
            </div>
            <label className="text-sm font-medium text-slate-200">
              Label
              <input
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-base text-white placeholder:text-slate-400 focus:border-white focus:outline-none"
                placeholder="Give the moment a short title"
                value={form.label}
                onChange={(event) => updateField("label", event.target.value)}
                disabled={Boolean(dbError) || isSubmitting}
              />
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="rounded-2xl bg-white px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-white/40"
                disabled={Boolean(dbError) || isSubmitting}
              >
                {isSubmitting ? "Saving..." : actionLabel}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="rounded-2xl border border-white/20 px-5 py-2 text-sm font-semibold text-white/80 transition hover:border-white/40"
                  onClick={resetForm}
                  disabled={isSubmitting}
                >
                  Cancel edit
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      <div className="rounded-[32px] border border-white/10 bg-slate-950/40 p-6 text-white shadow-2xl backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Timeline
            </p>
            <h3 className="mt-2 text-xl font-semibold text-white">
              Recent entries
            </h3>
            <p className="text-sm text-slate-400">
              Tap any row to edit. Remove the ones you are ready to let go of.
            </p>
          </div>
          <span className="rounded-full border border-white/20 px-4 py-1 text-xs font-medium text-white/70">
            {sortedMoods.length} saved
          </span>
        </div>

        {sortedMoods.length === 0 ? (
          <p className="mt-6 rounded-3xl border border-dashed border-white/20 px-4 py-10 text-center text-sm text-white/60">
            No entries logged yet. Your first check-in will appear here.
          </p>
        ) : (
          <ul className="mt-6 divide-y divide-white/5">
            {sortedMoods.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:gap-8"
              >
                <button
                  type="button"
                  className="group flex flex-1 items-center gap-4 text-left"
                  onClick={() => handleEdit(entry)}
                  disabled={Boolean(dbError)}
                >
                  <span
                    className="text-3xl transition group-hover:scale-110"
                    role="img"
                    aria-hidden="true"
                  >
                    {entry.emoji}
                  </span>
                  <div>
                    <p className="text-base font-semibold text-white">
                      {entry.mood}
                    </p>
                    <p className="text-sm text-slate-400">{entry.label || "No label added"}</p>
                  </div>
                </button>
                <div className="flex flex-col items-start gap-2 text-sm text-slate-400 sm:items-end sm:text-right">
                  <span>{formatDate(entry.entryDate)}</span>
                  <button
                    type="button"
                    className="text-rose-300 hover:text-rose-200"
                    onClick={() => handleDelete(entry.id)}
                    disabled={Boolean(dbError)}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
