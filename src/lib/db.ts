import Database from "better-sqlite3";
import path from "path";

// Database file lives at the project root
const DB_PATH = path.resolve(process.cwd(), "jit.db");

let _db: Database.Database | null = null;

/**
 * Override for testing — allows injecting a test database instance.
 */
let _dbOverride: Database.Database | null = null;

export function setDbOverride(db: Database.Database | null): void {
  _dbOverride = db;
}

/**
 * Returns a singleton better-sqlite3 database instance.
 * Creates the WatchItems table on first access.
 */
export function getDb(): Database.Database {
  if (_dbOverride) return _dbOverride;
  if (_db) return _db;

  _db = new Database(DB_PATH);

  // Enable WAL mode for better concurrent read performance
  _db.pragma("journal_mode = WAL");

  initializeSchema(_db);

  return _db;
}

/**
 * Creates the required tables/indexes if they don't exist.
 */
export function initializeSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS WatchItems (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      userName    TEXT    NOT NULL,
      userEmail   TEXT    NOT NULL,
      partNumber  TEXT    NOT NULL,
      note        TEXT    NOT NULL DEFAULT '',
      createdDate TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_watchitems_partnumber ON WatchItems (partNumber)
  `);
}
