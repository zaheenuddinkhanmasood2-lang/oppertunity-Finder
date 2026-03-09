import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Avoid incorrect workspace root inference when multiple lockfiles exist.
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
