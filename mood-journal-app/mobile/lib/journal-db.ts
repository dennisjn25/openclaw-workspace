import type { SQLiteDatabase } from 'expo-sqlite';

export type EntryRecord = {
  id: number;
  createdAt: string;
  moodLabel: string;
  moodScore: number;
  energyScore: number | null;
  stressScore: number | null;
  sleepHours: number | null;
  impulseScore: number | null;
  note: string;
  tags: string;
};

export const DATABASE_NAME = 'mood-journal.db';

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  const DATABASE_VERSION = 1;
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentDbVersion = result?.user_version ?? 0;

  if (currentDbVersion >= DATABASE_VERSION) {
    return;
  }

  if (currentDbVersion === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        createdAt TEXT NOT NULL,
        moodLabel TEXT NOT NULL,
        moodScore INTEGER NOT NULL,
        energyScore INTEGER,
        stressScore INTEGER,
        sleepHours REAL,
        impulseScore INTEGER,
        note TEXT NOT NULL,
        tags TEXT NOT NULL DEFAULT ''
      );
    `);

    await seedEntries(db);
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}

async function seedEntries(db: SQLiteDatabase) {
  const existing = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM entries');
  if ((existing?.count ?? 0) > 0) {
    return;
  }

  const seedRows = [
    {
      createdAt: '2026-04-09T16:00:00.000Z',
      moodLabel: 'Good',
      moodScore: 4,
      energyScore: 4,
      stressScore: 2,
      sleepHours: 7.5,
      impulseScore: 2,
      note: 'Momentum is back. The idea feels bigger now that the structure is cleaner.',
      tags: 'work,clarity',
    },
    {
      createdAt: '2026-04-08T16:00:00.000Z',
      moodLabel: 'Steady',
      moodScore: 3,
      energyScore: 3,
      stressScore: 3,
      sleepHours: 6.5,
      impulseScore: 3,
      note: 'Not bad, just scattered. I need less input and a cleaner next action.',
      tags: 'sleep,focus',
    },
    {
      createdAt: '2026-04-07T16:00:00.000Z',
      moodLabel: 'Strong',
      moodScore: 5,
      energyScore: 5,
      stressScore: 1,
      sleepHours: 8,
      impulseScore: 1,
      note: 'Everything connected today. This is the feeling I want to build around.',
      tags: 'creative,music',
    },
  ];

  for (const row of seedRows) {
    await db.runAsync(
      `INSERT INTO entries (createdAt, moodLabel, moodScore, energyScore, stressScore, sleepHours, impulseScore, note, tags)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      row.createdAt,
      row.moodLabel,
      row.moodScore,
      row.energyScore,
      row.stressScore,
      row.sleepHours,
      row.impulseScore,
      row.note,
      row.tags
    );
  }
}

export async function getEntries(db: SQLiteDatabase) {
  return db.getAllAsync<EntryRecord>('SELECT * FROM entries ORDER BY datetime(createdAt) DESC');
}

export async function createEntry(
  db: SQLiteDatabase,
  entry: Omit<EntryRecord, 'id' | 'createdAt'> & { createdAt?: string }
) {
  await db.runAsync(
    `INSERT INTO entries (createdAt, moodLabel, moodScore, energyScore, stressScore, sleepHours, impulseScore, note, tags)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    entry.createdAt ?? new Date().toISOString(),
    entry.moodLabel,
    entry.moodScore,
    entry.energyScore ?? null,
    entry.stressScore ?? null,
    entry.sleepHours ?? null,
    entry.impulseScore ?? null,
    entry.note,
    entry.tags
  );
}
