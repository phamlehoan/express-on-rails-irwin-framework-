let swaggerDocument: any = {};

/**
 * Sets the base Swagger document object. This should be called once during application setup.
 * @param doc The base Swagger document.
 */
export function setSwaggerDocument(doc: any) {
  swaggerDocument = doc;
  // Ensure paths object exists
  if (!swaggerDocument.paths) {
    swaggerDocument.paths = {};
  }
}

/**
 * Registers a new path and operation in the Swagger document.
 * @param path The API path (e.g., '/users/{id}').
 * @param method The HTTP method (e.g., 'get', 'post').
 * @param operation The OpenAPI operation object.
 */
export function registerSwaggerPath(
  path: string,
  method: string,
  operation: any,
) {
  if (!swaggerDocument.paths[path]) {
    swaggerDocument.paths[path] = {};
  }
  swaggerDocument.paths[path][method] = operation;
}

/**
 * Returns the complete Swagger document object.
 * @returns The Swagger document.
 */
export function getSwaggerDocs() {
  return swaggerDocument;
}
