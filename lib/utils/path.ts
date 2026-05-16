import { join } from "path";
import { getPackageRootSync, resolveBundledScriptDir } from "@configs/loadDotenv";

const moduleDir = resolveBundledScriptDir("lib/utils");
const moduleFile =
  typeof __filename !== "undefined"
    ? __filename
    : join(moduleDir, "path.js");

/**
 * Thư mục gốc package (có `package.json`), kể cả khi chạy `node dist/index.js`
 * (`__dirname` nằm dưới `dist/lib/...`).
 */
const packageRoot = getPackageRootSync(moduleDir);

/** Stack đang chạy từ bản build `dist/` (vd. `node dist/index.js`). */
const stackIsFromDist = moduleFile.replace(/\\/g, "/").includes("/dist/");

export const rootPath = (...paths: string[]) => join(packageRoot, ...paths);

/** Nguồn `app/`: views (pug), assets tĩnh — luôn thư mục gốc dự án. */
export const appPath = (...paths: string[]) =>
  join(packageRoot, "app", ...paths);

/** `dist/app/…` sau `tsc` — dùng cho `require()` động (concerns). */
export const appCompiledPath = (...paths: string[]) =>
  join(packageRoot, "dist", "app", ...paths);

/** Concerns / code nạp động: `dist/app` khi chạy build; `app` khi tsx/nodemon. */
export const appCodePath = (...paths: string[]) =>
  stackIsFromDist ? appCompiledPath(...paths) : appPath(...paths);

export const vendorPath = (packageName: string, ...subPaths: string[]) =>
  join(packageRoot, "node_modules", packageName, ...subPaths);
