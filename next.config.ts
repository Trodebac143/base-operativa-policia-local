import type { NextConfig } from "next";

const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1];
const isPagesBuild = process.env.PAGES_BUILD === "true";
const pagesBasePath = process.env.PAGES_BASE_PATH
  ?? (isPagesBuild && repositoryName ? `/${repositoryName}` : "");

const nextConfig: NextConfig = {
  ...(isPagesBuild ? {
    output: "export" as const,
    basePath: pagesBasePath,
    trailingSlash: true,
    images: { unoptimized: true },
  } : {}),
  env: { NEXT_PUBLIC_BASE_PATH: pagesBasePath },
};

export default nextConfig;
