import { NextResponse } from "next/server";
import { removeWatchItem, updateWatchItem } from "@/lib/watchListService";

type RouteContext = { params: Promise<{ id: string }> };

async function resolveId(ctx: RouteContext) {
  const { id: raw } = await ctx.params;
  const id = parseInt(raw, 10);
  return isNaN(id) ? null : id;
}

export async function PUT(request: Request, ctx: RouteContext) {
  try {
    const id = await resolveId(ctx);
    if (id === null) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await request.json();
    const { userName, userEmail, partNumber, note } = body;

    if (!userName || !userEmail || !partNumber) {
      return NextResponse.json(
        { error: "userName, userEmail, and partNumber are required" },
        { status: 400 }
      );
    }

    const updated = updateWatchItem(id, { userName, userEmail, partNumber, note: note ?? "" });
    if (!updated) {
      return NextResponse.json({ error: "Watch item not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update watch item:", error);
    return NextResponse.json(
      { error: "Failed to update watch item" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, ctx: RouteContext) {
  try {
    const id = await resolveId(ctx);
    if (id === null) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const deleted = removeWatchItem(id);
    if (!deleted) {
      return NextResponse.json({ error: "Watch item not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete watch item:", error);
    return NextResponse.json(
      { error: "Failed to delete watch item" },
      { status: 500 }
    );
  }
}
