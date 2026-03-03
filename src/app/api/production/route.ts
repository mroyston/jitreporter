import { NextResponse } from "next/server";
import { getUpcomingProductionOrders } from "@/lib/productionDataService";
import type { ProductionOrder } from "@/lib/types";

// Server-side cache: refreshed at most once per hour, or via ?force=true
let cachedOrders: ProductionOrder[] | null = null;
let cachedAt: number = 0;
const CACHE_TTL_MS = 60 * 60 * 1000;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const force = url.searchParams.get("force") === "true";
    const now = Date.now();

    if (force || !cachedOrders || now - cachedAt > CACHE_TTL_MS) {
      cachedOrders = await getUpcomingProductionOrders();
      cachedAt = Date.now();
    }

    return NextResponse.json(
      { orders: cachedOrders, cachedAt: new Date(cachedAt).toISOString() },
    );
  } catch (error) {
    console.error("Failed to fetch production orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch production orders from data warehouse" },
      { status: 500 }
    );
  }
}
