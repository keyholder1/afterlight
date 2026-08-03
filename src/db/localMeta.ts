// local_meta accessors — see docs/schema/local_sqlite_schema.sql § local_meta.
// This is the one row MainTabs screens read pairing/session state from
// locally, per docs/03-information-architecture.md's "local SQLite is the
// only read path" rule.

import { getDb } from './index';

export type LocalMeta = {
  user_id: string | null;
  pair_id: string | null;
  partner_id: string | null;
  partner_name: string | null;
  last_synced_at: string | null;
};

const EMPTY: LocalMeta = {
  user_id: null,
  pair_id: null,
  partner_id: null,
  partner_name: null,
  last_synced_at: null,
};

export async function getLocalMeta(): Promise<LocalMeta> {
  const db = await getDb();
  const row = await db.getFirstAsync<LocalMeta>('select * from local_meta where id = 1;');
  return row ?? EMPTY;
}

export async function setLocalMeta(patch: Partial<LocalMeta>): Promise<void> {
  const db = await getDb();
  const current = await getLocalMeta();
  const next = { ...current, ...patch };
  await db.runAsync(
    `insert into local_meta (id, user_id, pair_id, partner_id, partner_name, last_synced_at)
     values (1, ?, ?, ?, ?, ?)
     on conflict(id) do update set
       user_id = excluded.user_id,
       pair_id = excluded.pair_id,
       partner_id = excluded.partner_id,
       partner_name = excluded.partner_name,
       last_synced_at = excluded.last_synced_at;`,
    [next.user_id, next.pair_id, next.partner_id, next.partner_name, next.last_synced_at],
  );
}

export async function clearLocalMeta(): Promise<void> {
  const db = await getDb();
  await db.runAsync('delete from local_meta where id = 1;');
}
