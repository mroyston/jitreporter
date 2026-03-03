import { generateHtmlReport } from "@/lib/reportService";

export async function GET() {
  try {
    const html = await generateHtmlReport();
    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    console.error("Failed to generate HTML report:", error);
    return new Response("Failed to generate HTML report", { status: 500 });
  }
}
