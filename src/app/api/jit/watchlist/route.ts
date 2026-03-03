import { NextResponse } from "next/server";
import { getAllWatchItems } from "@/lib/watchListService";

export async function GET() {
  try {
    const items = getAllWatchItems();
    return NextResponse.json(items);
  } catch (error) {
    console.error("Failed to get watch list:", error);
    return NextResponse.json(
      { error: "Failed to get watch list" },
      { status: 500 }
    );
  }
}
