import { NextResponse } from "next/server";
import { getActiveWatcherEmails } from "@/lib/reportService";

export async function GET() {
  try {
    const emails = await getActiveWatcherEmails();
    return NextResponse.json(emails);
  } catch (error) {
    console.error("Failed to get watcher emails:", error);
    return NextResponse.json(
      { error: "Failed to get watcher emails" },
      { status: 500 }
    );
  }
}
