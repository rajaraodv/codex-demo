import { randomUUID } from "crypto";
import { z } from "zod";
import { runQuery } from "./db";

export type MoodEntry = {
  id: string;
  emoji: string;
  mood: string;
  label: string;
  entryDate: string;
  createdAt: string;
};

const baseSchema = z.object({
  emoji: z.string().min(1).max(4),
  mood: z.string().min(1).max(80),
  label: z.string().max(160).optional(),
  entryDate: z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), "Invalid date"),
});

const createSchema = baseSchema.extend({
  label: baseSchema.shape.label.default(""),
});

const updateSchema = baseSchema.partial();

type CreateInput = z.infer<typeof createSchema>;
type UpdateInput = z.infer<typeof updateSchema>;
export type MoodInput = CreateInput;

let ensureTablePromise: Promise<unknown> | null = null;

async function ensureTable() {
  if (!ensureTablePromise) {
    ensureTablePromise = runQuery(`
      CREATE TABLE IF NOT EXISTS mood_entries (
        id UUID PRIMARY KEY,
        emoji TEXT NOT NULL,
        mood TEXT NOT NULL,
        label TEXT NOT NULL DEFAULT '',
        entry_date DATE NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `).catch((error) => {
      ensureTablePromise = null;
      throw error;
    });
  }

  return ensureTablePromise;
}

const mapRow = (row: any): MoodEntry => ({
  id: row.id,
  emoji: row.emoji,
  mood: row.mood,
  label: row.label,
  entryDate: row.entry_date instanceof Date
    ? row.entry_date.toISOString().slice(0, 10)
    : row.entry_date,
  createdAt:
    row.created_at instanceof Date
      ? row.created_at.toISOString()
      : row.created_at,
});

export async function listMoods() {
  await ensureTable();
  const { rows } = await runQuery(`
    SELECT id, emoji, mood, label, entry_date, created_at
    FROM mood_entries
    ORDER BY entry_date DESC, created_at DESC
  `);
  return rows.map(mapRow);
}

export async function createMood(input: Partial<CreateInput>) {
  await ensureTable();
  const payload = createSchema.parse(input);
  const id = randomUUID();

  const { rows } = await runQuery(
    `
      INSERT INTO mood_entries (id, emoji, mood, label, entry_date)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, emoji, mood, label, entry_date, created_at
    `,
    [id, payload.emoji, payload.mood, payload.label, payload.entryDate]
  );

  return mapRow(rows[0]);
}

export async function updateMood(id: string, input: Partial<UpdateInput>) {
  await ensureTable();
  const payload = updateSchema.parse(input);

  const updates = {
    emoji: payload.emoji,
    mood: payload.mood,
    label: payload.label,
    entryDate: payload.entryDate,
  };

  const fields = Object.entries(updates).filter(([, value]) => value !== undefined);

  if (!fields.length) {
    throw new Error("Nothing to update");
  }

  const setClauses = fields.map(([key], idx) => {
    const column = key === "entryDate" ? "entry_date" : key;
    return `${column} = $${idx + 2}`;
  });

  const values = fields.map(([, value]) => value);

  const { rows } = await runQuery(
    `
      UPDATE mood_entries
      SET ${setClauses.join(", ")}
      WHERE id = $1
      RETURNING id, emoji, mood, label, entry_date, created_at
    `,
    [id, ...values]
  );

  if (rows.length === 0) {
    throw new Error("Entry not found");
  }

  return mapRow(rows[0]);
}

export async function deleteMood(id: string) {
  await ensureTable();
  const result = await runQuery(`DELETE FROM mood_entries WHERE id = $1`, [id]);
  if (result.rowCount === 0) {
    throw new Error("Entry not found");
  }
}
