import fs from "fs";
import path from "path";
import pluralize from "pluralize";

const args = process.argv.slice(2);
if (args.length < 1) {
  console.error("Usage: yarn g:model ModelName field:type field:type");
  process.exit(1);
}

const modelName = pluralize.singular(args[0]);
const fields = args.slice(1).map((f) => {
  const [name, type] = f.split(":");
  return { name, type: type || "string" };
});

const typeMap: Record<string, string> = {
  string: "String",
  int: "Int",
  boolean: "Boolean",
  datetime: "DateTime",
  float: "Float",
  json: "Json",
};

const root = process.cwd();
const schemaPath = path.join(root, "configs/db/schema.prisma");

if (!fs.existsSync(schemaPath)) {
  console.error(`[Error] Schema not found at ${schemaPath}`);
  process.exit(1);
}

const modelTemplate = `
model ${modelName} {
  id        String   @id @default(uuid())
${fields.map((f) => `  ${f.name.padEnd(10)} ${typeMap[f.type.toLowerCase()] || "String"}`).join("\n")}
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
`;

try {
  fs.appendFileSync(schemaPath, modelTemplate);
  console.log(`\x1b[32mUPDATE\x1b[0m configs/db/schema.prisma`);
  console.log(`
\x1b[33mNext Steps:\x1b[0m
1. Run: \x1b[36myarn db:migrate\x1b[0m to update database.
2. Your model is ready to use via \x1b[35mmodels.${modelName.toLowerCase()}\x1b[0m
`);
} catch (err) {
  console.error("Failed to update schema:", err);
}
