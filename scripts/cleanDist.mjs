#!/usr/bin/env node
/**
 * Xóa thư mục `dist/` trước `tsc` để không còn file JS cũ (vd. `configs/env.js`
 * che `configs/env/index.js` sau khi đổi cấu trúc thư mục).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(root, "dist");

fs.rmSync(distDir, { recursive: true, force: true });
