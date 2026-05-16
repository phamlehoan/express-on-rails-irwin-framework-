/**
 * Netlify/AWS Lambda: tổng env (tên + giá trị) mà Netlify gửi vào Lambda ≤ ~4KB.
 * Script ghi JSON lúc build (`loadDotenv` nạp khi chạy):
 *   • netlify/.runtime-secrets.json
 *   • netlify/functions/.runtime-secrets.json — bản sao cạnh handler (một số bundle đặt file kèm server.js).
 * `DATABASE_URL` không được ghi vào file (Lambda chỉ dùng TURSO_* cho DB).
 *
 * Quan trọng: file JSON **không** làm giảm env trên Lambda. Anh phải **tắt scope "Functions"**
 * (giữ "Builds") cho các biến đã được ghi vào file — xem `netlify.toml` đầu file.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "netlify");
const outFile = path.join(outDir, ".runtime-secrets.json");
const outFileNextToHandler = path.join(outDir, "functions", ".runtime-secrets.json");

/** Khớp biến site thường dùng + `configs/env/index.ts` — ghi nếu có trong `process.env`. */
const DEFAULT_KEYS = [
  "APP_ENV",
  "APP_URL",
  "CLIENT_APP_URL",
  "CLIENT_APP_HASH_ROUTER",
  "DB_MAX_CONNECTIONS",
  "EMAIL_FROM",
  "FCM_CLIENT_EMAIL",
  "FCM_PRIVATE_KEY",
  "FCM_PROJECT_ID",
  "GOOGLE_AI_API_KEY",
  "GOOGLE_AI_MODEL_FALLBACK",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_REDIRECT_URI",
  "GOOGLE_REFRESH_TOKEN",
  "JWT_SECRET",
  "MAIL_HOST",
  "MAIL_PASS",
  "MAIL_PORT",
  "MAIL_SERVICE",
  "MAIL_USER",
  "PORT",
  "SEARCH",
  "SESSION_SECRET",
  "STORAGE_SERVICE",
  "SUPABASE_KEY",
  "SUPABASE_URL",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "CLOUDINARY_CLOUD_NAME",
  "TURSO_AUTH_TOKEN",
  "TURSO_DATABASE_URL",
  "REDIS_HOST",
  "REDIS_PORT",
];

const extra = (process.env.NETLIFY_RUNTIME_SECRET_KEYS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const keys = [...new Set([...DEFAULT_KEYS, ...extra])];

const obj = {};
for (const k of keys) {
  const v = process.env[k];
  if (v != null && String(v).trim() !== "") obj[k] = v;
}

// Lambda: app chỉ đọc DB qua TURSO_*; không đưa DATABASE_URL vào file (tránh ghi đè / nhầm file:).
delete obj.DATABASE_URL;

fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(path.dirname(outFileNextToHandler), { recursive: true });
const json = JSON.stringify(obj);
fs.writeFileSync(outFile, json, "utf8");
fs.writeFileSync(outFileNextToHandler, json, "utf8");
console.log(
  `[netlify] wrote ${Object.keys(obj).length} key(s) to ${path.relative(root, outFile)} and ${path.relative(root, outFileNextToHandler)}`,
);

if (process.env.NETLIFY === "true" || process.env.CONTEXT) {
  if (!obj.TURSO_DATABASE_URL || !obj.TURSO_AUTH_TOKEN) {
    console.warn(
      "[netlify] WARNING: TURSO_DATABASE_URL and/or TURSO_AUTH_TOKEN missing in build env — JSON will not contain DB secrets; fix CI .env / runWithDotenv before deploy.",
    );
  }
  console.log(`
┌──────────────────────────────────────────────────────────────────────────────┐
│ Netlify Functions + AWS Lambda: giới hạn ~4KB cho TOÀN BỘ biến env function. │
│                                                                              │
│ Nếu deploy báo "environment variables exceed the 4KB limit":                 │
│   Site configuration → Environment variables → mở TỪNG biến → Scopes       │
│   → BẬT "Builds" → TẮT "Functions" (và Edge nếu có) cho các biến dài /     │
│   toàn bộ biến đã được ghi vào netlify/.runtime-secrets.json (an toàn vì   │
│   app đọc file lúc cold start). Giữ "Functions" chỉ cho biến cực ngắn nếu   │
│   cần (thường không cần).                                                    │
│   https://docs.netlify.com/build/environment-variables/overview/#scopes      │
└──────────────────────────────────────────────────────────────────────────────┘
`);
}
