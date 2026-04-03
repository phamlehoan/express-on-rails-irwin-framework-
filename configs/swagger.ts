import env from "@configs/env";
import { getSwaggerDocs, setSwaggerDocument, setupSwaggerUI } from "@rails";
import { Express } from "express";

setSwaggerDocument({
  openapi: "3.0.0",
  info: {
    title: "Irwin Framework API",
    version: "1.0.0",
    description: "API documentation for the Irwin Framework application",
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
      },
    },
  },
  paths: {},
});

export function setupSwagger(app: Express) {
  const swaggerDocs = getSwaggerDocs();
  setupSwaggerUI(app, swaggerDocs);
}
