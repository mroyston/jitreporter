import { NextResponse } from "next/server";
import { generateReport } from "@/lib/reportService";

export async function GET() {
  try {
    const entries = await generateReport();
    return NextResponse.json(entries);
  } catch (error) {
    console.error("Failed to generate report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
