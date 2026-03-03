import { getAllWatchItems } from "./watchListService";
import { getUpcomingProductionOrders } from "./productionDataService";
import type { JitReportEntry } from "./types";

/**
 * Joins watch items (SQLite) with upcoming production orders (DW)
 * on part number / material number (case-insensitive).
 */
export async function generateReport(): Promise<JitReportEntry[]> {
  const watchItems = getAllWatchItems();
  const productionOrders = await getUpcomingProductionOrders();

  // Index orders by material number for efficient lookup
  const ordersByMaterial = new Map<string, typeof productionOrders>();
  for (const order of productionOrders) {
    const key = order.materialNumber.toUpperCase();
    const list = ordersByMaterial.get(key) ?? [];
    list.push(order);
    ordersByMaterial.set(key, list);
  }

  const entries: JitReportEntry[] = [];
  for (const watch of watchItems) {
    const matches = ordersByMaterial.get(watch.partNumber.toUpperCase()) ?? [];
    for (const order of matches) {
      entries.push({
        watcherName: watch.userName,
        watcherEmail: watch.userEmail,
        materialNumber: order.materialNumber,
        watchNote: watch.note,
        orderTypeText: order.orderTypeText,
        productionOrderNumber: order.productionOrderNumber,
        basicStartDate: order.basicStartDate,
        basicEndDate: order.basicEndDate,
        releaseDatetime: order.releaseDatetime,
        orderQuantity: order.orderQuantity,
        materialText: order.materialText,
        longText: order.longText,
      });
    }
  }

  entries.sort((a, b) => {
    const dateA = a.basicStartDate ?? "";
    const dateB = b.basicStartDate ?? "";
    if (dateA !== dateB) return dateA < dateB ? -1 : 1;
    return a.watcherName.localeCompare(b.watcherName);
  });

  return entries;
}

function htmlEncode(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toISOString().split("T")[0];
}

function formatQty(qty: number | null): string {
  if (qty == null) return "";
  return qty.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

/**
 * Generates a styled HTML email body for the JIT report.
 */
export async function generateHtmlReport(): Promise<string> {
  const entries = await generateReport();

  if (entries.length === 0) {
    return "<p>No upcoming production matches any current watch items.</p>";
  }

  const headerStyle =
    "background-color: #4472C4; color: white; padding: 6px 10px;";
  const altRowStyle = "background-color: #D9E2F3;";

  let html = `<html><body>
<h2>JIT Process Report</h2>
<p>The following production orders match items on the JIT watch list:</p>
<table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; font-family: Arial, sans-serif;">
<tr style="${headerStyle}">
  <th>Watcher</th>
  <th>Material Number</th>
  <th>Watch Reason</th>
  <th>Order Type</th>
  <th>Production Order</th>
  <th>Release Date</th>
  <th>Start Date</th>
  <th>End Date</th>
  <th>Material Text</th>
  <th>Quantity</th>
  <th>Long Text</th>
</tr>`;

  entries.forEach((entry, i) => {
    const rowStyle = i % 2 === 1 ? ` style="${altRowStyle}"` : "";
    html += `
<tr${rowStyle}>
  <td>${htmlEncode(entry.watcherName)}</td>
  <td>${htmlEncode(entry.materialNumber)}</td>
  <td>${htmlEncode(entry.watchNote)}</td>
  <td>${htmlEncode(entry.orderTypeText)}</td>
  <td>${htmlEncode(entry.productionOrderNumber)}</td>
  <td>${formatDate(entry.releaseDatetime)}</td>
  <td>${formatDate(entry.basicStartDate)}</td>
  <td>${formatDate(entry.basicEndDate)}</td>
  <td>${htmlEncode(entry.materialText)}</td>
  <td>${formatQty(entry.orderQuantity)}</td>
  <td>${htmlEncode(entry.longText)}</td>
</tr>`;
  });

  const now = new Date().toISOString().replace("T", " ").substring(0, 16);
  html += `
</table>
<p><em>Report generated ${now} — JIT Reporter</em></p>
</body></html>`;

  return html;
}

export async function getActiveWatcherEmails(): Promise<string[]> {
  const entries = await generateReport();
  const unique = [...new Set(entries.map((e) => e.watcherEmail.toLowerCase()))];
  unique.sort();
  return unique;
}
