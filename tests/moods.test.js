const path = require("node:path");
const assert = require("node:assert/strict");
const { describe, it, beforeEach } = require("node:test");

const moodsModulePath = path.resolve(__dirname, "../.test-dist/src/lib/moods.js");
const dbModulePath = path.resolve(__dirname, "../.test-dist/src/lib/db.js");

function createFakeDb() {
  /** @type {Array<{id: string, emoji: string, mood: string, label: string, entry_date: string, created_at: Date}>} */
  const rows = [];
  let createdAtCounter = 0;

  const runQuery = async (text, params = []) => {
    const normalized = text.replace(/\s+/g, " ").trim();

    if (normalized.startsWith("CREATE TABLE")) {
      return { rows: [], rowCount: 0 };
    }

    if (normalized.startsWith("SELECT id, emoji")) {
      const sorted = [...rows].sort((a, b) => {
        if (a.entry_date === b.entry_date) {
          return b.created_at.getTime() - a.created_at.getTime();
        }
        return a.entry_date < b.entry_date ? 1 : -1;
      });
      return { rows: sorted.map((row) => ({ ...row })) };
    }

    if (normalized.startsWith("INSERT INTO mood_entries")) {
      const [id, emoji, mood, label, entryDate] = params;
      const createdAt = new Date(Date.UTC(2020, 0, createdAtCounter + 1));
      createdAtCounter += 1;
      const row = {
        id,
        emoji,
        mood,
        label,
        entry_date: entryDate,
        created_at: createdAt,
      };
      rows.push(row);
      return { rows: [row], rowCount: 1 };
    }

    if (normalized.startsWith("UPDATE mood_entries")) {
      const [id, ...values] = params;
      const row = rows.find((entry) => entry.id === id);
      if (!row) {
        return { rows: [], rowCount: 0 };
      }

      const setMatch = normalized.match(/SET (.+) WHERE/);
      if (!setMatch) {
        throw new Error(`Unexpected UPDATE query: ${normalized}`);
      }

      const assignments = setMatch[1].split(",").map((part) => part.trim());
      assignments.forEach((assignment, index) => {
        const [column] = assignment.split(" = ");
        const value = values[index];
        if (column === "entry_date") {
          row.entry_date = value;
        } else if (column in row) {
          row[column] = value;
        }
      });

      return { rows: [row], rowCount: 1 };
    }

    if (normalized.startsWith("DELETE FROM mood_entries")) {
      const [id] = params;
      const index = rows.findIndex((entry) => entry.id === id);
      if (index === -1) {
        return { rows: [], rowCount: 0 };
      }

      rows.splice(index, 1);
      return { rows: [], rowCount: 1 };
    }

    throw new Error(`Unsupported query: ${normalized}`);
  };

  return { runQuery };
}

function loadMoodsModule(fakeDb) {
  delete require.cache[dbModulePath];
  require.cache[dbModulePath] = {
    id: dbModulePath,
    filename: dbModulePath,
    loaded: true,
    exports: {
      runQuery: fakeDb.runQuery,
    },
  };

  delete require.cache[moodsModulePath];
  return require(moodsModulePath);
}

describe("mood database operations", () => {
  beforeEach(() => {
    delete require.cache[dbModulePath];
    delete require.cache[moodsModulePath];
  });

  it("creates a mood entry with defaults", async () => {
    const fakeDb = createFakeDb();
    const { createMood } = loadMoodsModule(fakeDb);

    const result = await createMood({
      emoji: "😀",
      mood: "Happy",
      entryDate: "2024-01-01",
    });

    assert.equal(result.emoji, "😀");
    assert.equal(result.mood, "Happy");
    assert.equal(result.label, "");
    assert.equal(result.entryDate, "2024-01-01");
    assert.match(result.createdAt, /^\d{4}-\d{2}-\d{2}T/);
  });

  it("lists moods in descending order", async () => {
    const fakeDb = createFakeDb();
    const { createMood, listMoods } = loadMoodsModule(fakeDb);

    await createMood({
      emoji: "😀",
      mood: "Happy",
      entryDate: "2024-01-02",
    });

    await createMood({
      emoji: "😌",
      mood: "Calm",
      entryDate: "2024-01-01",
    });

    const moods = await listMoods();
    assert.equal(moods.length, 2);
    assert.equal(moods[0].entryDate, "2024-01-02");
    assert.equal(moods[1].entryDate, "2024-01-01");
  });

  it("updates an existing mood entry", async () => {
    const fakeDb = createFakeDb();
    const { createMood, updateMood } = loadMoodsModule(fakeDb);

    const created = await createMood({
      emoji: "😌",
      mood: "Calm",
      entryDate: "2024-01-03",
    });

    const updated = await updateMood(created.id, {
      mood: "Excited",
      label: "Feeling great",
    });

    assert.equal(updated.id, created.id);
    assert.equal(updated.emoji, "😌");
    assert.equal(updated.mood, "Excited");
    assert.equal(updated.label, "Feeling great");
    assert.equal(updated.entryDate, "2024-01-03");
  });

  it("deletes a mood entry and reports missing entries", async () => {
    const fakeDb = createFakeDb();
    const { createMood, deleteMood, listMoods } = loadMoodsModule(fakeDb);

    const created = await createMood({
      emoji: "😴",
      mood: "Sleepy",
      entryDate: "2024-01-04",
    });

    await deleteMood(created.id);

    const afterDelete = await listMoods();
    assert.equal(afterDelete.length, 0);

    await assert.rejects(() => deleteMood(created.id), /Entry not found/);
  });
});
