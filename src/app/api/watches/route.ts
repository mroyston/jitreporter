import { NextResponse } from "next/server";
import { getAllWatchItems, addWatchItem } from "@/lib/watchListService";
import type { WatchItemInput } from "@/lib/types";

export async function GET() {
  try {
    const items = getAllWatchItems();
    return NextResponse.json(items);
  } catch (error) {
    console.error("Failed to get watch items:", error);
    return NextResponse.json(
      { error: "Failed to retrieve watch items" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as WatchItemInput;

    // Validate required fields
    if (!body.userName?.trim()) {
      return NextResponse.json({ error: "userName is required" }, { status: 400 });
    }
    if (!body.userEmail?.trim()) {
      return NextResponse.json({ error: "userEmail is required" }, { status: 400 });
    }
    if (!body.partNumber?.trim()) {
      return NextResponse.json({ error: "partNumber is required" }, { status: 400 });
    }

    const item = addWatchItem({
      userName: body.userName.trim(),
      userEmail: body.userEmail.trim(),
      partNumber: body.partNumber.trim(),
      note: body.note?.trim() ?? "",
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Failed to add watch item:", error);
    return NextResponse.json(
      { error: "Failed to add watch item" },
      { status: 500 }
    );
  }
}
