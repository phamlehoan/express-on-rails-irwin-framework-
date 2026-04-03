import fs from "fs";
import path from "path";

const root = process.cwd();
const directories = ["app", "rails", "configs"];
const tags = ["TODO", "FIXME", "OPTIMIZE"];

console.info("\n--- PROJECT NOTES ---\n");

let totalNotes = 0;

const scanDir = (dir: string) => {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (file !== "node_modules" && file !== "dist") {
        scanDir(fullPath);
      }
    } else if (
      file.endsWith(".ts") ||
      file.endsWith(".js") ||
      file.endsWith(".pug")
    ) {
      const content = fs.readFileSync(fullPath, "utf-8");
      const lines = content.split("\n");

      lines.forEach((line, index) => {
        tags.forEach((tag) => {
          if (line.includes(tag)) {
            const cleanLine = line.substring(line.indexOf(tag)).trim();
            const relativePath = path.relative(root, fullPath);

            // In màu cho tag
            const tagColor =
              tag === "FIXME"
                ? "\x1b[31m"
                : tag === "TODO"
                  ? "\x1b[33m"
                  : "\x1b[36m";

            console.info(
              `${tagColor}${tag.padEnd(8)}\x1b[0m \x1b[90m${relativePath}:${index + 1}\x1b[0m`,
            );
            console.info(`         ${cleanLine}\n`);
            totalNotes++;
          }
        });
      });
    }
  });
};

directories.forEach((dir) => {
  const fullPath = path.join(root, dir);
  if (fs.existsSync(fullPath)) scanDir(fullPath);
});

if (totalNotes === 0) {
  console.info("No notes found. Your code is clean! ✨");
} else {
  console.info(`Total: ${totalNotes} notes found.\n`);
}
