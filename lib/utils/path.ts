import { join, resolve } from "path";

/**
 * Resolve path from the project root
 * Tự động nhận diện nếu đang chạy trong 'dist' thì gốc sẽ là 'dist'
 */
export const rootPath = (...paths: string[]) => {
  const isDist = __dirname.includes("dist");
  const base = isDist ? resolve(__dirname, "..") : resolve(".");

  return join(base, ...paths);
};

export const appPath = (...paths: string[]) => join(rootPath("app"), ...paths);

export const vendorPath = (packageName: string, ...subPaths: string[]) => {
  const actualRoot = __dirname.includes("dist")
    ? resolve(__dirname, "../../..")
    : resolve(".");
  return join(actualRoot, "node_modules", packageName, ...subPaths);
};
