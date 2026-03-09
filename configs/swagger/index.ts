import type { Express } from "express";
import { getMergedPaths } from "./registry";

/** Paths từ API root (không nằm trong v1) */
const apiRootPaths = {
  "/health": {
    get: {
      summary: "Health check",
      tags: ["System"],
      responses: { 200: { description: "OK" } },
    },
  },
};

/** Paths cho permissions (có thể tách ra permissions.route.ts sau) */
const permissionsPaths = {
  "/permissions/me": {
    get: {
      summary: "Get current user permissions",
      tags: ["Permissions"],
      security: [{ bearerAuth: [] }],
      responses: {
        200: { description: "Success" },
        403: { description: "Unauthorized" },
      },
    },
  },
};

export function setupSwagger(app: Express) {
  const mergedFromRoutes = getMergedPaths();
  const allPaths = Object.assign(
    {},
    apiRootPaths,
    permissionsPaths,
    mergedFromRoutes
  );

  const swaggerDocument = {
    openapi: "3.0.0",
    info: {
      title: "Irwin Framework API",
      version: "1.0.0",
      description: "API documentation - Rails-style Express + TypeScript",
    },
    servers: [{ url: "/api/v1", description: "API v1" }],
    paths: allPaths,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  };

  const swaggerUi = require("swagger-ui-express");
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}
