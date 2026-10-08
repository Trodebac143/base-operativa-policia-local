// vinext 0.0.50 builds its static-file cache with Windows path separators,
// then looks up browser URLs with forward slashes. Normalize cache keys until
// vinext fixes this upstream; keep the normal vinext CLI for everything else.
// Its static MIME map also omits PDF, which prevents reliable inline viewing.
if (process.platform === "win32") {
  const vinextIndex = import.meta.resolve("vinext");
  const cacheModule = new URL("./server/static-file-cache.js", vinextIndex);
  const { StaticFileCache } = await import(cacheModule);
  const createCache = StaticFileCache.create;

  StaticFileCache.create = async function (...args) {
    const cache = await createCache.apply(this, args);
    for (const [pathname, entry] of cache.entries) {
      if (pathname.toLowerCase().endsWith(".pdf")) {
        for (const variant of [entry.original, entry.br, entry.gz, entry.zst]) {
          if (variant) variant.headers["Content-Type"] = "application/pdf";
        }
      }
      if (pathname.includes("\\")) {
        cache.entries.set(pathname.replaceAll("\\", "/"), entry);
      }
    }
    return cache;
  };
}

process.argv.splice(2, 0, "start");
await import(new URL("./cli.js", import.meta.resolve("vinext")));
