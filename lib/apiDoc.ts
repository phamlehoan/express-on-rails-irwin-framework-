/**
 * @ApiDoc - decorator cho Swagger metadata trên controller.
 * params/body có thể truyền Validator class (có static schema) - gọn nhất.
 */

type SchemaShorthand = Record<string, string>;
type ResponseShorthand = Record<number | string, string>;

type ValidatorWithSchema = new () => object & {
  schema?: Record<string, string>;
  required?: readonly string[];
};

export interface ApiDocOptions {
  summary?: string;
  tags?: string[];
  auth?: boolean;
  /** Query params: Validator class (có .schema) hoặc SchemaShorthand */
  params?: SchemaShorthand | ValidatorWithSchema;
  /** Body: Validator class (có .schema, .required) hoặc SchemaShorthand */
  body?: SchemaShorthand | ValidatorWithSchema;
  requiredBody?: string[];
  file?: boolean;
  responses?: ResponseShorthand;
}

function getSchemaFromValidator(Validator: ValidatorWithSchema): { schema: SchemaShorthand; required?: string[] } {
  const v = Validator as any;
  if (v?.schema) {
    return { schema: v.schema as SchemaShorthand, required: v.required as string[] | undefined };
  }
  return { schema: {} };
}

export function resolveApiDocSchema(opts: ApiDocOptions): { params?: SchemaShorthand; body?: SchemaShorthand; requiredBody?: string[] } {
  const params = typeof opts.params === "function" ? getSchemaFromValidator(opts.params as ValidatorWithSchema).schema : opts.params;
  const body = typeof opts.body === "function" ? getSchemaFromValidator(opts.body as ValidatorWithSchema).schema : opts.body;
  const requiredBody = opts.requiredBody ?? (typeof opts.body === "function" ? getSchemaFromValidator(opts.body as ValidatorWithSchema).required : undefined);
  return { params, body, requiredBody };
}

const store = new Map<string, ApiDocOptions>();

function key(Controller: new (...args: any[]) => any, method: string) {
  return `${Controller.name}.${method}`;
}

export function ApiDoc(opts: ApiDocOptions) {
  return function (target: object, propertyKey: string) {
    const ctor = (target as any).constructor;
    store.set(key(ctor, propertyKey), opts);
  };
}

export function getApiDoc(
  Controller: new (...args: any[]) => any,
  method: string
): ApiDocOptions | undefined {
  return store.get(key(Controller, method));
}
