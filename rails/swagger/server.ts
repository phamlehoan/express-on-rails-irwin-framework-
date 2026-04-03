import { Express } from "express";
import swaggerUi from "swagger-ui-express";

/**
 * Setup Swagger UI routes for the Express app.
 * @param app Express application instance
 * @param swaggerDocs Swagger documentation object
 * @param path Path to serve Swagger UI (default: /docs)
 */
export function setupSwaggerUI(app: Express, swaggerDocs: any, path = "/docs") {
  // Serve the Swagger JSON
  app.get("/swagger.json", (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerDocs);
  });

  // Serve the Swagger UI
  app.use(
    path,
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocs, {
      swaggerOptions: { persistAuthorization: true },
    }),
  );
}
