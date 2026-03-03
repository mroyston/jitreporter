"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { ProductionOrder, WatchItem } from "@/lib/types";

type SortKey = keyof ProductionOrder;
type SortDir = "asc" | "desc";

const COLUMNS: {
  key: SortKey;
  label: string;
  align: "left" | "right";
  type: "string" | "date" | "number";
}[] = [
  { key: "materialNumber", label: "Material Number", align: "left", type: "string" },
  { key: "orderTypeText", label: "Order Type", align: "left", type: "string" },
  { key: "productionOrderNumber", label: "Production Order", align: "left", type: "string" },
  { key: "releaseDatetime", label: "Release Date", align: "left", type: "date" },
  { key: "basicStartDate", label: "Start Date", align: "left", type: "date" },
  { key: "basicEndDate", label: "End Date", align: "left", type: "date" },
  { key: "orderQuantity", label: "Qty", align: "right", type: "number" },
  { key: "materialText", label: "Material Text", align: "left", type: "string" },
  { key: "longText", label: "Long Text", align: "left", type: "string" },
];

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toISOString().split("T")[0];
}

function formatQty(qty: number | null): string {
  if (qty == null) return "—";
  return qty.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

export default function ResultsPage() {
  const [orders, setOrders] = useState<ProductionOrder[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("basicStartDate");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [watchedOnly, setWatchedOnly] = useState(false);

  const [watchMap, setWatchMap] = useState<Map<string, WatchItem[]>>(new Map());

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const fetchWatches = useCallback(async () => {
    try {
      const res = await fetch("/api/watches");
      if (!res.ok) return;
      const items: WatchItem[] = await res.json();
      const map = new Map<string, WatchItem[]>();
      for (const w of items) {
        const key = w.partNumber.toUpperCase();
        const existing = map.get(key) ?? [];
        existing.push(w);
        map.set(key, existing);
      }
      setWatchMap(map);
    } catch {
      // Non-critical — watches just won't highlight
    }
  }, []);

  const sortedOrders = useMemo(() => {
    if (!orders) return null;
    const col = COLUMNS.find((c) => c.key === sortKey);
    if (!col) return orders;

    return [...orders].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];

      // Nulls always sort last regardless of direction
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;

      let cmp = 0;
      if (col.type === "number") {
        cmp = (av as number) - (bv as number);
      } else if (col.type === "date") {
        cmp = new Date(av as string).getTime() - new Date(bv as string).getTime();
      } else {
        cmp = String(av).localeCompare(String(bv), undefined, { sensitivity: "base" });
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [orders, sortKey, sortDir]);

  /** Orders after applying the "watched only" filter, then sorting. */
  const displayOrders = useMemo(() => {
    if (!sortedOrders) return null;
    if (!watchedOnly || watchMap.size === 0) return sortedOrders;
    return sortedOrders.filter((o) =>
      watchMap.has(o.materialNumber.toUpperCase())
    );
  }, [sortedOrders, watchedOnly, watchMap]);

  const watchedCount = useMemo(() => {
    if (!orders || watchMap.size === 0) return 0;
    return orders.filter((o) =>
      watchMap.has(o.materialNumber.toUpperCase())
    ).length;
  }, [orders, watchMap]);

  const fetchOrders = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);

    try {
      const url = force ? "/api/production?force=true" : "/api/production";
      const res = await fetch(url);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Server returned ${res.status}`);
      }
      const data = await res.json();
      setOrders(data.orders);
      setLastRefreshed(data.cachedAt);
    } catch (err) {
      setError((err as Error).message);
      setOrders(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-load on mount
  useEffect(() => {
    fetchOrders();
    fetchWatches();
  }, [fetchOrders, fetchWatches]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Upcoming Production Orders</h1>
      <p className="text-gray-500 mb-4">
        All upcoming production orders from the data warehouse (next 14 days).
        Data is cached for up to 1 hour.
      </p>

      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => fetchOrders(true)}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium px-6 py-2 rounded transition-colors"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Spinner />
              Loading...
            </span>
          ) : (
            "Refresh"
          )}
        </button>

        {lastRefreshed && (
          <span className="text-sm text-gray-500">
            Last refreshed: {formatTimestamp(lastRefreshed)}
          </span>
        )}

        {watchMap.size > 0 && orders && orders.length > 0 && (
          <label className="inline-flex items-center gap-2 text-sm cursor-pointer select-none ml-2">
            <input
              type="checkbox"
              checked={watchedOnly}
              onChange={(e) => setWatchedOnly(e.target.checked)}
              className="rounded border-gray-300 text-yellow-500 focus:ring-yellow-400"
            />
            <span>
              Watched only
              <span className="ml-1 text-yellow-600 dark:text-yellow-400 font-medium">
                ({watchedCount})
              </span>
            </span>
          </label>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      {orders === null && !error && loading && (
        <p className="text-gray-500 italic">Loading production orders...</p>
      )}

      {orders !== null && orders.length === 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 px-4 py-3 rounded">
          No upcoming production orders found.
        </div>
      )}

      {displayOrders !== null && displayOrders.length > 0 && (
        <>
          <p className="text-gray-500 mb-2">
            Showing {displayOrders.length} order(s).
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 dark:border-gray-700">
              <thead>
                <tr className="bg-gray-800 text-white">
                  {COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      className={`px-4 py-2 cursor-pointer select-none hover:bg-gray-700 transition-colors ${col.align === "right" ? "text-right" : "text-left"}`}
                    >
                      <span className="inline-flex items-center gap-1">
                        {col.label}
                        {sortKey === col.key ? (
                          <span className="text-blue-300">
                            {sortDir === "asc" ? "▲" : "▼"}
                          </span>
                        ) : (
                          <span className="text-gray-500 text-xs">⇅</span>
                        )}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayOrders.map((order, i) => {
                  const watchers = watchMap.get(order.materialNumber.toUpperCase());
                  const isWatched = !!watchers;
                  return (
                  <tr
                    key={`${order.productionOrderNumber}-${i}`}
                    className={`border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 even:bg-gray-50 dark:even:bg-gray-800/50 ${isWatched ? "border-l-4 border-l-yellow-400" : ""}`}
                  >
                    <td className="px-4 py-2 font-semibold">
                      <div className="flex items-center gap-2">
                        {order.materialNumber}
                        {isWatched && (
                          <span
                            className="inline-flex items-center gap-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 px-2 py-0.5 rounded-full"
                            title={watchers.map((w) => `${w.userName}: ${w.note}`).join("; ")}
                          >
                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 12a5 5 0 100-10 5 5 0 000 10zm0 2c-5.33 0-8 2.67-8 4v1h16v-1c0-1.33-2.67-4-8-4z" />
                            </svg>
                            {watchers.map((w) => w.userName).join(", ")}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2">{order.orderTypeText}</td>
                    <td className="px-4 py-2">
                      {order.productionOrderNumber}
                    </td>
                    <td className="px-4 py-2">
                      {formatDate(order.releaseDatetime)}
                    </td>
                    <td className="px-4 py-2">
                      {formatDate(order.basicStartDate)}
                    </td>
                    <td className="px-4 py-2">
                      {formatDate(order.basicEndDate)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {formatQty(order.orderQuantity)}
                    </td>
                    <td className="px-4 py-2">{order.materialText}</td>
                    <td className="px-4 py-2">{order.longText}</td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
