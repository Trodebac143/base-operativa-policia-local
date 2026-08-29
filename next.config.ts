import type { NextConfig } from "next";

const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1];
const pagesBasePath = process.env.PAGES_BASE_PATH
  ?? (process.env.GITHUB_ACTIONS === "true" && repositoryName ? `/${repositoryName}` : "");

const nextConfig: NextConfig = {
  output: "export",
  basePath: pagesBasePath,
  trailingSlash: true,
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_BASE_PATH: pagesBasePath },
};

export default nextConfig;
