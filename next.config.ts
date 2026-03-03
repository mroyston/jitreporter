import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Native Node modules must not be bundled by Webpack/Turbopack
  serverExternalPackages: ["better-sqlite3", "msnodesqlv8"],
};

export default nextConfig;
