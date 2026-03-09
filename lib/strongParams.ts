import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { UnprocessableEntityError } from "./errors";
import { formatValidationErrors } from "@models/concerns/validatable";

/**
 * Strong Parameters - Rails style: params.require(:model).permit(:field1, :field2)
 * params(Model).permit('id', 'name') - Model: class-validator class.
 * - Prisma: thêm prisma-class-validator-generator nếu cần params(User).permit(...) với User từ schema.
 * - Custom: tạo Validator class riêng (CreateUserValidator, etc.) cho trường hợp đặc biệt.
 */

/** Constructor type để InstanceType<M> suy ra đúng kiểu instance, không bị rút gọn thành object */
export type ValidatorClass = new (...args: any[]) => any;

/**
 * Whitelist: chỉ giữ các field được permit, bỏ phần còn lại.
 * Validate qua class-validator nếu Model có decorators.
 */
export async function strongParams<T extends object>(
  input: unknown,
  ValidatorCls: new () => T,
  fields: string[]
): Promise<T> {
  const data = (input ?? {}) as Record<string, unknown>;
  const picked: Record<string, unknown> = {};
  for (const f of fields) {
    if (f in data) picked[f] = data[f];
  }
  const instance = plainToInstance(ValidatorCls, picked, {
    enableImplicitConversion: true,
  });
  const errors = await validate(instance as object, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  if (errors.length > 0) {
    const formatted = formatValidationErrors(errors);
    throw new UnprocessableEntityError("Validation failed", formatted);
  }
  return instance as T;
}

export class ParamsProxy<M extends ValidatorClass = ValidatorClass> {
  constructor(
    private readonly data: Record<string, unknown>,
    private readonly Model?: M
  ) {}

  /**
   * require(key) - Rails: params.require(:user), trả về nested.
   */
  require(key: string): ParamsProxy<M> {
    const value = this.data[key];
    if (value === undefined || value === null) {
      throw new UnprocessableEntityError(
        `param is missing or the value is empty: ${key}`
      );
    }
    const obj =
      typeof value === "object" && value !== null
        ? (value as Record<string, unknown>)
        : {};
    return new ParamsProxy<M>(obj, this.Model);
  }

  /**
   * permit(...fields) - Rails: chỉ giữ các field được phép.
   * Model (từ params(Model)) dùng để validate qua class-validator.
   */
  async permit(...fields: string[]): Promise<InstanceType<M>> {
    if (!this.Model) {
      throw new Error("params(Model).permit(...) - Model is required");
    }
    return strongParams(this.data, this.Model, fields) as Promise<InstanceType<M>>;
  }

  get(key: string): unknown {
    return this.data[key];
  }
}

type ParamsProxyWithData = ParamsProxy & Record<string, any>;

function wrapProxy(proxy: ParamsProxy): ParamsProxyWithData {
  return new Proxy(proxy, {
    get(target, prop: string) {
      if (prop === "require") return target.require.bind(target);
      if (prop === "permit") return target.permit.bind(target);
      if (prop === "get") return target.get.bind(target);
      return (target as any).data[prop];
    },
  }) as ParamsProxyWithData;
}

/**
 * params(Model) - Rails: Model là type/schema (Prisma-generated hoặc custom Validator).
 * permit('field1', 'field2') - whitelist + validate.
 *
 * @example
 * // Flat
 * await params(CreateUserValidator).permit('firstName', 'lastName', 'email', 'roleIds');
 *
 * // Nested: body = { user: { firstName, lastName } }
 * await params(CreateUserValidator).require('user').permit('firstName', 'lastName', 'email');
 */
export type ParamsWithModel<M extends ValidatorClass> = ParamsProxyWithData & {
  permit: (...fields: string[]) => Promise<InstanceType<M>>;
  require: (key: string) => ParamsWithModel<M>;
};

export function createParamsProxy(
  data: Record<string, unknown>
): (<M extends ValidatorClass>(Model: M) => ParamsWithModel<M>) & ParamsProxyWithData {
  const root = new ParamsProxy(data);
  const result = wrapProxy(root);

  const callable = <M extends ValidatorClass>(Model: M): ParamsWithModel<M> => {
    const proxy = new ParamsProxy<M>(data, Model);
    return proxy as unknown as ParamsWithModel<M>;
  };

  return Object.assign(callable, result) as (<M extends ValidatorClass>(
    Model: M
  ) => ParamsWithModel<M>) &
    ParamsProxyWithData;
}
