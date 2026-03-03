/**
 * Represents a user's watch on a specific part number.
 * Persisted in SQLite.
 */
export interface WatchItem {
  id: number;
  userName: string;
  userEmail: string;
  partNumber: string;
  note: string;
  createdDate: string; // ISO 8601
}

/**
 * Input for creating a new watch item (id and createdDate are server-assigned).
 */
export type WatchItemInput = Omit<WatchItem, "id" | "createdDate">;

/**
 * Represents a production order from the data warehouse.
 * Columns sourced from dm.view_ProductionOrder_v1 on dw-sql/rdw.
 */
export interface ProductionOrder {
  materialNumber: string;
  orderTypeText: string;
  productionOrderNumber: string;
  basicStartDate: string | null;
  basicEndDate: string | null;
  releaseDatetime: string | null;
  orderQuantity: number | null;
  longText: string;
  materialText: string;
}

/**
 * A matched result joining a watch item with a production order.
 * Used for building the JIT report email.
 */
export interface JitReportEntry {
  watcherName: string;
  watcherEmail: string;
  materialNumber: string;
  watchNote: string;
  orderTypeText: string;
  productionOrderNumber: string;
  basicStartDate: string | null;
  basicEndDate: string | null;
  releaseDatetime: string | null;
  orderQuantity: number | null;
  materialText: string;
  longText: string;
}
