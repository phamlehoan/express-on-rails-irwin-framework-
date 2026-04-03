type HttpMethod = "get" | "post" | "put" | "delete" | "patch";

/** Schema shorthand: { field: "string" } → OpenAPI schema */
type SchemaShorthand = Record<string, string>;

/** Response shorthand: { 200: "OK" } → OpenAPI responses */
type ResponseShorthand = Record<number | string, string>;

type ValidatorWithSchema = new () => object & {
  schema?: Record<string, string>;
  required?: readonly string[];
};

export interface DocOptions {
  path: string;
  summary?: string;
  tags?: string[];
  /** Validator class (có .schema) hoặc shorthand */
  params?: SchemaShorthand | ValidatorWithSchema;
  /** Validator class (có .schema, .required) hoặc shorthand */
  body?: SchemaShorthand | ValidatorWithSchema;
  requiredBody?: string[];
  file?: boolean;
  responses?: ResponseShorthand;
  auth?: boolean;
}

/**
 * Tạo swagger operation từ shorthand - gọn hơn JSON thuần.
 */
export function buildSwaggerOp(opts: DocOptions): Record<string, unknown> {
  const { path: _path, auth, ...rest } = opts;
  const op: Record<string, unknown> = {};

  if (rest.summary) op.summary = rest.summary;
  if (rest.tags) op.tags = rest.tags;

  if (rest.params && Object.keys(rest.params).length) {
    const toSchema = (v: string) => {
      if (v === "number") return { type: "number" as const };
      if (v === "string[]" || v === "array")
        return { type: "array" as const, items: { type: "string" } };
      return { type: "string" as const };
    };
    op.parameters = Object.entries(rest.params).map(([name, type]) => ({
      name,
      in: "query",
      schema: toSchema(type),
    }));
  }

  if (rest.file) {
    op.requestBody = {
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            properties: { file: { type: "string", format: "binary" } },
          },
        },
      },
    };
  } else if (rest.body && Object.keys(rest.body).length) {
    const required = rest.requiredBody ?? Object.keys(rest.body);
    const toSchema = (v: string) => {
      if (v === "number") return { type: "number" };
      if (v === "string[]" || v === "array")
        return { type: "array", items: { type: "string" } };
      return { type: "string" };
    };
    op.requestBody = {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required,
            properties: Object.fromEntries(
              Object.entries(rest.body).map(([k, v]) => [k, toSchema(v)]),
            ),
          },
        },
      },
    };
  }

  if (rest.responses) {
    op.responses = Object.fromEntries(
      Object.entries(rest.responses).map(([code, desc]) => [
        code,
        { description: desc },
      ]),
    );
  }

  if (auth) op.security = [{ bearerAuth: [] }];

  return op;
}
