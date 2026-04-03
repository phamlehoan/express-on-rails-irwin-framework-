import fs from "fs";
import path from "path";
import pluralize from "pluralize";

const args = process.argv.slice(2);
if (args.length < 1) {
  console.error("Usage: yarn g:controller Name [action action...]");
  process.exit(1);
}

const inputName = args[0]; // Ví dụ: Admin/User
const actions = args.slice(1);

const parts = inputName.split("/");
const rawName = parts.pop()!; // User
const subDir = parts.join("/").toLowerCase(); // admin

const nameLower = rawName.toLowerCase();
const namePlural = pluralize(nameLower); // categories

// AdminUsersController
const classNamePrefix = parts
  .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
  .join("");
const controllerClassName = `${classNamePrefix}${pluralize(rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase())}Controller`;

const root = process.cwd();
const controllerDir = path.join(root, "app/controllers", subDir);
const controllerPath = path.join(controllerDir, `${namePlural}.controller.ts`);
const testPath = path.join(
  controllerDir,
  "__tests__",
  `${namePlural}.controller.spec.ts`,
);
const viewsDir = path.join(root, "app/views", subDir, namePlural);

// Kiểm tra lớp cha (Base Class)
const hasAppController = fs.existsSync(
  path.join(root, "app/controllers/application.controller.ts"),
);
const baseClass = hasAppController
  ? "ApplicationController"
  : "RailsController";
const importBase = hasAppController
  ? `import { ApplicationController } from "@controllers/application.controller";`
  : `import { RailsController } from "@rails";`;

// 1. Template Controller
const template = `import { Request, Response } from "express";
${importBase}

export class ${controllerClassName} extends ${baseClass} {
${actions
  .map(
    (action) => `  async ${action}(req: Request, res: Response) {
    res.render("${subDir ? subDir + "/" : ""}${namePlural}/${action}");
  }`,
  )
  .join("\n\n")}
}
`;

// 1b. Template Test (Jest)
const testTemplate = `import { ${controllerClassName} } from "../${namePlural}.controller";

describe("${controllerClassName}", () => {
  let controller: ${controllerClassName};

  beforeEach(() => {
    controller = new ${controllerClassName}();
  });

${actions
  .map(
    (action) => `  describe("${action}", () => {
    it("should be defined", () => {
      expect(controller.${action}).toBeDefined();
    });
  });`,
  )
  .join("\n")}
});
`;

const writeFile = (filePath: string, content: string) => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content);
  console.log(`\x1b[32mCREATE\x1b[0m ${path.relative(root, filePath)}`);
};

writeFile(controllerPath, template);
writeFile(testPath, testTemplate);

// 2. Create Views for each action
actions.forEach((action) => {
  const viewPath = path.join(viewsDir, `${action}.pug`);
  const viewTemplate = `extends ../layouts/application

block content
  h1 ${controllerClassName}#${action}
  p Find me in app/views/${subDir ? subDir + "/" : ""}${namePlural}/${action}.pug
`;
  writeFile(viewPath, viewTemplate);
});

const routePath = subDir ? `/${subDir}/${namePlural}` : `/${namePlural}`;
const viewRef = subDir ? `${subDir}/${namePlural}` : namePlural;

console.log(`
\x1b[33mNext Steps:\x1b[0m
Register routes in \x1b[35mapp/routes/index.ts\x1b[0m:
  this.get("${routePath}/${actions[0] || "index"}", action(${controllerClassName}, "${actions[0] || "index"}"));
`);
