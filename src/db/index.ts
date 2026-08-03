// Local SQLite — the read path for the whole app (see
// docs/04-database-schema.md and docs/06-technical-architecture.md).
// Screens/components should go through repository functions built in later
// phases, not call getDb() directly — this module just owns the connection
// and first-launch schema setup.

import * as SQLite from 'expo-sqlite';
import { LOCAL_SCHEMA_SQL } from './schema';

const DB_NAME = 'afterlight.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function openAndInit(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);

  // foreign_keys is a per-connection setting, not persisted — must be set
  // every time. journal_mode=WAL is persisted once set, but re-setting it
  // is a cheap no-op, so it's simplest to just always run both.
  await db.execAsync('pragma journal_mode = WAL; pragma foreign_keys = ON;');
  await db.execAsync(LOCAL_SCHEMA_SQL);

  return db;
}

// Lazily opens (once) and reuses a single connection for the app's lifetime.
export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = openAndInit();
  }
  return dbPromise;
}
