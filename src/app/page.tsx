import Link from "next/link";

export default function HomePage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">JIT Reporter</h1>
      <p className="text-gray-500 mb-8">
        Just-In-Time production order reporting for the MAST team. This
        application replaces the legacy Excel-based JIT process.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/watches"
          className="block border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
        >
          <h2 className="text-xl font-semibold mb-2 group-hover:text-blue-600 transition-colors">
            Watch List &rarr;
          </h2>
          <p className="text-gray-500">
            View, add, or remove part numbers from the watch list. Watchers
            are notified when their parts have upcoming production orders.
          </p>
        </Link>

        <Link
          href="/results"
          className="block border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
        >
          <h2 className="text-xl font-semibold mb-2 group-hover:text-blue-600 transition-colors">
            Upcoming Production Orders &rarr;
          </h2>
          <p className="text-gray-500">
            Live view of all upcoming production orders from the data warehouse
            (next 14 days). Data refreshes automatically every hour.
          </p>
        </Link>
      </div>

      {/* API Info */}
      <div className="mt-12 border-t border-gray-200 dark:border-gray-700 pt-8">
        <h3 className="text-lg font-semibold mb-3">API Endpoints (Jenkins)</h3>
        <div className="overflow-x-auto">
          <table className="text-sm border border-gray-200 dark:border-gray-700">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800">
                <th className="px-4 py-2 text-left">Endpoint</th>
                <th className="px-4 py-2 text-left">Description</th>
              </tr>
            </thead>
            <tbody className="font-mono text-xs">
              <tr className="border-t border-gray-200 dark:border-gray-700">
                <td className="px-4 py-2">GET /api/jit/report</td>
                <td className="px-4 py-2 font-sans text-sm">
                  JSON report of matched watches + production
                </td>
              </tr>
              <tr className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <td className="px-4 py-2">GET /api/jit/report/html</td>
                <td className="px-4 py-2 font-sans text-sm">
                  HTML email body for the JIT report
                </td>
              </tr>
              <tr className="border-t border-gray-200 dark:border-gray-700">
                <td className="px-4 py-2">GET /api/jit/watchers</td>
                <td className="px-4 py-2 font-sans text-sm">
                  Email list of watchers with matches
                </td>
              </tr>
              <tr className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <td className="px-4 py-2">GET /api/jit/watchlist</td>
                <td className="px-4 py-2 font-sans text-sm">
                  Full watch list (all items)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
