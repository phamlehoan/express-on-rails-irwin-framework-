import fs from "fs";
import path from "path";
import pluralize from "pluralize";

const args = process.argv.slice(2);
if (args.length < 1) {
  console.error("Usage: yarn scaffold ModelName field:type field:type");
  process.exit(1);
}

const inputName = args[0]; // Ví dụ: Admin/User
const parts = inputName.split("/");
const rawModelName = parts.pop()!; // User
const subDir = parts.join("/").toLowerCase(); // admin

const modelName = pluralize.singular(rawModelName);
const modelLower = rawModelName.toLowerCase();
const modelPlural = pluralize(modelLower); // users
const classNamePrefix = parts
  .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
  .join("");
const controllerClassName = `${classNamePrefix}${pluralize(modelName)}Controller`;

const fields = args.slice(1).map((f) => {
  const [name, type] = f.split(":");
  return { name, type: type || "string" };
});

const root = process.cwd();
const paths = {
  controller: path.join(
    root,
    "app/controllers",
    subDir,
    `${modelPlural}.controller.ts`,
  ),
  test: path.join(
    root,
    "app/controllers",
    subDir,
    "__tests__",
    `${modelPlural}.controller.spec.ts`,
  ),
  route: path.join(root, "app/routes", subDir, `${modelPlural}.route.ts`),
  viewsDir: path.join(root, "app/views", subDir, modelPlural),
};

// Kiểm tra lớp cha
const hasAppController = fs.existsSync(
  path.join(root, "app/controllers/application.controller.ts"),
);
const baseClass = hasAppController
  ? "ApplicationController"
  : "RailsController";
const importBase = hasAppController
  ? `import { ApplicationController } from "@controllers/application.controller";`
  : `import { RailsController } from "@rails";`;

// 1. Generate Controller
const controllerTemplate = `import { Request, Response } from "express";
${importBase}
import models from "@models";

export class ${controllerClassName} extends ${baseClass} {
  async index(req: Request, res: Response) {
    const ${modelPlural} = await models.${modelLower}.findMany();
    res.render("${subDir ? subDir + "/" : ""}${modelPlural}/index", { ${modelPlural} });
  }

  async show(req: Request, res: Response) {
    const ${modelLower} = await models.${modelLower}.findUnique({ where: { id: req.params.id } });
    res.render("${modelPlural}/show", { ${modelLower} });
  }

  async new(req: Request, res: Response) {
    res.render("${modelPlural}/new", { ${modelLower}: {} });
  }

  async edit(req: Request, res: Response) {
    const ${modelLower} = await models.${modelLower}.findUnique({ where: { id: req.params.id } });
    res.render("${subDir ? subDir + "/" : ""}${modelPlural}/edit", { ${modelLower} });
  }

  async create(req: Request, res: Response) {
    const params = this.params(req).permit(${fields.map((f) => `'${f.name}'`).join(", ")});
    await models.${modelLower}.create({ data: params });
    res.redirect(\`/${modelPlural}\`);
  }

  async update(req: Request, res: Response) {
    const params = this.params(req).permit(${fields.map((f) => `'${f.name}'`).join(", ")});
    await models.${modelLower}.update({
      where: { id: req.params.id },
      data: params,
    });
    res.redirect(\`/${modelPlural}/\${req.params.id}\`);
  }

  async destroy(req: Request, res: Response) {
    await models.${modelLower}.delete({ where: { id: req.params.id } });
    res.redirect(\`/${modelPlural}\`);
  }
}
`;

// 1b. Generate Test (Jest)
const testTemplate = `import { ${controllerClassName} } from "../${modelPlural}.controller";

describe("${controllerClassName}", () => {
  it("should have CRUD actions defined", () => {
    const controller = new ${controllerClassName}();
    expect(controller.index).toBeDefined();
    expect(controller.show).toBeDefined();
    expect(controller.create).toBeDefined();
    expect(controller.update).toBeDefined();
    expect(controller.destroy).toBeDefined();
  });
});
`;

// 2. Generate Route
const routeTemplate = `import { RailsRoute } from "@rails";
import { ${controllerClassName} } from "@controllers/${subDir ? subDir + "/" : ""}${modelPlural}.controller";

export class ${modelName}Route extends RailsRoute {
  draw() {
    this.resource("${modelPlural}", ${controllerClassName});
  }
}
`;

// 3. Generate Views (Index & Form)
const indexView = `extends ../layouts/application

block content
  .d-flex.justify-content-between.align-items-center.mb-4
    h1 List of ${modelName}s
    a.btn.btn-primary(href="/${modelPlural}/new") New ${modelName}

  table.table.table-striped
    thead
      tr
${fields.map((f) => `        th ${f.name.charAt(0).toUpperCase() + f.name.slice(1)}`).join("\n")}
        th Actions
    tbody
      each item in ${modelPlural}
        tr
${fields.map((f) => `          td= item.${f.name}`).join("\n")}
          td
            a.btn.btn-sm.btn-info.me-2(href=\`/${modelPlural}/\${item.id}\`) Show
            a.btn.btn-sm.btn-warning.me-2(href=\`/${modelPlural}/\${item.id}/edit\`) Edit
            form.d-inline(method="POST" action=\`/${modelPlural}/\${item.id}?_method=DELETE\`)
              button.btn.btn-sm.btn-danger(onclick="return confirm('Are you sure?')") Delete
`;

const formView = `
${fields
  .map(
    (f) => `
.mb-3
  label.form-label ${f.name.charAt(0).toUpperCase() + f.name.slice(1)}
  input.form-control(name="${f.name}" value=item.${f.name} || '')`,
  )
  .join("")}
button.btn.btn-success(type="submit") Save
`;

const newView = `extends ../layouts/application

block content
  h1 New ${modelName}
  form(method="POST" action="/${modelPlural}")
    include _form
`;

const editView = `extends ../layouts/application

block content
  h1 Edit ${modelName}
  form(method="POST" action=\`/${modelPlural}/\${${modelLower}.id}?_method=PUT\`)
    - var item = ${modelLower}
    include _form
`;

// Write files
const writeFile = (filePath: string, content: string) => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content);
  console.log(`\x1b[32mCREATE\x1b[0m ${path.relative(root, filePath)}`);
};

writeFile(paths.controller, controllerTemplate);
writeFile(paths.test, testTemplate);
writeFile(paths.route, routeTemplate);
writeFile(path.join(paths.viewsDir, "index.pug"), indexView);
writeFile(path.join(paths.viewsDir, "_form.pug"), formView);
writeFile(path.join(paths.viewsDir, "new.pug"), newView);
writeFile(path.join(paths.viewsDir, "edit.pug"), editView);

console.log(`
\x1b[33mNext Steps:\x1b[0m
1. Add the following to your prisma.schema:
   model ${modelName} {
     id String @id @default(uuid())
     ${fields.map((f) => `${f.name} ${f.type === "string" ? "String" : "Int"}`).join("\n     ")}
   }
2. Run: \x1b[36myarn db:migrate\x1b[0m
3. Register the route in \x1b[35mapp/routes/index.ts\x1b[0m:
   import { ${modelName}Route } from "./${subDir ? subDir + "/" : ""}${modelPlural}.route";
   // ... inside draw():
   this.path("/${subDir ? subDir + "/" : ""}${modelPlural}", ${modelName}Route.draw());
`);
