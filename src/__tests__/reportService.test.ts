import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ProductionOrder, JitReportEntry } from "@/lib/types";

// Mock the dependencies
vi.mock("@/lib/watchListService", () => ({
  getAllWatchItems: vi.fn(),
}));

vi.mock("@/lib/productionDataService", () => ({
  getUpcomingProductionOrders: vi.fn(),
}));

import { getAllWatchItems } from "@/lib/watchListService";
import { getUpcomingProductionOrders } from "@/lib/productionDataService";
import {
  generateReport,
  generateHtmlReport,
  getActiveWatcherEmails,
} from "@/lib/reportService";

const mockedGetAllWatchItems = vi.mocked(getAllWatchItems);
const mockedGetOrders = vi.mocked(getUpcomingProductionOrders);

function makeOrder(overrides: Partial<ProductionOrder> = {}): ProductionOrder {
  return {
    materialNumber: "MAT001",
    orderTypeText: "Production Order",
    productionOrderNumber: "PO-100",
    basicStartDate: "2026-03-10T00:00:00.000Z",
    basicEndDate: "2026-03-12T00:00:00.000Z",
    releaseDatetime: "2026-03-08T00:00:00.000Z",
    orderQuantity: 100,
    longText: "Test order",
    materialText: "Widget A",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ReportService", () => {
  describe("generateReport", () => {
    it("should return empty when no watches", async () => {
      mockedGetAllWatchItems.mockReturnValue([]);
      mockedGetOrders.mockResolvedValue([makeOrder()]);

      const result = await generateReport();
      expect(result).toEqual([]);
    });

    it("should return empty when no production orders", async () => {
      mockedGetAllWatchItems.mockReturnValue([
        {
          id: 1,
          userName: "Alice",
          userEmail: "alice@example.com",
          partNumber: "MAT001",
          note: "",
          createdDate: new Date().toISOString(),
        },
      ]);
      mockedGetOrders.mockResolvedValue([]);

      const result = await generateReport();
      expect(result).toEqual([]);
    });

    it("should match watch items to production orders case-insensitively", async () => {
      mockedGetAllWatchItems.mockReturnValue([
        {
          id: 1,
          userName: "Alice",
          userEmail: "alice@example.com",
          partNumber: "mat001", // lowercase
          note: "Tracking",
          createdDate: new Date().toISOString(),
        },
      ]);
      mockedGetOrders.mockResolvedValue([
        makeOrder({ materialNumber: "MAT001" }), // uppercase
      ]);

      const result = await generateReport();
      expect(result).toHaveLength(1);
      expect(result[0].watcherName).toBe("Alice");
      expect(result[0].materialNumber).toBe("MAT001");
      expect(result[0].watchNote).toBe("Tracking");
    });

    it("should not include non-matching items", async () => {
      mockedGetAllWatchItems.mockReturnValue([
        {
          id: 1,
          userName: "Bob",
          userEmail: "bob@example.com",
          partNumber: "NOMATCH",
          note: "",
          createdDate: new Date().toISOString(),
        },
      ]);
      mockedGetOrders.mockResolvedValue([makeOrder()]);

      const result = await generateReport();
      expect(result).toHaveLength(0);
    });

    it("should produce multiple entries for multiple watchers on same part", async () => {
      mockedGetAllWatchItems.mockReturnValue([
        {
          id: 1,
          userName: "Alice",
          userEmail: "alice@example.com",
          partNumber: "MAT001",
          note: "",
          createdDate: new Date().toISOString(),
        },
        {
          id: 2,
          userName: "Bob",
          userEmail: "bob@example.com",
          partNumber: "MAT001",
          note: "",
          createdDate: new Date().toISOString(),
        },
      ]);
      mockedGetOrders.mockResolvedValue([makeOrder()]);

      const result = await generateReport();
      expect(result).toHaveLength(2);
      const names = result.map((e: JitReportEntry) => e.watcherName).sort();
      expect(names).toEqual(["Alice", "Bob"]);
    });
  });

  describe("generateHtmlReport", () => {
    it("should return fallback when no matches", async () => {
      mockedGetAllWatchItems.mockReturnValue([]);
      mockedGetOrders.mockResolvedValue([]);

      const html = await generateHtmlReport();
      expect(html).toContain("No upcoming production");
    });

    it("should produce HTML table when matches exist", async () => {
      mockedGetAllWatchItems.mockReturnValue([
        {
          id: 1,
          userName: "Alice",
          userEmail: "alice@example.com",
          partNumber: "MAT001",
          note: "Test",
          createdDate: new Date().toISOString(),
        },
      ]);
      mockedGetOrders.mockResolvedValue([makeOrder()]);

      const html = await generateHtmlReport();
      expect(html).toContain("<html>");
      expect(html).toContain("<table");
      expect(html).toContain("Alice");
      expect(html).toContain("MAT001");
      expect(html).toContain("JIT Process Report");
    });

    it("should HTML-encode special characters", async () => {
      mockedGetAllWatchItems.mockReturnValue([
        {
          id: 1,
          userName: '<script>alert("xss")</script>',
          userEmail: "xss@example.com",
          partNumber: "MAT001",
          note: "",
          createdDate: new Date().toISOString(),
        },
      ]);
      mockedGetOrders.mockResolvedValue([makeOrder()]);

      const html = await generateHtmlReport();
      expect(html).not.toContain("<script>");
      expect(html).toContain("&lt;script&gt;");
    });
  });

  describe("getActiveWatcherEmails", () => {
    it("should return distinct emails", async () => {
      mockedGetAllWatchItems.mockReturnValue([
        {
          id: 1,
          userName: "Alice",
          userEmail: "alice@example.com",
          partNumber: "MAT001",
          note: "",
          createdDate: new Date().toISOString(),
        },
        {
          id: 2,
          userName: "Alice Again",
          userEmail: "ALICE@example.com", // same email, different case
          partNumber: "MAT001",
          note: "",
          createdDate: new Date().toISOString(),
        },
      ]);
      mockedGetOrders.mockResolvedValue([makeOrder()]);

      const emails = await getActiveWatcherEmails();
      expect(emails).toHaveLength(1);
      expect(emails[0]).toBe("alice@example.com");
    });
  });
});
