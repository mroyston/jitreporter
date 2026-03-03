import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import { setDbOverride, initializeSchema } from "@/lib/db";
import {
  getAllWatchItems,
  getWatchItemById,
  addWatchItem,
  removeWatchItem,
} from "@/lib/watchListService";

let testDb: Database.Database;

beforeEach(() => {
  // Create an in-memory database for each test
  testDb = new Database(":memory:");
  initializeSchema(testDb);
  setDbOverride(testDb);
});

afterEach(() => {
  setDbOverride(null);
  testDb?.close();
});

describe("WatchListService", () => {
  it("should return empty list when no items exist", () => {
    const items = getAllWatchItems();
    expect(items).toEqual([]);
  });

  it("should add a watch item and return it with an id", () => {
    const item = addWatchItem({
      userName: "Alice",
      userEmail: "alice@example.com",
      partNumber: "ABC123",
      note: "Test note",
    });

    expect(item.id).toBeGreaterThan(0);
    expect(item.userName).toBe("Alice");
    expect(item.userEmail).toBe("alice@example.com");
    expect(item.partNumber).toBe("ABC123");
    expect(item.note).toBe("Test note");
    expect(item.createdDate).toBeTruthy();
  });

  it("should retrieve all items ordered by partNumber then userName", () => {
    addWatchItem({
      userName: "Bob",
      userEmail: "bob@example.com",
      partNumber: "ZZZ999",
      note: "",
    });
    addWatchItem({
      userName: "Alice",
      userEmail: "alice@example.com",
      partNumber: "AAA111",
      note: "",
    });

    const items = getAllWatchItems();
    expect(items).toHaveLength(2);
    expect(items[0].partNumber).toBe("AAA111");
    expect(items[1].partNumber).toBe("ZZZ999");
  });

  it("should get a watch item by id", () => {
    const added = addWatchItem({
      userName: "Charlie",
      userEmail: "charlie@example.com",
      partNumber: "DEF456",
      note: "My note",
    });

    const found = getWatchItemById(added.id);
    expect(found).toBeDefined();
    expect(found!.userName).toBe("Charlie");
    expect(found!.partNumber).toBe("DEF456");
  });

  it("should return undefined for non-existent id", () => {
    const found = getWatchItemById(9999);
    expect(found).toBeUndefined();
  });

  it("should remove a watch item and return true", () => {
    const added = addWatchItem({
      userName: "Dave",
      userEmail: "dave@example.com",
      partNumber: "GHI789",
      note: "",
    });

    const removed = removeWatchItem(added.id);
    expect(removed).toBe(true);

    const items = getAllWatchItems();
    expect(items).toHaveLength(0);
  });

  it("should return false when removing non-existent item", () => {
    const removed = removeWatchItem(9999);
    expect(removed).toBe(false);
  });
});
