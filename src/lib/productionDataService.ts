import sql from "mssql/msnodesqlv8";
import type { ProductionOrder } from "./types";

/**
 * Data warehouse connection configuration.
 * Server: dw-sql, Database: rdw, View: dm.view_ProductionOrder_v1
 *
 * Uses Windows Integrated Security via the native ODBC driver (msnodesqlv8),
 * matching the original Excel Power Query behaviour.
 * When deployed, run the app under TDY\appRi1JITReporter service account.
 *
 * Override via environment variables:
 *   DW_SERVER, DW_DATABASE, DW_USER, DW_PASSWORD
 */
function getConfig(): sql.config {
  const server = process.env.DW_SERVER ?? "dw-sql";
  const database = process.env.DW_DATABASE ?? "rdw";

  // If explicit SQL credentials are provided, use SQL Server auth
  if (process.env.DW_USER && process.env.DW_PASSWORD) {
    return {
      server,
      database,
      user: process.env.DW_USER,
      password: process.env.DW_PASSWORD,
      options: {
        encrypt: false,
        trustServerCertificate: true,
      },
      requestTimeout: 60_000,
      connectionTimeout: 15_000,
    };
  }

  // Otherwise use Windows Integrated Security via ODBC driver string
  return {
    connectionString: `Driver={ODBC Driver 17 for SQL Server};Server=${server};Database=${database};Trusted_Connection=yes;`,
    requestTimeout: 60_000,
    connectionTimeout: 15_000,
  } as unknown as sql.config;
}

/**
 * SQL query extracted from the Excel workbook Power Query definition.
 * Mirrors the original: dm.view_ProductionOrder_v1 filtered to Plant YVR1,
 * BasicStartDate between today and today + 14 days, DeletedFlag = '',
 * with unneeded columns excluded.
 */
const PRODUCTION_ORDER_QUERY = `
  SELECT
    MaterialNo          AS materialNumber,
    OrderTypeText       AS orderTypeText,
    ProductionOrder     AS productionOrderNumber,
    BasicStartDate      AS basicStartDate,
    BasicEndDate        AS basicEndDate,
    ReleaseDatetime     AS releaseDatetime,
    OrderQuantity       AS orderQuantity,
    LongText            AS longText,
    MaterialText        AS materialText
  FROM dm.view_ProductionOrder_v1
  WHERE Plant = 'YVR1'
    AND DeletedFlag = ''
    AND BasicStartDate >= CAST(GETDATE() AS DATE)
    AND BasicStartDate <= DATEADD(DAY, 14, CAST(GETDATE() AS DATE))
  ORDER BY MaterialNo
`;

export async function getUpcomingProductionOrders(): Promise<ProductionOrder[]> {
  const config = getConfig();
  const pool = await sql.connect(config);

  try {
    const result = await pool.request().query(PRODUCTION_ORDER_QUERY);

    return result.recordset.map((row) => ({
      materialNumber: row.materialNumber ?? "",
      orderTypeText: row.orderTypeText ?? "",
      productionOrderNumber: row.productionOrderNumber ?? "",
      basicStartDate: row.basicStartDate ? new Date(row.basicStartDate).toISOString() : null,
      basicEndDate: row.basicEndDate ? new Date(row.basicEndDate).toISOString() : null,
      releaseDatetime: row.releaseDatetime ? new Date(row.releaseDatetime).toISOString() : null,
      orderQuantity: row.orderQuantity != null ? Number(row.orderQuantity) : null,
      longText: row.longText ?? "",
      materialText: row.materialText ?? "",
    }));
  } finally {
    await pool.close();
  }
}
