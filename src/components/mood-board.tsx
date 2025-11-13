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
    <div className="flex flex-col gap-10">
      <div className="rounded-3xl border border-zinc-200 bg-white/60 p-6 shadow-sm backdrop-blur-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-zinc-900">
              How are you feeling?
            </h2>
            <p className="text-sm text-zinc-500">
              Log your mood to spot trends over time.
            </p>
          </div>
          <span className="text-3xl" role="img" aria-hidden="true">
            {form.emoji}
          </span>
        </div>

        {dbError && (
          <p className="mb-4 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900">
            {dbError}
          </p>
        )}

        {status && (
          <p
            className={`mb-4 rounded-2xl px-4 py-3 text-sm ${
              status.type === "success"
                ? "border border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border border-rose-200 bg-rose-50 text-rose-900"
            }`}
          >
            {status.message}
          </p>
        )}

        <form
          className="grid gap-4 md:grid-cols-[120px_1fr]"
          onSubmit={handleSubmit}
        >
          <div className="flex gap-2 overflow-x-auto rounded-2xl border border-zinc-200 p-2">
            {emojiChoices.map((emoji) => (
              <button
                type="button"
                key={emoji}
                className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl transition ${
                  form.emoji === emoji
                    ? "bg-indigo-600/10 text-indigo-600"
                    : "hover:bg-zinc-100"
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
              <label className="text-sm font-medium text-zinc-600">
                Mood
                <input
                  className="mt-1 w-full rounded-2xl border border-zinc-200 px-3 py-2 text-base text-zinc-900 focus:border-indigo-500 focus:outline-none"
                  placeholder="Happy, tired, grateful..."
                  value={form.mood}
                  onChange={(event) => updateField("mood", event.target.value)}
                  disabled={Boolean(dbError) || isSubmitting}
                  required
                />
              </label>
              <label className="text-sm font-medium text-zinc-600">
                Date
                <input
                  type="date"
                  className="mt-1 w-full rounded-2xl border border-zinc-200 px-3 py-2 text-base text-zinc-900 focus:border-indigo-500 focus:outline-none"
                  value={form.entryDate}
                  onChange={(event) => updateField("entryDate", event.target.value)}
                  disabled={Boolean(dbError) || isSubmitting}
                  required
                />
              </label>
            </div>
            <label className="text-sm font-medium text-zinc-600">
              Label
              <input
                className="mt-1 w-full rounded-2xl border border-zinc-200 px-3 py-2 text-base text-zinc-900 focus:border-indigo-500 focus:outline-none"
                placeholder="What happened?"
                value={form.label}
                onChange={(event) => updateField("label", event.target.value)}
                disabled={Boolean(dbError) || isSubmitting}
              />
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-zinc-300"
                disabled={Boolean(dbError) || isSubmitting}
              >
                {isSubmitting ? "Saving..." : actionLabel}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="rounded-2xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50"
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

      <div className="rounded-3xl border border-zinc-200 bg-white/50 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-zinc-900">
              Recent entries
            </h3>
            <p className="text-sm text-zinc-500">
              Tap an entry to edit it or remove ones you no longer need.
            </p>
          </div>
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
            {sortedMoods.length} saved
          </span>
        </div>

        {sortedMoods.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-zinc-500">
            No entries yet. Start logging your day!
          </p>
        ) : (
          <ul className="mt-6 divide-y divide-zinc-100">
            {sortedMoods.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:gap-8"
              >
                <button
                  type="button"
                  className="flex flex-1 items-center gap-4 text-left"
                  onClick={() => handleEdit(entry)}
                  disabled={Boolean(dbError)}
                >
                  <span className="text-3xl" role="img" aria-hidden>
                    {entry.emoji}
                  </span>
                  <div>
                    <p className="text-base font-semibold text-zinc-900">
                      {entry.mood}
                    </p>
                    <p className="text-sm text-zinc-500">{entry.label}</p>
                  </div>
                </button>
                <div className="flex flex-col items-start gap-2 text-sm text-zinc-500 sm:items-end sm:text-right">
                  <span>{formatDate(entry.entryDate)}</span>
                  <button
                    type="button"
                    className="text-rose-600 hover:text-rose-500"
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
    </div>
  );
}
