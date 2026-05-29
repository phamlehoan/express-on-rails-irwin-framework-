import env from "@configs/env";
import { Express } from "express";
import { getSwaggerDocs, setSwaggerDocument, setupSwaggerUI } from "ts-rails";

let swaggerInitialized = false;

export function initSwaggerDocument(): void {
  if (swaggerInitialized) return;
  swaggerInitialized = true;

  setSwaggerDocument({
    openapi: "3.0.0",
    info: {
      title: "Irwin Framework API",
      version: "1.0.0",
      description: "API documentation for JSON API routes under /api",
    },
    servers: [
      {
        url: `http://localhost:${env.port}/api/v1`,
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT access token from POST /api/v1/auth/login",
        },
      },
    },
    security: [{ bearerAuth: [] }],
    paths: {},
  });
}

export function setupSwagger(app: Express) {
  initSwaggerDocument();
  setupSwaggerUI(app, getSwaggerDocs);
}
