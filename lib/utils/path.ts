import { join, resolve } from "path";

/**
 * Resolve path from the project root
 */
export const rootPath = (...paths: string[]) => resolve(...paths);

/**
 * Resolve path from the app directory
 */
export const appPath = (...paths: string[]) => join(rootPath("app"), ...paths);

/**
 * Resolve path from node_modules
 */
export const vendorPath = (packageName: string, ...subPaths: string[]) => {
  return join(rootPath("node_modules"), packageName, ...subPaths);
};
