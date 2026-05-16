#!/usr/bin/env node
/**
 * Nạp `.env` trong thư mục package (nếu có) rồi chạy lệnh con.
 * CI: GitHub Actions map từng secret vào `env` của bước Build (hoặc ghi `.env`); nếu không có file `.env`,
 * lệnh con vẫn nhận đủ biến qua `process.env` từ bước workflow.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const envPath = path.join(root, ".env");

const idx = process.argv.indexOf("--");
const parts = idx === -1 ? process.argv.slice(2) : process.argv.slice(idx + 1);
if (parts.length === 0) {
  console.error("Usage: node scripts/runWithDotenv.mjs -- <command> [args...]");
  process.exit(1);
}

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath, override: true });
}

const [cmd, ...args] = parts;
const r = spawnSync(cmd, args, {
  stdio: "inherit",
  env: process.env,
  cwd: root,
  shell: false,
});
process.exit(r.status === null ? 1 : r.status);
