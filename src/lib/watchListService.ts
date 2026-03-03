import { getDb } from "./db";
import type { WatchItem, WatchItemInput } from "./types";

const COLUMNS = "id, userName, userEmail, partNumber, note, createdDate";

export function getAllWatchItems(): WatchItem[] {
  const db = getDb();
  return db
    .prepare(`SELECT ${COLUMNS} FROM WatchItems ORDER BY partNumber, userName`)
    .all() as WatchItem[];
}

export function getWatchItemById(id: number): WatchItem | undefined {
  const db = getDb();
  return db
    .prepare(`SELECT ${COLUMNS} FROM WatchItems WHERE id = ?`)
    .get(id) as WatchItem | undefined;
}

export function addWatchItem(input: WatchItemInput): WatchItem {
  const db = getDb();
  const now = new Date().toISOString();
  const result = db
    .prepare(
      "INSERT INTO WatchItems (userName, userEmail, partNumber, note, createdDate) VALUES (?, ?, ?, ?, ?)"
    )
    .run(input.userName, input.userEmail, input.partNumber, input.note ?? "", now);

  return {
    id: result.lastInsertRowid as number,
    userName: input.userName,
    userEmail: input.userEmail,
    partNumber: input.partNumber,
    note: input.note ?? "",
    createdDate: now,
  };
}

export function updateWatchItem(
  id: number,
  input: WatchItemInput
): WatchItem | undefined {
  const db = getDb();
  const result = db
    .prepare(
      "UPDATE WatchItems SET userName = ?, userEmail = ?, partNumber = ?, note = ? WHERE id = ?"
    )
    .run(input.userName, input.userEmail, input.partNumber, input.note ?? "", id);

  if (result.changes === 0) return undefined;
  return getWatchItemById(id);
}

export function removeWatchItem(id: number): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM WatchItems WHERE id = ?").run(id);
  return result.changes > 0;
}
