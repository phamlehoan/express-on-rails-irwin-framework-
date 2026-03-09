/**
 * Swagger Registry - route helper đăng ký từng path khi define route.
 * Không cần config thủ công, swagger nằm ngay cạnh this.path.get/post.
 */

export type SwaggerPaths = Record<string, Record<string, object>>;

const registry: SwaggerPaths[] = [];

export function registerSwaggerPaths(paths: SwaggerPaths) {
  registry.push(paths);
}

/** Đăng ký 1 path - gọi từ route() helper */
export function registerSwaggerPath(
  path: string,
  method: string,
  operation: object
) {
  let entry = registry.find((r) => r[path]);
  if (!entry) {
    entry = { [path]: {} };
    registry.push(entry);
  }
  (entry[path] as any)[method] = operation;
}

export function getMergedPaths(): Record<string, object> {
  return Object.assign({}, ...registry);
}
