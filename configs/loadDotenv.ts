import fs from "fs";
import path from "path";
import dotenv from "dotenv";

let didLoad = false;

/**
 * Thư mục file hiện tại sau build CJS (`dist/configs`) hoặc Netlify bundle.
 * @param fallbackUnderCwd — khi không có `__dirname` (hiếm), walk từ cwd.
 */
export function resolveBundledScriptDir(fallbackUnderCwd: string): string {
  if (typeof __dirname !== "undefined") {
    return __dirname;
  }
  const cwd = process.cwd();
  const onLambda =
    cwd === "/var/task" ||
    Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME) ||
    Boolean(process.env.AWS_EXECUTION_ENV);
  if (onLambda) {
    return path.join(cwd, "netlify", "functions");
  }
  return path.join(cwd, ...fallbackUnderCwd.split("/").filter(Boolean));
}

const moduleDir = resolveBundledScriptDir("configs");

/** Thử mọi đường dẫn có thể tới `netlify/.runtime-secrets.json` (Lambda zip, cwd, walk từ __dirname). */
function collectRuntimeSecretPaths(packageRoot: string): string[] {
  const lambdaRoot = process.env["LAMBDA_TASK_ROOT"]?.trim();
  const here = path.resolve(moduleDir);
  const fromDirname: string[] = [];
  try {
    let dir = here;
    for (let i = 0; i < 24; i++) {
      fromDirname.push(path.join(dir, "netlify", ".runtime-secrets.json"));
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  } catch {
    /* ignore */
  }
  const candidates = [
    // Bundled Netlify handler: __dirname ≈ …/netlify/functions → file cạnh server.js (xem netlifyWriteRuntimeSecrets).
    path.join(here, ".runtime-secrets.json"),
    path.join(here, "..", ".runtime-secrets.json"),
    "/var/task/netlify/functions/.runtime-secrets.json",
    "/var/task/netlify/.runtime-secrets.json",
    ...(lambdaRoot
      ? [
          path.join(lambdaRoot, "netlify", "functions", ".runtime-secrets.json"),
          path.join(lambdaRoot, "netlify", ".runtime-secrets.json"),
        ]
      : []),
    path.join(process.cwd(), "netlify", "functions", ".runtime-secrets.json"),
    path.join(process.cwd(), "netlify", ".runtime-secrets.json"),
    path.join(packageRoot, "netlify", "functions", ".runtime-secrets.json"),
    path.join(packageRoot, "netlify", ".runtime-secrets.json"),
    ...fromDirname,
  ];
  const seen = new Set<string>();
  return candidates.filter((p) => {
    if (!p || seen.has(p)) return false;
    seen.add(p);
    return true;
  });
}

function injectNetlifyRuntimeSecretsFromPaths(paths: string[]): void {
  for (const p of paths) {
    if (!fs.existsSync(p)) continue;
    try {
      const raw = fs.readFileSync(p, "utf8");
      const data = JSON.parse(raw) as Record<string, unknown>;
      for (const [k, v] of Object.entries(data)) {
        if (typeof v !== "string" || !v.length) continue;
        process.env[k] = v;
      }
      // Không return sớm: file đầu có thể là `{}` (build thiếu env); file sau vẫn cần được thử.
    } catch {
      /* try next path */
    }
  }
}

/**
 * Netlify: PEM/token trong `netlify/.runtime-secrets.json`. Gọi sau khi đã load `.env`.
 */
function injectNetlifyRuntimeSecrets(packageRoot: string): void {
  injectNetlifyRuntimeSecretsFromPaths(collectRuntimeSecretPaths(packageRoot));
}

/** Thư mục gốc package (có `package.json`), dùng resolve `file:./…` SQLite khi cwd khác. */
export function getPackageRootSync(fromDir: string = moduleDir): string {
  let dir = path.resolve(fromDir);
  for (;;) {
    if (fs.existsSync(path.join(dir, "package.json"))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      return process.cwd();
    }
    dir = parent;
  }
}

/**
 * Load `.env` / `.env.local` from this package root, then merge `process.cwd()/.env`
 * when it is a different file (override). Hỗ trợ `node dist/index.js` với cwd khác thư mục package.
 */
export function loadDotenv(): void {
  // Trước `didLoad`: luôn thử inject JSON (Lambda cold start / bundle một file).
  injectNetlifyRuntimeSecretsFromPaths(
    collectRuntimeSecretPaths(getPackageRootSync(moduleDir)),
  );

  if (didLoad) return;
  didLoad = true;

  let packageRoot: string | null = null;
  let dir = path.resolve(moduleDir);
  for (;;) {
    if (fs.existsSync(path.join(dir, "package.json"))) {
      packageRoot = dir;
      const envPath = path.join(dir, ".env");
      const localPath = path.join(dir, ".env.local");
      if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
      if (fs.existsSync(localPath)) dotenv.config({ path: localPath, override: true });
      break;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  const cwdEnvPath = path.join(process.cwd(), ".env");
  if (fs.existsSync(cwdEnvPath)) {
    const cwdAbs = path.resolve(cwdEnvPath);
    const pkgEnvAbs = packageRoot
      ? path.resolve(packageRoot, ".env")
      : null;
    if (!pkgEnvAbs || cwdAbs !== pkgEnvAbs) {
      dotenv.config({ path: cwdEnvPath, override: true });
    }
  } else {
    dotenv.config();
  }

  const root = packageRoot ?? getPackageRootSync();
  injectNetlifyRuntimeSecrets(root);
}
