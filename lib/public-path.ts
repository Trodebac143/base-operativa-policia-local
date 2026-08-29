const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Resuelve recursos de public/ tanto en local como bajo el subdirectorio de GitHub Pages. */
export function publicPath(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${basePath}${normalizedPath}`;
}
